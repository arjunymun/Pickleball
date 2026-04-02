# Sideout

Sideout is a premium Next.js concept build for a real Dehradun pickleball venue. It is designed as a dual-purpose club operating system:

- a customer-facing experience for availability, bookings, wallet value, packs, memberships, and offers
- an admin-facing operating console for schedule control, retention, promotions, and customer intelligence

The current repo is intentionally frontend-first, with a typed mock domain layer and a starter Supabase schema so the product can be reviewed on localhost before deeper integrations are wired in.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React
- Supabase schema starter

## Local development

Use `npm.cmd` in PowerShell if script execution is restricted:

```bash
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

## Key routes

- `/` marketing and product positioning
- `/app` customer overview
- `/app/bookings` live customer booking surface
- `/app/wallet` wallet, packs, and value surface
- `/app/offers` offers, packs, and membership positioning
- `/admin` operator overview
- `/admin/schedule` daily schedule and approvals
- `/admin/customers` customer intelligence and recovery actions
- `/admin/offers` offers, packs, and commercial control surface

## Notes

- Locale assumptions are India-first (`Asia/Kolkata`, INR)
- Memberships and packs are both represented in the mock model
- The schema in [supabase/schema.sql](./supabase/schema.sql) mirrors the product entities from the plan
