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
  tags text[] not null default '{}'
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
        phone = coalesce(excluded.phone, public.users.phone);

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
