# Sideout

Sideout is a premium Next.js concept build for a real Dehradun pickleball venue. It is designed as a dual-purpose club operating system:

- a customer-facing experience for availability, bookings, wallet value, packs, memberships, and offers
- an admin-facing operating console for schedule control, retention, promotions, and customer intelligence

The current repo stays reviewable on localhost in demo mode, but version 1.5 now includes a real Supabase auth and runtime path. Once `.env.local` is configured, a signed-in user can initialize a live seeded Sideout venue directly from the app and move the customer/admin shells onto Supabase-backed records.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React
- Supabase schema starter
- Supabase SSR/auth client wiring

## Local development

Use `npm.cmd` in PowerShell if script execution is restricted:

```bash
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

### Supabase auth setup

To enable the real backend/auth flow:

1. Copy `.env.example` to `.env.local`
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Add `SUPABASE_SERVICE_ROLE_KEY` if you want admin/server-side mutation paths later
4. Run the SQL in [supabase/schema.sql](./supabase/schema.sql) against your Supabase project
5. Start the app, sign in from `/sign-in`, then use the `Initialize live venue` action on `/app` or `/admin`

If the Supabase env vars are missing, Sideout falls back to demo mode automatically and keeps the customer/admin flows reviewable on localhost.

The bootstrap action creates:

- the Sideout venue, courts, slot templates, and bookable slots
- seeded offers, pack products, and membership plans
- owner + staff roles
- a current-user customer profile for the signed-in owner
- sample customer records, notes, bookings, wallet entries, offer redemptions, packs, and memberships

## Key routes

- `/` marketing and product positioning
- `/app` customer overview
- `/app/bookings` live customer booking surface
- `/app/wallet` wallet, packs, and value surface
- `/app/offers` offers, packs, and membership positioning
- `/sign-in` Supabase magic-link entry point with demo fallback
- `/admin` operator overview
- `/admin/schedule` daily schedule and approvals
- `/admin/customers` customer intelligence and recovery actions
- `/admin/offers` offers, packs, and commercial control surface

## Notes

- Locale assumptions are India-first (`Asia/Kolkata`, INR)
- Memberships and packs are both represented in the mock model
- The schema in [supabase/schema.sql](./supabase/schema.sql) includes an auth bridge from `auth.users`, helper functions, live mutation RPCs, and a one-click bootstrap RPC for a seeded venue
- The authenticated customer/admin surfaces now consume a hybrid runtime snapshot that can come from local demo data or Supabase depending on configuration and sign-in state
