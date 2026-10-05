# Owner activation checklist

The live academy site, public Google/email login, owner operations, and five-minute recovery scheduler are verified. The remaining activation gate is a real merchant account and end-to-end payment testing. Review detailed payment and security steps in `backend-setup.md`.

## Business and account decisions

- [x] Owner has no custom domain and authorizes using the existing Vercel Hobby project for this resume project until traffic warrants another hosting decision. The rebuilt site is deployed at `https://pickleball-xi.vercel.app`. No domain, hosting or billing charge was incurred.
- [x] Google Cloud onboarding uses India. The academy OAuth project and web client exist; no billing account, trial or paid resource was enabled.
- [x] Check the current Supabase project creation price for the existing organization immediately before provisioning: the connected Supabase tool quoted $0/month on October 3, 2026; its cost-confirmation step completed.
- [x] Owner requests access for themself only; no additional staff accounts. Assign the signed-in owner account after first verified sign-in. No password or one-time code is needed in chat.
- [x] Custom SMTP uses Brevo Free and sender name `Doon Pickleball Academy`. Actual email delivery and local sign-in are verified. Brevo temporarily rewrites the sender to its compliant domain when an owned authenticated domain is unavailable; this is a stopgap, not a permanent domain-authentication solution. No domain purchase, card or paid plan was enabled.
- [pending] Owner now confirms live payment is part of the project and asks for as much integration as possible. A working Indian merchant account, identity and settlement verification, account-specific transaction fees, provider credentials, webhooks, and actual payment tests remain outstanding. Do not enable collection under the still-binding no-charge constraint without confirmed eligibility.

## Configure in provider dashboards

- [x] Dedicated Supabase project `doon-pickleball-academy` (`usvhawfvhvgepnwauqrs`) is on the Free plan in Mumbai. Five versioned academy migrations are applied; all 14 academy tables have RLS enabled. Local and hosted backend/email switches are enabled after real authentication verification.
- [x] Add this project's existing service-role key only to the git-ignored local server environment (`.env.development.local`). It was validated against the `service_role` JWT claim; local backend and email switches are enabled, and the different-project `.env.local` was not reused.
- [x] Google OAuth audience is In production. A new non-test customer signed in on the hosted site and returned to booking; a hosted email magic link also opened the customer account. Owner schedule access and customer denial from staff tools were verified.
- [x] Google OAuth web client and exact Supabase callbacks are configured for localhost and the live Vercel host. Google branding and Supabase Site URL use the canonical hosted site. No Google billing or trial is enabled.
- [x] Fix and remotely apply the customer-profile permission migration. Local fixtures now match private Supabase auth permissions; 21 database scenarios pass. The verified owner account is the sole staff/owner account.
- [x] Configure and verify no-cost custom SMTP. Brevo Free provides 300 emails/day; Supabase currently limits SMTP auth mail to 30/hour with a 60-second recipient interval. Secrets are saved only in Supabase and ignored local recovery settings. Delivered signup and returning-player magic links, authenticated customer account, refresh persistence, sign-out and booking return were verified October 4. Long-term sender-domain authentication remains an operational requirement.
- [pending] Obtain Indian merchant access and verify permitted fees, then create the ₹2,500/month subscription plan, enable automatic capture/subscriptions, configure webhooks, and generate test credentials. No merchant plan or keys have been created yet.
- [pending] Run actual provider test payments, subscription renewal and refund flows before considering live collection.
- [pending] Owner permits a replacement payment provider. PhonePe is a candidate, with checkout and AutoPay support; verified business phone/account onboarding, KYC and account-specific fee terms are unresolved. Its advertised free offer is conditional. Cashfree's offer deducts GST and excludes subscription e-mandates, so it does not meet the strict zero-charge condition. No charges, provider migration or paid upgrades are enabled.
- [x] Generate a private 32-byte `CRON_SECRET` for local development and store it only in ignored `.env.development.local`.
- [x] Owner authorized a GitHub push and live update. The committed rebuild is on `main`; Vercel production deployment is Ready at the canonical URL and GitHub Actions passed.
- [x] Automatic hold expiry runs inside Supabase every five minutes through `pg_cron`; the actual scheduled run succeeded October 4. Migration `20261004210443_academy_automatic_expiry.sql` is applied remotely, and 21 database scenarios pass.
- [x] Supabase `pg_cron` calls the hosted payment/refund recovery endpoint every five minutes with a private Vault token. An automatic run and HTTP 200 response are verified. Payment mode stays unconfigured until merchant test credentials exist.
- [x] Hosted production has the academy Supabase, private service key, canonical URL, email/backend switches and cron secret. No live gateway variables or payment collection are configured.

## Share safely for integration

Do not paste keys, webhook secrets, SMTP credentials, OAuth client secrets, recovery codes, customer records, or payment data into this chat. Add secrets directly to the deployment secret manager or a local ignored `.env` file. Then tell me which providers and environments are configured and share only nonsecret values needed to wire the setup, such as the canonical domain, Supabase project URL, publishable key, Razorpay plan ID, and approved staff email addresses.

Hosted Google/email login, session persistence, booking return, customer/staff access separation, owner schedule, inventory blocking and recovery scheduling are verified. Payment-backed holds, checkout, subscriptions, captured/failed charges, refunds and provider webhooks cannot be tested until a merchant account and test credentials exist. Keep gateway credentials private; no billing or charges are authorized.
