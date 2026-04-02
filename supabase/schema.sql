create extension if not exists "pgcrypto";

create type admin_role_kind as enum ('owner', 'staff');
create type confirmation_mode as enum ('instant', 'review');
create type slot_payment_mode as enum ('online', 'pay_at_venue', 'hybrid');
create type availability_state as enum ('open', 'limited', 'booked');
create type booking_status as enum ('requested', 'confirmed', 'canceled', 'completed', 'no_show', 'credited');
create type booking_payment_status as enum ('pending', 'paid_online', 'pay_at_venue', 'credit_applied');
create type offer_status as enum ('active', 'scheduled', 'expired');
create type wallet_entry_kind as enum (
  'credit_added',
  'credit_spent',
  'pack_restored',
  'promo_credit',
  'membership_benefit_credit',
  'manual_adjustment',
  'refund_credit'
);

create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tagline text not null,
  location text not null,
  timezone text not null default 'Asia/Kolkata',
  story text not null
);

create table courts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  surface text not null,
  lighting boolean not null default false,
  outlook text not null
);

create table users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  phone text
);

create table customer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  joined_at timestamptz not null default now(),
  favorite_window text,
  skill_band text,
  tags text[] not null default '{}',
  unique (user_id, venue_id)
);

create table admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  venue_id uuid not null references venues(id) on delete cascade,
  kind admin_role_kind not null,
  unique (user_id, venue_id)
);

create table slot_templates (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  duration_minutes integer not null,
  confirmation_mode confirmation_mode not null,
  payment_mode slot_payment_mode not null,
  price_inr integer not null,
  description text not null
);

create table bookable_slots (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  template_id uuid not null references slot_templates(id) on delete restrict,
  court_id uuid not null references courts(id) on delete restrict,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  duration_minutes integer not null,
  capacity integer not null default 4,
  price_inr integer not null,
  payment_mode slot_payment_mode not null,
  confirmation_mode confirmation_mode not null,
  availability_state availability_state not null default 'open',
  label text not null
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references bookable_slots(id) on delete cascade,
  customer_id uuid not null references customer_profiles(id) on delete cascade,
  booked_at timestamptz not null default now(),
  status booking_status not null,
  payment_status booking_payment_status not null,
  attendees integer not null default 1
);

create table booking_payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  amount_inr integer not null,
  mode text not null,
  status booking_payment_status not null
);

create table pack_products (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  price_inr integer not null,
  included_credits integer not null,
  valid_days integer not null,
  description text not null
);

create table membership_plans (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  monthly_price_inr integer not null,
  included_credits integer not null,
  perks text[] not null default '{}'
);

create table customer_packs (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customer_profiles(id) on delete cascade,
  product_id uuid not null references pack_products(id) on delete restrict,
  credits_remaining integer not null,
  expires_at timestamptz not null
);

create table customer_memberships (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customer_profiles(id) on delete cascade,
  plan_id uuid not null references membership_plans(id) on delete restrict,
  status text not null,
  renews_at timestamptz not null
);

create table wallet_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customer_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  amount_inr integer not null,
  kind wallet_entry_kind not null,
  note text not null
);

create table offers (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references venues(id) on delete cascade,
  name text not null,
  status offer_status not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  headline text not null,
  audience text not null,
  redemption_cap integer not null,
  slot_scope text not null
);

create table offer_redemptions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references offers(id) on delete cascade,
  customer_id uuid not null references customer_profiles(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  credit_value_inr integer not null
);

create table attendance_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  customer_id uuid not null references customer_profiles(id) on delete cascade,
  attended_at timestamptz not null
);

create table customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customer_profiles(id) on delete cascade,
  authored_by text not null,
  created_at timestamptz not null default now(),
  body text not null
);

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  created_user_id uuid;
  default_venue_id uuid;
begin
  insert into public.users (auth_user_id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, 'player@sideout.club'), '@', 1)),
    coalesce(new.email, concat('user-', new.id::text, '@sideout.local')),
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (email) do update
    set auth_user_id = excluded.auth_user_id,
        full_name = excluded.full_name,
        phone = coalesce(excluded.phone, public.users.phone)
  returning id into created_user_id;

  select id
  into default_venue_id
  from public.venues
  order by name
  limit 1;

  if default_venue_id is not null then
    insert into public.customer_profiles (user_id, venue_id, favorite_window, skill_band, tags)
    values (created_user_id, default_venue_id, 'Flexible', 'All levels', '{}')
    on conflict (user_id, venue_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_auth_user_created();

create or replace function public.is_profile_owner(profile_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from customer_profiles
    join users on users.id = customer_profiles.user_id
    where customer_profiles.id = profile_uuid
      and users.auth_user_id = auth.uid()
  );
$$;

create or replace function public.is_admin_for_venue(venue_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from admin_roles
    join users on users.id = admin_roles.user_id
    where admin_roles.venue_id = venue_uuid
      and users.auth_user_id = auth.uid()
  );
$$;

create or replace function public.is_admin_for_customer(profile_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from customer_profiles
    join admin_roles on admin_roles.venue_id = customer_profiles.venue_id
    join users on users.id = admin_roles.user_id
    where customer_profiles.id = profile_uuid
      and users.auth_user_id = auth.uid()
  );
$$;

create or replace function public.get_current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select users.id
  from users
  where users.auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.get_current_customer_profile_id(slot_or_venue_uuid uuid default null)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select customer_profiles.id
  from customer_profiles
  where customer_profiles.user_id = public.get_current_app_user_id()
    and (
      slot_or_venue_uuid is null
      or customer_profiles.venue_id = slot_or_venue_uuid
      or customer_profiles.venue_id in (
        select bookable_slots.venue_id
        from bookable_slots
        where bookable_slots.id = slot_or_venue_uuid
      )
    )
  order by customer_profiles.joined_at asc
  limit 1;
$$;

create or replace function public.book_slot_for_current_user(slot_uuid uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  customer_profile_id uuid;
  active_booking_id uuid;
  slot_row bookable_slots%rowtype;
  new_booking_id uuid;
  wallet_balance integer;
  use_wallet boolean;
  next_status booking_status;
  next_payment_status booking_payment_status;
  payment_mode_text text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into slot_row
  from bookable_slots
  where id = slot_uuid;

  if slot_row.id is null then
    raise exception 'Slot not found.';
  end if;

  customer_profile_id := public.get_current_customer_profile_id(slot_row.venue_id);

  if customer_profile_id is null then
    raise exception 'Customer profile not found for the current user.';
  end if;

  select id
  into active_booking_id
  from bookings
  where slot_id = slot_uuid
    and status in ('requested', 'confirmed')
  limit 1;

  if active_booking_id is not null then
    raise exception 'That slot is already unavailable.';
  end if;

  select coalesce(sum(amount_inr), 0)
  into wallet_balance
  from wallet_ledger_entries
  where customer_id = customer_profile_id;

  use_wallet := wallet_balance >= slot_row.price_inr and slot_row.payment_mode <> 'pay_at_venue';
  next_status := case when slot_row.confirmation_mode = 'review' then 'requested' else 'confirmed' end;
  next_payment_status := case
    when slot_row.payment_mode = 'pay_at_venue' then 'pay_at_venue'
    when use_wallet then 'credit_applied'
    when next_status = 'requested' then 'pending'
    else 'paid_online'
  end;

  insert into bookings (slot_id, customer_id, status, payment_status, attendees)
  values (slot_uuid, customer_profile_id, next_status, next_payment_status, greatest(slot_row.capacity, 1))
  returning id into new_booking_id;

  payment_mode_text := case
    when use_wallet then 'wallet'
    when slot_row.payment_mode = 'pay_at_venue' then 'pay_at_venue'
    else slot_row.payment_mode::text
  end;

  insert into booking_payments (booking_id, amount_inr, mode, status)
  values (new_booking_id, slot_row.price_inr, payment_mode_text, next_payment_status);

  if use_wallet then
    insert into wallet_ledger_entries (customer_id, amount_inr, kind, note)
    values (customer_profile_id, -slot_row.price_inr, 'credit_spent', concat('Applied to ', slot_row.label));
  end if;

  update bookable_slots
  set availability_state = 'booked'
  where id = slot_uuid;

  if next_status = 'requested' then
    return concat(slot_row.label, ' requested. Staff will review this hold before it is confirmed.');
  end if;

  if use_wallet then
    return concat(slot_row.label, ' confirmed using venue credits.');
  end if;

  return concat(
    slot_row.label,
    ' confirmed and marked for ',
    case when slot_row.payment_mode = 'pay_at_venue' then 'venue settlement' else 'online payment' end,
    '.'
  );
end;
$$;

create or replace function public.cancel_booking_for_current_user(booking_uuid uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_row bookings%rowtype;
  slot_row bookable_slots%rowtype;
  payment_amount integer;
  customer_profile_id uuid;
  remaining_active_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  customer_profile_id := public.get_current_customer_profile_id();

  select *
  into booking_row
  from bookings
  where id = booking_uuid
    and customer_id = customer_profile_id;

  if booking_row.id is null then
    raise exception 'Booking not found.';
  end if;

  if booking_row.status not in ('requested', 'confirmed') then
    raise exception 'Only live bookings can be canceled.';
  end if;

  select *
  into slot_row
  from bookable_slots
  where id = booking_row.slot_id;

  update bookings
  set status = 'canceled'
  where id = booking_uuid;

  if booking_row.payment_status in ('paid_online', 'credit_applied') then
    select coalesce(amount_inr, slot_row.price_inr)
    into payment_amount
    from booking_payments
    where booking_id = booking_uuid
    order by id desc
    limit 1;

    insert into wallet_ledger_entries (customer_id, amount_inr, kind, note)
    values (
      booking_row.customer_id,
      coalesce(payment_amount, slot_row.price_inr),
      'refund_credit',
      concat('Customer cancellation credit for ', slot_row.label)
    );
  end if;

  select count(*)
  into remaining_active_count
  from bookings
  where slot_id = booking_row.slot_id
    and status in ('requested', 'confirmed');

  if remaining_active_count = 0 then
    update bookable_slots
    set availability_state = 'open'
    where id = booking_row.slot_id;
  end if;

  return concat(slot_row.label, ' canceled. Value returned as venue credit where applicable.');
end;
$$;

create or replace function public.approve_booking_as_admin(booking_uuid uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  booking_row bookings%rowtype;
  slot_row bookable_slots%rowtype;
  slot_venue_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  select *
  into booking_row
  from bookings
  where id = booking_uuid;

  if booking_row.id is null then
    raise exception 'Booking not found.';
  end if;

  select *
  into slot_row
  from bookable_slots
  where id = booking_row.slot_id;

  slot_venue_id := slot_row.venue_id;

  if not public.is_admin_for_venue(slot_venue_id) then
    raise exception 'Admin access required.';
  end if;

  if booking_row.status <> 'requested' then
    raise exception 'Only requested bookings can be approved.';
  end if;

  update bookings
  set
    status = 'confirmed',
    payment_status = case
      when payment_status = 'pending' and slot_row.payment_mode = 'pay_at_venue' then 'pay_at_venue'
      when payment_status = 'pending' then 'paid_online'
      else payment_status
    end
  where id = booking_uuid;

  update bookable_slots
  set availability_state = 'booked'
  where id = booking_row.slot_id;

  return concat(slot_row.label, ' confirmed from the operator queue.');
end;
$$;

create or replace function public.add_wallet_credit_as_admin(customer_uuid uuid, amount_inr integer, note_text text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_row customer_profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if amount_inr <= 0 then
    raise exception 'Credit amount must be positive.';
  end if;

  select *
  into profile_row
  from customer_profiles
  where id = customer_uuid;

  if profile_row.id is null then
    raise exception 'Customer profile not found.';
  end if;

  if not public.is_admin_for_venue(profile_row.venue_id) then
    raise exception 'Admin access required.';
  end if;

  insert into wallet_ledger_entries (customer_id, amount_inr, kind, note)
  values (customer_uuid, amount_inr, 'manual_adjustment', note_text);

  return concat('Added ', amount_inr::text, ' INR in venue credit.');
end;
$$;

alter table venues enable row level security;
alter table courts enable row level security;
alter table users enable row level security;
alter table customer_profiles enable row level security;
alter table admin_roles enable row level security;
alter table slot_templates enable row level security;
alter table bookable_slots enable row level security;
alter table bookings enable row level security;
alter table booking_payments enable row level security;
alter table pack_products enable row level security;
alter table membership_plans enable row level security;
alter table customer_packs enable row level security;
alter table customer_memberships enable row level security;
alter table wallet_ledger_entries enable row level security;
alter table offers enable row level security;
alter table offer_redemptions enable row level security;
alter table attendance_events enable row level security;
alter table customer_notes enable row level security;

create policy "venues are publicly readable" on venues
  for select using (true);

create policy "courts are publicly readable" on courts
  for select using (true);

create policy "slot templates are publicly readable" on slot_templates
  for select using (true);

create policy "bookable slots are publicly readable" on bookable_slots
  for select using (true);

create policy "pack products are publicly readable" on pack_products
  for select using (true);

create policy "membership plans are publicly readable" on membership_plans
  for select using (true);

create policy "offers are publicly readable" on offers
  for select using (true);

create policy "users can read their own row" on users
  for select using (auth_user_id = auth.uid());

create policy "customers can read their own profile" on customer_profiles
  for select using (public.is_profile_owner(id));

create policy "admins can read venue customer profiles" on customer_profiles
  for select using (public.is_admin_for_venue(venue_id));

create policy "admins can read their own admin roles" on admin_roles
  for select using (
    exists (
      select 1
      from users
      where users.id = admin_roles.user_id
        and users.auth_user_id = auth.uid()
    )
  );

create policy "customers can read their own bookings" on bookings
  for select using (public.is_profile_owner(customer_id));

create policy "admins can read venue bookings" on bookings
  for select using (public.is_admin_for_customer(customer_id));

create policy "customers can create their own bookings" on bookings
  for insert with check (public.is_profile_owner(customer_id));

create policy "customers can update their own bookings" on bookings
  for update using (public.is_profile_owner(customer_id));

create policy "admins can update venue bookings" on bookings
  for update using (public.is_admin_for_customer(customer_id));

create policy "customers can read their own booking payments" on booking_payments
  for select using (
    exists (
      select 1
      from bookings
      where bookings.id = booking_payments.booking_id
        and public.is_profile_owner(bookings.customer_id)
    )
  );

create policy "admins can read venue booking payments" on booking_payments
  for select using (
    exists (
      select 1
      from bookings
      where bookings.id = booking_payments.booking_id
        and public.is_admin_for_customer(bookings.customer_id)
    )
  );

create policy "customers can read their own packs" on customer_packs
  for select using (public.is_profile_owner(customer_id));

create policy "admins can read venue customer packs" on customer_packs
  for select using (public.is_admin_for_customer(customer_id));

create policy "customers can read their own memberships" on customer_memberships
  for select using (public.is_profile_owner(customer_id));

create policy "admins can read venue memberships" on customer_memberships
  for select using (public.is_admin_for_customer(customer_id));

create policy "customers can read their own wallet ledger" on wallet_ledger_entries
  for select using (public.is_profile_owner(customer_id));

create policy "admins can read venue wallet ledger" on wallet_ledger_entries
  for select using (public.is_admin_for_customer(customer_id));

create policy "customers can read their own offer redemptions" on offer_redemptions
  for select using (public.is_profile_owner(customer_id));

create policy "admins can read venue offer redemptions" on offer_redemptions
  for select using (public.is_admin_for_customer(customer_id));

create policy "customers can read their own attendance events" on attendance_events
  for select using (public.is_profile_owner(customer_id));

create policy "admins can read venue attendance events" on attendance_events
  for select using (public.is_admin_for_customer(customer_id));

create policy "customers can read their own customer notes" on customer_notes
  for select using (public.is_profile_owner(customer_id));

create policy "admins can read venue customer notes" on customer_notes
  for select using (public.is_admin_for_customer(customer_id));
