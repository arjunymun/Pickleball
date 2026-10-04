create schema if not exists extensions;

alter extension btree_gist set schema extensions;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'academy_customers', 'academy_courts', 'academy_allocations',
    'academy_bookings', 'academy_blocks', 'academy_memberships',
    'academy_attendance', 'academy_notes', 'academy_audit',
    'academy_requests', 'academy_payment_attempts', 'academy_payments',
    'academy_refunds', 'academy_webhook_events'
  ] loop
    execute format(
      'create policy academy_deny_client_access on public.%I for all to anon, authenticated using (false) with check (false)',
      table_name
    );
  end loop;
end $$;

create index if not exists academy_audit_actor_idx
  on public.academy_audit(actor_id);
create index if not exists academy_notes_actor_idx
  on public.academy_notes(actor_id);
create index if not exists academy_notes_customer_idx
  on public.academy_notes(customer_id);
create index if not exists academy_payment_attempts_actor_idx
  on public.academy_payment_attempts(actor_id);
create index if not exists academy_payments_booking_idx
  on public.academy_payments(booking_id);
create index if not exists academy_payments_membership_idx
  on public.academy_payments(membership_id);
create index if not exists academy_refunds_booking_idx
  on public.academy_refunds(booking_id);
create index if not exists academy_refunds_payment_idx
  on public.academy_refunds(payment_id);
