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

create or replace function public.bootstrap_sideout_demo_for_current_user()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  app_user_id uuid;
  existing_admin_venue_id uuid;
  venue_id uuid;
  base_day date;
  current_profile_id uuid;
  court_1_id uuid;
  court_2_id uuid;
  court_3_id uuid;
  court_4_id uuid;
  court_5_id uuid;
  sunrise_template_id uuid;
  prime_template_id uuid;
  club_template_id uuid;
  weekday_pack_id uuid;
  commuter_pack_id uuid;
  club_pass_id uuid;
  pro_pass_id uuid;
  sunrise_offer_id uuid;
  member_offer_id uuid;
  recovery_offer_id uuid;
  slot_1_id uuid;
  slot_2_id uuid;
  slot_3_id uuid;
  slot_4_id uuid;
  slot_5_id uuid;
  slot_6_id uuid;
  current_booking_id uuid;
  arav_booking_id uuid;
  arav_user_id uuid;
  arav_profile_id uuid;
  meera_user_id uuid;
  meera_profile_id uuid;
  kabir_user_id uuid;
  kabir_profile_id uuid;
  tara_user_id uuid;
  tara_profile_id uuid;
  staff_user_id uuid;
  kabir_booking_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  app_user_id := public.get_current_app_user_id();

  if app_user_id is null then
    raise exception 'User profile not provisioned yet. Try signing out and back in again.';
  end if;

  select admin_roles.venue_id
  into existing_admin_venue_id
  from admin_roles
  where admin_roles.user_id = app_user_id
  order by case when admin_roles.kind = 'owner' then 0 else 1 end
  limit 1;

  if existing_admin_venue_id is not null then
    return 'Sideout live venue is already initialized for this account.';
  end if;

  base_day := timezone('Asia/Kolkata', now())::date + 1;

  insert into venues (name, tagline, location, timezone, story)
  values (
    'Sideout Club',
    'Repeat-play software shaped from a real family-built venue.',
    'Dehradun, Uttarakhand',
    'Asia/Kolkata',
    'Five courts, warm foothill mornings, and a business that runs better when booking, retention, and member value live in one system.'
  )
  returning id into venue_id;

  insert into admin_roles (user_id, venue_id, kind)
  values (app_user_id, venue_id, 'owner')
  on conflict (user_id, venue_id) do update
    set kind = 'owner';

  insert into customer_profiles (user_id, venue_id, favorite_window, skill_band, tags)
  values (app_user_id, venue_id, 'Sunrise', '3.5 to 4.0', array['owner', 'member', 'weekday regular'])
  on conflict (user_id, venue_id) do update
    set favorite_window = excluded.favorite_window,
        skill_band = excluded.skill_band,
        tags = excluded.tags
  returning id into current_profile_id;

  insert into users (full_name, email, phone)
  values ('Naina Joshi', 'ops@sideout.club', '+91 98765 43116')
  on conflict (email) do update
    set full_name = excluded.full_name,
        phone = excluded.phone
  returning id into staff_user_id;

  insert into admin_roles (user_id, venue_id, kind)
  values (staff_user_id, venue_id, 'staff')
  on conflict (user_id, venue_id) do update
    set kind = 'staff';

  insert into courts (venue_id, name, surface, lighting, outlook)
  values (venue_id, 'Court 01', 'Outdoor acrylic', true, 'East light')
  returning id into court_1_id;

  insert into courts (venue_id, name, surface, lighting, outlook)
  values (venue_id, 'Court 02', 'Outdoor acrylic', true, 'Main deck')
  returning id into court_2_id;

  insert into courts (venue_id, name, surface, lighting, outlook)
  values (venue_id, 'Court 03', 'Outdoor acrylic', true, 'Tree line')
  returning id into court_3_id;

  insert into courts (venue_id, name, surface, lighting, outlook)
  values (venue_id, 'Court 04', 'Outdoor acrylic', true, 'Quiet side')
  returning id into court_4_id;

  insert into courts (venue_id, name, surface, lighting, outlook)
  values (venue_id, 'Court 05', 'Outdoor acrylic', false, 'Practice edge')
  returning id into court_5_id;

  insert into slot_templates (venue_id, name, duration_minutes, confirmation_mode, payment_mode, price_inr, description)
  values (
    venue_id,
    'Sunrise Rally',
    60,
    'instant',
    'online',
    700,
    'Fast morning bookings designed to fill before work.'
  )
  returning id into sunrise_template_id;

  insert into slot_templates (venue_id, name, duration_minutes, confirmation_mode, payment_mode, price_inr, description)
  values (
    venue_id,
    'Prime-Time Court',
    60,
    'instant',
    'hybrid',
    900,
    'High-demand evening court with member perks and wallet support.'
  )
  returning id into prime_template_id;

  insert into slot_templates (venue_id, name, duration_minutes, confirmation_mode, payment_mode, price_inr, description)
  values (
    venue_id,
    'Club Hold',
    60,
    'review',
    'pay_at_venue',
    850,
    'Manually reviewed holds for staff-led or high-touch requests.'
  )
  returning id into club_template_id;

  insert into bookable_slots (
    venue_id, template_id, court_id, starts_at, ends_at, duration_minutes, capacity, price_inr, payment_mode, confirmation_mode, availability_state, label
  )
  values (
    venue_id,
    sunrise_template_id,
    court_1_id,
    (base_day + time '06:00') at time zone 'Asia/Kolkata',
    (base_day + time '07:00') at time zone 'Asia/Kolkata',
    60,
    4,
    700,
    'online',
    'instant',
    'open',
    'Sunrise Rally'
  )
  returning id into slot_1_id;

  insert into bookable_slots (
    venue_id, template_id, court_id, starts_at, ends_at, duration_minutes, capacity, price_inr, payment_mode, confirmation_mode, availability_state, label
  )
  values (
    venue_id,
    sunrise_template_id,
    court_2_id,
    (base_day + time '06:00') at time zone 'Asia/Kolkata',
    (base_day + time '07:00') at time zone 'Asia/Kolkata',
    60,
    4,
    700,
    'online',
    'instant',
    'booked',
    'Sunrise Rally'
  )
  returning id into slot_2_id;

  insert into bookable_slots (
    venue_id, template_id, court_id, starts_at, ends_at, duration_minutes, capacity, price_inr, payment_mode, confirmation_mode, availability_state, label
  )
  values (
    venue_id,
    prime_template_id,
    court_3_id,
    (base_day + time '18:00') at time zone 'Asia/Kolkata',
    (base_day + time '19:00') at time zone 'Asia/Kolkata',
    60,
    4,
    900,
    'hybrid',
    'instant',
    'booked',
    'Prime-Time Court'
  )
  returning id into slot_3_id;

  insert into bookable_slots (
    venue_id, template_id, court_id, starts_at, ends_at, duration_minutes, capacity, price_inr, payment_mode, confirmation_mode, availability_state, label
  )
  values (
    venue_id,
    prime_template_id,
    court_4_id,
    (base_day + time '19:00') at time zone 'Asia/Kolkata',
    (base_day + time '20:00') at time zone 'Asia/Kolkata',
    60,
    4,
    950,
    'hybrid',
    'instant',
    'booked',
    'Golden Hour Court'
  )
  returning id into slot_4_id;

  insert into bookable_slots (
    venue_id, template_id, court_id, starts_at, ends_at, duration_minutes, capacity, price_inr, payment_mode, confirmation_mode, availability_state, label
  )
  values (
    venue_id,
    club_template_id,
    court_5_id,
    ((base_day + 1) + time '07:00') at time zone 'Asia/Kolkata',
    ((base_day + 1) + time '08:00') at time zone 'Asia/Kolkata',
    60,
    4,
    850,
    'pay_at_venue',
    'review',
    'booked',
    'Coach Hold'
  )
  returning id into slot_5_id;

  insert into bookable_slots (
    venue_id, template_id, court_id, starts_at, ends_at, duration_minutes, capacity, price_inr, payment_mode, confirmation_mode, availability_state, label
  )
  values (
    venue_id,
    prime_template_id,
    court_2_id,
    ((base_day + 1) + time '18:00') at time zone 'Asia/Kolkata',
    ((base_day + 1) + time '19:00') at time zone 'Asia/Kolkata',
    60,
    4,
    900,
    'hybrid',
    'instant',
    'limited',
    'Prime-Time Court'
  )
  returning id into slot_6_id;

  insert into pack_products (venue_id, name, price_inr, included_credits, valid_days, description)
  values (venue_id, 'Weekday Starter Pack', 2400, 4, 30, 'A weekday-focused credit pack for sunrise and quiet-hour return visits.')
  returning id into weekday_pack_id;

  insert into pack_products (venue_id, name, price_inr, included_credits, valid_days, description)
  values (venue_id, 'Commuter Flex Pack', 4600, 8, 45, 'A higher-balance pack for players who bounce between sunrise and after-work courts.')
  returning id into commuter_pack_id;

  insert into membership_plans (venue_id, name, monthly_price_inr, included_credits, perks)
  values (
    venue_id,
    'Club Pass',
    1800,
    2,
    array['Priority booking on prime-time holds', '10% lower member rate', 'Exclusive sunrise offers']
  )
  returning id into club_pass_id;

  insert into membership_plans (venue_id, name, monthly_price_inr, included_credits, perks)
  values (
    venue_id,
    'Club Pass Plus',
    3200,
    4,
    array['Prime-time booking priority', 'Monthly recovery credit', 'Member-only golden hour drops']
  )
  returning id into pro_pass_id;

  insert into offers (venue_id, name, status, starts_at, ends_at, headline, audience, redemption_cap, slot_scope)
  values (
    venue_id,
    'Sunrise Recovery',
    'active',
    (base_day - 1 + time '00:00') at time zone 'Asia/Kolkata',
    (base_day + 5 + time '23:00') at time zone 'Asia/Kolkata',
    'Bring back off-rhythm regulars with a sunrise credit that feels thoughtful, not discount-first.',
    'Targets players who used to visit before work but have gone quiet for 7+ days.',
    20,
    'Applies to sunrise inventory only.'
  )
  returning id into sunrise_offer_id;

  insert into offers (venue_id, name, status, starts_at, ends_at, headline, audience, redemption_cap, slot_scope)
  values (
    venue_id,
    'Member Golden Hour',
    'active',
    (base_day - 1 + time '00:00') at time zone 'Asia/Kolkata',
    (base_day + 10 + time '23:00') at time zone 'Asia/Kolkata',
    'Reward active members with a cleaner path into the venue''s best evening inventory.',
    'Visible to members and high-retention players already trending toward repeat play.',
    12,
    'Applies to prime-time and golden-hour courts.'
  )
  returning id into member_offer_id;

  insert into offers (venue_id, name, status, starts_at, ends_at, headline, audience, redemption_cap, slot_scope)
  values (
    venue_id,
    'First Pack Top-Up',
    'scheduled',
    (base_day + 2 + time '00:00') at time zone 'Asia/Kolkata',
    (base_day + 12 + time '23:00') at time zone 'Asia/Kolkata',
    'Convert new players into pack holders without flattening the pricing story for everyone else.',
    'Targets recent first-time players and promo-converted members of the venue.',
    15,
    'Applies to any open weekday slot after the second visit.'
  )
  returning id into recovery_offer_id;

  insert into users (full_name, email, phone)
  values ('Arav Sharma', 'arav.demo@sideout.club', '+91 98765 43111')
  on conflict (email) do update
    set full_name = excluded.full_name,
        phone = excluded.phone
  returning id into arav_user_id;

  insert into customer_profiles (user_id, venue_id, favorite_window, skill_band, tags)
  values (arav_user_id, venue_id, 'After work', '4.0', array['prime-time', 'high LTV'])
  on conflict (user_id, venue_id) do update
    set favorite_window = excluded.favorite_window,
        skill_band = excluded.skill_band,
        tags = excluded.tags
  returning id into arav_profile_id;

  insert into users (full_name, email, phone)
  values ('Meera Rawat', 'meera.demo@sideout.club', '+91 98765 43112')
  on conflict (email) do update
    set full_name = excluded.full_name,
        phone = excluded.phone
  returning id into meera_user_id;

  insert into customer_profiles (user_id, venue_id, favorite_window, skill_band, tags)
  values (meera_user_id, venue_id, 'Sunset', '3.0', array['pack holder', 'at-risk'])
  on conflict (user_id, venue_id) do update
    set favorite_window = excluded.favorite_window,
        skill_band = excluded.skill_band,
        tags = excluded.tags
  returning id into meera_profile_id;

  insert into users (full_name, email, phone)
  values ('Kabir Bansal', 'kabir.demo@sideout.club', '+91 98765 43113')
  on conflict (email) do update
    set full_name = excluded.full_name,
        phone = excluded.phone
  returning id into kabir_user_id;

  insert into customer_profiles (user_id, venue_id, favorite_window, skill_band, tags)
  values (kabir_user_id, venue_id, 'Weekend mornings', '4.0+', array['member', 'brings guests'])
  on conflict (user_id, venue_id) do update
    set favorite_window = excluded.favorite_window,
        skill_band = excluded.skill_band,
        tags = excluded.tags
  returning id into kabir_profile_id;

  insert into users (full_name, email, phone)
  values ('Tara Mehta', 'tara.demo@sideout.club', '+91 98765 43114')
  on conflict (email) do update
    set full_name = excluded.full_name,
        phone = excluded.phone
  returning id into tara_user_id;

  insert into customer_profiles (user_id, venue_id, favorite_window, skill_band, tags)
  values (tara_user_id, venue_id, 'Flexible', 'Beginner', array['new player', 'promo-converted'])
  on conflict (user_id, venue_id) do update
    set favorite_window = excluded.favorite_window,
        skill_band = excluded.skill_band,
        tags = excluded.tags
  returning id into tara_profile_id;

  insert into wallet_ledger_entries (customer_id, amount_inr, kind, note)
  values
    (current_profile_id, 1800, 'credit_added', 'Bootstrap owner credit'),
    (current_profile_id, 400, 'membership_benefit_credit', 'Club Pass launch credit'),
    (arav_profile_id, 1200, 'credit_added', 'Prime-time loyalty balance'),
    (meera_profile_id, 600, 'promo_credit', 'Sunset recovery credit'),
    (kabir_profile_id, 900, 'membership_benefit_credit', 'Member monthly credit'),
    (tara_profile_id, 300, 'promo_credit', 'New player welcome credit');

  insert into customer_packs (customer_id, product_id, credits_remaining, expires_at)
  values
    (current_profile_id, commuter_pack_id, 5, ((base_day + 34) + time '23:00') at time zone 'Asia/Kolkata'),
    (meera_profile_id, weekday_pack_id, 2, ((base_day + 5) + time '23:00') at time zone 'Asia/Kolkata');

  insert into customer_memberships (customer_id, plan_id, status, renews_at)
  values
    (current_profile_id, club_pass_id, 'active', ((base_day + 28) + time '00:00') at time zone 'Asia/Kolkata'),
    (kabir_profile_id, pro_pass_id, 'active', ((base_day + 21) + time '00:00') at time zone 'Asia/Kolkata');

  insert into bookings (slot_id, customer_id, booked_at, status, payment_status, attendees)
  values (
    slot_3_id,
    current_profile_id,
    ((base_day - 2) + time '09:30') at time zone 'Asia/Kolkata',
    'confirmed',
    'credit_applied',
    4
  )
  returning id into current_booking_id;

  insert into booking_payments (booking_id, amount_inr, mode, status)
  values (current_booking_id, 900, 'wallet', 'credit_applied');

  insert into wallet_ledger_entries (customer_id, amount_inr, kind, note)
  values (current_profile_id, -900, 'credit_spent', 'Applied to Prime-Time Court');

  insert into bookings (slot_id, customer_id, booked_at, status, payment_status, attendees)
  values (
    slot_4_id,
    arav_profile_id,
    ((base_day - 3) + time '11:00') at time zone 'Asia/Kolkata',
    'confirmed',
    'paid_online',
    4
  )
  returning id into arav_booking_id;

  insert into booking_payments (booking_id, amount_inr, mode, status)
  values (arav_booking_id, 950, 'online', 'paid_online');

  insert into bookings (slot_id, customer_id, booked_at, status, payment_status, attendees)
  values (
    slot_2_id,
    meera_profile_id,
    ((base_day - 3) + time '08:00') at time zone 'Asia/Kolkata',
    'requested',
    'pending',
    2
  );

  insert into bookings (slot_id, customer_id, booked_at, status, payment_status, attendees)
  values (
    slot_5_id,
    tara_profile_id,
    ((base_day - 2) + time '13:00') at time zone 'Asia/Kolkata',
    'requested',
    'pay_at_venue',
    2
  );

  insert into bookings (slot_id, customer_id, booked_at, status, payment_status, attendees)
  values (
    slot_6_id,
    kabir_profile_id,
    ((base_day - 5) + time '08:00') at time zone 'Asia/Kolkata',
    'completed',
    'paid_online',
    4
  )
  returning id into kabir_booking_id;

  insert into booking_payments (booking_id, amount_inr, mode, status)
  values (kabir_booking_id, 900, 'online', 'paid_online');

  insert into attendance_events (booking_id, customer_id, attended_at)
  values
    (kabir_booking_id, kabir_profile_id, ((base_day - 1) + time '19:05') at time zone 'Asia/Kolkata');

  insert into customer_notes (customer_id, authored_by, body)
  values
    (meera_profile_id, 'Naina Joshi', 'Went quiet after burning through her weekday pack. Best nudge remains a gentle sunset recovery credit.'),
    (tara_profile_id, 'Naina Joshi', 'Converted from the beginner promo, but still needs a confidence-building second visit.'),
    (arav_profile_id, 'Aarav Yadav', 'High-LTV prime-time regular. Worth protecting with member priority if evenings get tighter.');

  insert into offer_redemptions (offer_id, customer_id, redeemed_at, credit_value_inr)
  values
    (sunrise_offer_id, meera_profile_id, ((base_day - 1) + time '07:00') at time zone 'Asia/Kolkata', 200),
    (member_offer_id, kabir_profile_id, ((base_day - 2) + time '19:00') at time zone 'Asia/Kolkata', 250);

  return 'Live Sideout venue initialized. Customer and admin routes are now backed by seeded Supabase data.';
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
