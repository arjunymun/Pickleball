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
