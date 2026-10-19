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

  insert into public.email_outbox (event_type, appointment_id)
  values ('CLIENT_CANCELLED', appointment_record.id)
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
