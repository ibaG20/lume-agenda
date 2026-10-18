create type public.notice_event_type as enum ('CLIENT_CANCELLED');
create type public.notice_status as enum ('OPEN', 'DISMISSED');
create type public.notice_push_status as enum (
  'PENDING',
  'PROCESSING',
  'SENT',
  'SKIPPED',
  'FAILED'
);

create table public.notice_outbox (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles (id) on delete cascade,
  event_type public.notice_event_type not null,
  appointment_id uuid not null references public."Appointment" (id) on delete cascade,
  status public.notice_status not null default 'OPEN',
  push_status public.notice_push_status not null default 'PENDING',
  push_attempt_count integer not null default 0 check (push_attempt_count >= 0),
  push_available_at timestamptz not null default now(),
  push_locked_at timestamptz,
  created_at timestamptz not null default now(),
  dismissed_at timestamptz,
  constraint notice_outbox_one_event unique (event_type, appointment_id)
);

create table public.push_subscription (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null check (char_length(endpoint) between 12 and 2000),
  p256dh text not null check (char_length(p256dh) between 8 and 300),
  auth_key text not null check (char_length(auth_key) between 8 and 300),
  created_at timestamptz not null default now(),
  constraint push_subscription_one_endpoint unique (provider_id, endpoint)
);

create index notice_outbox_open_idx
  on public.notice_outbox (provider_id, created_at desc)
  where status = 'OPEN';

create index notice_outbox_push_idx
  on public.notice_outbox (push_available_at, created_at)
  where push_status in ('PENDING', 'FAILED');

comment on table public.notice_outbox is
  'Server-only provider notices. Text is resolved from appointment_id so the queue does not store a second copy of personal data.';
comment on table public.push_subscription is
  'Server-only Web Push subscription for the provider PWA. Endpoints are credentials and must not be logged.';

alter table public.notice_outbox enable row level security;
alter table public.push_subscription enable row level security;

revoke all on table public.notice_outbox from anon, authenticated;
revoke all on table public.push_subscription from anon, authenticated;
grant all on table public.notice_outbox to service_role;
grant all on table public.push_subscription to service_role;

create or replace function public.cancel_appointment_by_token(
  p_token uuid,
  p_idempotency_key uuid,
  p_request_hash text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_record public.idempotency_record%rowtype;
  appointment_record public."Appointment"%rowtype;
  result jsonb;
begin
  perform pg_advisory_xact_lock(hashtextextended('cancel-token:' || p_idempotency_key::text, 0));

  select * into existing_record
  from public.idempotency_record
  where operation = 'cancel_appointment_by_token'
    and idempotency_key = p_idempotency_key;

  if found then
    if existing_record.request_hash <> p_request_hash then
      return jsonb_build_object('kind', 'key_conflict');
    end if;
    return existing_record.response || jsonb_build_object('kind', 'idempotent');
  end if;

  select * into appointment_record
  from public."Appointment"
  where cancellation_token = p_token
  for update;

  if not found then
    return jsonb_build_object('kind', 'not_found');
  end if;

  if appointment_record.status = 'CANCELLED' then
    return jsonb_build_object(
      'kind', 'idempotent',
      'appointmentId', appointment_record.id,
      'status', 'CANCELLED'
    );
  end if;

  update public."Appointment"
  set status = 'CANCELLED'
  where id = appointment_record.id;

  insert into public.notice_outbox (provider_id, event_type, appointment_id)
  values (
    appointment_record.provider_id,
    'CLIENT_CANCELLED',
    appointment_record.id
  )
  on conflict (event_type, appointment_id) do nothing;

  result := jsonb_build_object(
    'kind', 'cancelled',
    'appointmentId', appointment_record.id,
    'status', 'CANCELLED'
  );

  insert into public.idempotency_record (
    operation,
    idempotency_key,
    request_hash,
    response
  ) values (
    'cancel_appointment_by_token',
    p_idempotency_key,
    p_request_hash,
    result
  );

  return result;
end;
$$;

create function public.claim_notice_push(p_limit integer default 20)
returns setof public.notice_outbox
language sql
security invoker
set search_path = ''
as $$
  with candidates as (
    select id
    from public.notice_outbox
    where (
      push_status in ('PENDING', 'FAILED')
      or (
        push_status = 'PROCESSING'
        and push_locked_at < now() - interval '10 minutes'
      )
    )
      and push_available_at <= now()
      and push_attempt_count < 5
      and status = 'OPEN'
    order by created_at
    for update skip locked
    limit greatest(1, least(p_limit, 100))
  )
  update public.notice_outbox as notice
  set push_status = 'PROCESSING',
      push_locked_at = now(),
      push_attempt_count = push_attempt_count + 1
  from candidates
  where notice.id = candidates.id
  returning notice.*;
$$;

create function public.complete_notice_push(
  p_id uuid,
  p_result text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_result not in ('SENT', 'SKIPPED', 'FAILED') then
    raise exception 'invalid notice push result';
  end if;

  update public.notice_outbox
  set push_status = case
        when p_result = 'FAILED' and push_attempt_count >= 5 then 'SKIPPED'::public.notice_push_status
        else p_result::public.notice_push_status
      end,
      push_locked_at = null,
      push_available_at = case
        when p_result = 'FAILED'
          then now() + make_interval(secs => least(3600, (power(2, least(push_attempt_count, 8)) * 30)::integer))
        else push_available_at
      end
  where id = p_id
    and push_status = 'PROCESSING';
end;
$$;

revoke execute on function public.claim_notice_push(integer) from public, anon, authenticated;
revoke execute on function public.complete_notice_push(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_notice_push(integer) to service_role;
grant execute on function public.complete_notice_push(uuid, text) to service_role;
