# Doon Pickleball Academy implementation contract

Approved October 2, 2026. Build all credential-independent work before asking the owner for final setup inputs. Owner update October 4: local milestone commits are now authorized, but all commit dates must be truthful and no changes may be pushed without a separate request. Preserve the pre-existing untracked `RECRUITER_PREP.md`.

## Visitor audit extension — October 6, 2026

Owner requested a first-time visitor audit excluding payment activation, with a lead acting as orchestrator and lighter specialists implementing customer and admin fixes. This is part of the existing rebuild goal. Keep one gpt-6.1-sol lead and narrowly scoped gpt-6-luna workers with separate file ownership. Record prioritized findings, assignments, fixes and evidence in `visitor-audit.md`, open it in the side panel and update it at checkpoints. Verify actual desktop/mobile journeys, preserve real booking intent and staff operational context, then run relevant regressions, lint, TypeScript and build before authorized genuine Git/Vercel delivery. Do not create live bookings or mutate customer/staff records for the audit. Payment-provider verification remains an independent completion requirement.

## Product

Real academy in GMS Road, Dehradun. Four outdoor courts, 06:00–24:00 Asia/Kolkata, one-hour reservations, rolling 14-day booking window. INR500 per court-hour; INR400 for an active, paid member. INR125 per person-hour is in-person individual play only. INR2500 automatically renewed monthly membership includes one individual hour daily, recorded by staff, with no banked credits or free court booking. Court cancellation by calling +91 97980 98421; staff records reason and no/full/partial refund. Payment contact is separate and must not be published as club contact.

Customer site: real photography, white/court blue/ink navy, condensed athletic headings, accessible mobile-first booking. Guest availability, Google/email magic-link sign-in preserving intent, ten-minute hold, verified Razorpay checkout, account bookings and membership. Footer-only Project walkthrough, isolated from production data. Remove packs/wallet/campaign commerce and synthetic metrics.

Staff: four-court day timeline, check-in/complete/no-show/cancel, maintenance, walk-ins/individual play, manual Playo/Hudle/District entries with platform references, membership attendance, notes and audited refunds. External platform synchronization is manual; do not claim automatic integrations.

## Architecture and ownership

Keep Next16/React19/Supabase stack. A new `lib/academy` boundary replaces the live/demo runtime for all real routes. Public payloads exclude customer data. Privileged money/state mutations belong to authorized server/database transactions. Store integer paise and UTC timestamps; display Asia/Kolkata. New migrations may use `academy_*` tables to keep legacy demo tables isolated. Do not provision, migrate remotely, or ask for credentials until local implementation and checks are ready.

Lead owns contracts.ts, config.ts, time.ts, client.ts, shared components/academy, root layout/globals/metadata, docs, CI and integrated tests. Backend specialist owns server/domain/repository/database/payment modules, supabase migrations, all API routes, auth callbacks, proxy, lib/auth and Supabase helpers. Customer specialist owns public/account/sign-in route pages and customer components/styles. Operations specialist owns admin route pages/components/styles. Coordinate before editing another owner's files. No nested agents.

Owner update October 3: use lighter models with narrowly scoped context for routine checks, documentation and small fixes. Reserve heavier models for lead orchestration, architecture, security/payment logic, complex implementation and final integration. Finish already-running substantial specialist tasks without duplicating their work; apply the lighter model to subsequent suitable assignments. Avoid broad history forks for routine tasks.

Superseding owner constraint: only ONE gpt-6.1-sol instance may run, the lead. Heavy backend and operations specialists were interrupted with files preserved; subsequent specialists use gpt-6-luna with narrow context. Lead retains complex money/security decisions. Weekly usage concern requires compact checkpoints, batching, no repeated checks without new changes or failures, and no full-history forks for workers.

Owner update October 4: put Razorpay dashboard setup, test credentials, plans, webhooks, and all payment-provider changes on hold. Continue the independent customer, staff, Supabase/Auth, documentation, and deployment-readiness work that does not require Razorpay. Keep payment mode unconfigured and both backend switches off until the remaining owner inputs and staging checks are complete.

Owner decisions October 4: Google Cloud country is India; grant owner access to the owner account only (no additional staff yet); use “Doon Pickleball Academy” as the email sender display name. No custom domain is owned and no domain/service charges are authorized. The app already has a successful Vercel Production deployment; reuse the existing Vercel project and do not set up another host. Verify its account plan before any further business deployment: Vercel Hobby is for personal/non-commercial use, while Pro may incur charges. Use only the existing Vercel-provided project URL unless its current plan and zero-charge behavior are verified. A Vercel subdomain is not a custom email sender domain. Brevo Free remains blocked until the business owns a sending domain. ChatGPT Sites can publish separate lightweight sites but is not a drop-in host for this existing Next.js/Supabase repository. Keep production-like customer email unavailable until an authenticated sender domain and SMTP are verified.

## Frozen API contract

All types are defined in `lib/academy/contracts.ts`. GET responses and POST success responses below are JSON. Errors have `{ error: string, code?: string }` and appropriate 400/401/403/409/503 status; no raw database errors or secrets.

- GET /api/session -> AcademySession.
- GET /api/availability?date=YYYY-MM-DD -> AvailabilityPayload. Public authoritative inventory across all reservations/blocks/holds.
- POST /api/bookings/holds { courtId, startsAt, idempotencyKey } -> { booking: AcademyBooking }. Server chooses one-hour duration/ten-minute expiry and price.
- GET /api/bookings/me -> CustomerAccountPayload.
- POST /api/bookings/:id/checkout { idempotencyKey } -> CourtCheckoutPayload. Reuse provider order for retry; authorize ownership and unexpired hold.
- POST /api/payments/verify { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } -> { booking: AcademyBooking }. Verify signature AND fetched captured payment, amount/currency/order mapping; no frontend-only confirmation.
- POST /api/payments/webhook -> gateway signature-verified, idempotent processing with transactional event status and retry.
- POST /api/memberships/checkout { idempotencyKey } -> MembershipCheckoutPayload; initial benefit only after verified captured subscription charge.
- POST /api/memberships/cancel -> { membership: AcademyMembership }; end-of-paid-period cancellation.
- GET /api/admin/schedule?date=YYYY-MM-DD -> AdminSchedulePayload.
- POST /api/admin/bookings { courtId, startsAt, source, customerName, customerId?, reference?, reason?, amountPaise?, paymentStatus?: pending|cash|external|not_required, idempotencyKey } -> { booking }. Source excludes online; server-authorized staff amount overrides require reason.
- POST /api/admin/bookings/:id/action { action: check_in|complete|no_show|cancel, reason?, refundPaise?, idempotencyKey } -> { booking }. Cancellation/refund requires reason; never fabricate gateway payment status for external/walk-in payments.
- POST /api/admin/blocks { courtId, startsAt, endsAt, reason, idempotencyKey } -> { block }; DELETE /api/admin/blocks/:id -> { ok:true }.
- GET /api/admin/customers -> AdminCustomersPayload; POST /api/admin/customers/:id/notes { body } -> { ok:true }.
- POST /api/admin/attendance { customerId, date, idempotencyKey } -> { attendance }; staff confirms one daily member visit, unique(member, IST-date), active paid membership required. Individual-play sessions separately reserve court inventory in schedule.
- Supabase pg_cron expires holds every five minutes; read/hold paths also perform expiry repair. The separate scheduled payment/refund/webhook reconciliation endpoint is authenticated by CRON_SECRET and still needs a compatible hosted runtime.

Legacy payment/runtime/bootstrap/portfolio privileged mutations must be disabled explicitly, not left reachable. Recruiter sandbox must not obtain production snapshots or credentials. Never silently use demo data in business UI. Development fixtures live only in tests/sandbox.

## Completion

The owner subsequently authorized the cinematic/photo pass in `visual-direction.md`: integrate the locally rendered eight-second film, use distinct real academy photograph roles, keep book controls accessible and the interactive schematic optional. Verify native playback/pause, viewport/visibility handling, poster/error fallbacks, mobile layout and motion preference gates before publishing. This credential-independent extension does not close the unverified payment scope.

Verify parallel holds, customer isolation, provider signature/payment amount/currency/ownership, retry/late payment/refunds, membership paid period/renewal failure/cancel/attendance, external blocks, auth return paths, responsive and keyboard customer/staff journeys. Pass tests/lint/tsc/build and CI. Then consolidate Supabase provisioning, Google OAuth, custom SMTP, Razorpay keys/subscription activation/webhook, staff owner setup and deployment inputs. Test actual auth/payment/RLS against provisioned backend before readiness claims. Live activation is a separate final verified gate.

One durable goal; daily same-chat continuation while external inputs are pending. Estimate 8–16 active hours and 150k–300k working tokens, not a guarantee/cap. Keep computer/app running; scheduled continuation does not bypass quota. Save resumable evidence in progress.md. Automation id: continue-academy-rebuild. Stop scheduled continuation on completion; do not overlap an active run.
