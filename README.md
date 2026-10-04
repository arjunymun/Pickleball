# Doon Pickleball Academy

Customer booking and staff operations for a four-court outdoor academy on GMS Road, Dehradun. The product uses Asia/Kolkata time, accepts one-hour court reservations from 06:00 to 24:00, and opens booking 14 days ahead. Each reservation starts with a ten-minute hold.

Court time is ₹500 per hour, or ₹400 for an active, paid member. In-person individual play is ₹125 per person-hour. The ₹2,500 monthly membership renews automatically, includes one individual-play hour per day recorded by staff, and does not include free court reservations or banked hours. To cancel a court booking or ask about a refund, call +91 97980 98421.

## Local development

Requires Node.js 20.9 or newer.

```powershell
npm install
npm run dev
```

The app runs at <http://localhost:3000>. Available project checks:

```powershell
npm run lint
npm run typecheck
npm run test
npm run test:db
npm run build
```

## Backend setup

The academy uses a new, versioned Supabase migration under `supabase/migrations/` with `academy_*` tables. Apply migrations with the Supabase CLI after backend setup is ready; do not run the retired `supabase/schema.sql` bootstrap. Provider features stay disabled unless their explicit configuration flags are enabled. Setup steps for Supabase, Google sign-in, email delivery, Razorpay test/live credentials, webhook configuration, and staff access are maintained in [docs/rebuild/backend-setup.md](docs/rebuild/backend-setup.md).

Real authentication and payment verification require a configured backend and provider accounts. Local fixture states and test payment screens do not verify identity, charge a payment method, or establish production readiness.

## Customer preview fixture

The isolated, test-only customer component preview uses a synthetic API and payment gateway. From PowerShell, start it on port 3005:

```powershell
node scripts/customer-preview/build.mjs
```

Open <http://localhost:3005>. Choose a fixture state in its toolbar to inspect booking review, account, and membership screens. The fixture is separate from the production application runtime and contains no real account or payment data. Its Project walkthrough link is also a fixture-only affordance.

## Product boundaries

Staff manually records check-ins, individual-play attendance, cancellations, refunds, and bookings made through Playo, Hudle, or District. These platforms are not automatically synchronized. The project walkthrough is isolated from customer and staff production data.
