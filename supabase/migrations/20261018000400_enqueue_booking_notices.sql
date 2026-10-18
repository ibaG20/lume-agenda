create function public.enqueue_client_booking_notice()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.notice_outbox (provider_id, event_type, appointment_id)
  values (new.provider_id, 'CLIENT_BOOKED', new.id)
  on conflict (event_type, appointment_id) do nothing;

  return new;
end;
$$;

create trigger appointment_enqueue_client_booking_notice
after insert on public."Appointment"
for each row
execute function public.enqueue_client_booking_notice();

revoke execute on function public.enqueue_client_booking_notice() from public, anon, authenticated;
grant execute on function public.enqueue_client_booking_notice() to service_role;
