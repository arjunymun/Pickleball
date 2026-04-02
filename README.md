# Sideout

Sideout is a premium Next.js concept build for a real Dehradun pickleball venue. It is designed as a dual-purpose club operating system:

- a customer-facing experience for availability, bookings, wallet value, packs, memberships, and offers
- an admin-facing operating console for schedule control, retention, promotions, and customer intelligence

The current repo is intentionally frontend-first, but version 1.3 now includes real Supabase auth foundations alongside the typed mock domain layer. That means localhost still works in demo mode without credentials, while the project is ready to switch into a real auth-backed setup as soon as `.env.local` is filled in.

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

If the Supabase env vars are missing, Sideout falls back to demo mode automatically and keeps the customer/admin flows reviewable on localhost.

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
- The schema in [supabase/schema.sql](./supabase/schema.sql) now includes an auth bridge from `auth.users`, helper functions, and starter RLS policies
- Customer/admin product surfaces still use the shared live demo state until the next iteration swaps them onto real Supabase queries and mutations
