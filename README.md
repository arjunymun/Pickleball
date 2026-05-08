# Sideout

Sideout is a premium Next.js concept build for a real Dehradun pickleball venue. It is designed as a dual-purpose club operating system:

- a customer-facing experience for availability, bookings, wallet value, packs, memberships, and offers
- an admin-facing operating console for schedule control, retention, promotions, and customer intelligence

The main product is now live-first. If Supabase is not configured, the customer and operator apps ask for a real live setup instead of silently pretending to be a demo. A separate recruiter walkthrough lives at `/demo` so the portfolio story is still easy to present without confusing it with production behavior.

- phone-first customer auth via Supabase OTP
- email magic-link operator auth for owner/staff flows
- live-mode bootstrap and first-run setup state
- role-gated admin routes
- operator lifecycle actions for approvals, check-ins, completion, and no-shows
- venue settings and communications surfaces
- Stripe Checkout + webhook scaffolding for packs and recurring memberships
- Twilio WhatsApp provider wiring with graceful fallback logging
- installable customer PWA shell
- API-first booking routes for courts, availability, temporary holds, customer bookings, and admin schedule reads
- May 2026 recruiter demo separated from the live app

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React
- Supabase schema starter
- Supabase SSR/auth client wiring
- Stripe server integration
- Vercel Analytics + Speed Insights

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
3. Add `SUPABASE_SERVICE_ROLE_KEY` for live admin/server-side mutation paths and webhook updates
4. Run the SQL in [supabase/schema.sql](./supabase/schema.sql) against your Supabase project
5. Start the app, sign in from `/sign-in`, then use the `Initialize live venue` action on `/app`

If the Supabase env vars are missing, the public marketing route still renders, but `/app` and `/admin` no longer run demo booking actions. Use `/demo` for the isolated recruiter walkthrough.

### Recruiter demo

Use `http://localhost:3000/demo` when presenting the project. It is a guided walkthrough designed to explain:

- the customer court-selection flow
- temporary holds and conflict-safe inventory
- Stripe webhook-confirmed payment state
- operator schedule, credits, memberships, packs, and activity logs

The production-facing app links to this route as `Recruiter demo`, while `/app` and `/admin` are reserved for live Supabase-backed workflows.

### Commerce + messaging setup

To turn on the 1.8 / 1.9 live integrations:

1. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET`
2. Configure the Stripe webhook endpoint to point at `/api/stripe/webhooks`
3. Add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_FROM`
4. Re-run the SQL in [supabase/schema.sql](./supabase/schema.sql) if your Supabase project was created before the newer venue settings / communications / lifecycle additions

Without these provider env vars:

- Stripe checkout buttons remain visible but return a helpful configuration error
- WhatsApp actions still log communication intent into Sideout, but they do not deliver to a real provider

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
- `/demo` recruiter walkthrough with customer/operator demo links
- `/demo/customer` isolated customer demo
- `/demo/operator` isolated operator demo
- `/sign-in` customer phone OTP + operator magic-link entry point
- `/admin` operator overview
- `/admin/schedule` daily schedule and approvals
- `/admin/customers` customer intelligence and recovery actions
- `/admin/offers` offers, packs, and commercial control surface
- `/admin/settings` venue-level policies and public contact configuration
- `/admin/communications` WhatsApp templates, recovery nudges, and delivery history
- `/api/courts`
- `/api/availability`
- `/api/bookings/holds`
- `/api/bookings/[bookingId]/checkout`
- `/api/bookings/expire-holds`
- `/api/bookings/me`
- `/api/admin/schedule`
- `/api/stripe/checkout` Stripe Checkout session bootstrap
- `/api/stripe/webhooks` Stripe webhook ingestion

## Validation

```bash
npm.cmd run lint
npm.cmd exec tsc -- --noEmit
npm.cmd run test
npm.cmd run build
```

The test suite currently validates the pure booking engine: overlapping court reservations, active and expired holds, and operator blocks.

## Notes

- Locale assumptions are India-first (`Asia/Kolkata`, INR)
- Memberships and packs are both represented in the mock model
- The schema in [supabase/schema.sql](./supabase/schema.sql) now includes venue settings, booking lifecycle timestamps, temporary holds, conflict-safe court reservations, admin blocks, price rules, payments, Stripe webhook event idempotency, communications tables, operator activity logs, Stripe reference fields, live mutation RPCs, and a one-click bootstrap RPC for a seeded venue
- The authenticated customer/admin surfaces are live-first. Demo data is intentionally isolated to `/demo`.
- The marketing site now reads live featured availability/offers when a public venue exists in Supabase
- The customer surface is installable as a PWA via [app/manifest.ts](./app/manifest.ts)
