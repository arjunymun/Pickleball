# Owner activation checklist

This is the single owner-input gate for connecting the locally verified academy build to real services. The project is not launch-ready until staging authentication, payment, staff, and deployment flows pass. Review the detailed steps and security notes in `backend-setup.md` first. Per the October 4 owner update, Razorpay setup is on hold; do not create gateway credentials/plans/webhooks or enable payment collection until the owner resumes that work.

## Business and account decisions

- [ ] Confirm the canonical production domain and which deployment account/provider will host it.
- [ ] Confirm the country to use on first Google Cloud onboarding; the current first-use screen defaults to Canada. No Google Cloud project, OAuth client, billing account, or paid resource has been created.
- [x] Check the current Supabase project creation price for the existing organization immediately before provisioning: the connected Supabase tool quoted $0/month on October 3, 2026; its cost-confirmation step completed.
- [ ] Confirm the owner and trusted staff email addresses to receive staff access. No password or one-time code is needed in chat.
- [ ] Confirm the sender name/address customers should see in sign-in and booking email, and that the sender domain can be verified.
- [ ] Confirm the Razorpay merchant account is approved for both one-time court payments and recurring subscriptions/mandates, and that the club’s payout account is verified.
- [ ] Confirm the ₹2,500 membership mandate will use the documented monthly Razorpay plan configuration (120 monthly cycles, with cancellation available at the end of the paid period).

## Configure in provider dashboards

- [x] Create the dedicated Supabase project in the approved organization after confirming its price. Project: `doon-pickleball-academy` (`usvhawfvhvgepnwauqrs`), Mumbai (`ap-south-1`), PostgreSQL 17.11. Both versioned academy migrations are applied; all 14 academy tables have RLS enabled. The ignored local development file has this project’s URL, publishable key, and existing service-role key; academy switches remain off.
- [x] Add this project's existing service-role key only to the git-ignored local server environment (`.env.development.local`). It was validated against the `service_role` JWT claim; academy enable switches remain off, and the different-project `.env.local` was not reused.
- [ ] Configure Google OAuth and email magic-link SMTP and set the exact production `/auth/callback` redirect. Do not turn on the academy switches until these settings and owner/staff authorization are verified.
- [ ] Create/configure the Google OAuth client and add the Supabase callback URL in Google Cloud. Register the academy production callback in Supabase Auth.
- [ ] Select and configure a no-cost custom SMTP provider, verify the sender domain’s DNS records, and set the sender name/address. Brevo Free is a candidate (300 sends/day and SMTP support as of October 4) but requires an authenticated domain; confirm current limits before use. Put the SMTP secret in the provider dashboard; do not send it in chat.
- [ ] Create the ₹2,500/month Razorpay subscription plan. Enable automatic capture and subscriptions on the merchant account. Configure the payment webhook URL from `backend-setup.md`, select the documented events, and generate a webhook secret.
- [ ] Create test-mode Razorpay keys and webhook secret first. Keep live keys disabled until the staging checklist in `backend-setup.md` is fully passed.
- [ ] Keep payment testing in gateway test mode to honor the current zero-cost instruction. Razorpay's posted standard transaction charge is 2% + GST on successful payments; a limited offer is available only to eligible merchants under its terms. Recheck merchant-specific terms before any live payment activation. [Pricing](https://razorpay.com/pricing/) · [offer terms](https://razorpay.com/terms/subscription-plans/).
- [x] Generate a private 32-byte `CRON_SECRET` for local development and store it only in ignored `.env.development.local`.
- [ ] Configure the deployment scheduler to call `/api/cron/reconcile` every five minutes with a private deployment `CRON_SECRET`.
- [ ] Add the remaining academy environment variables from `.env.example` to local/private deployment settings. Keep the customer and server enable switches off until OAuth, SMTP, and staff authorization are verified.

## Share safely for integration

Do not paste keys, webhook secrets, SMTP credentials, OAuth client secrets, recovery codes, customer records, or payment data into this chat. Add secrets directly to the deployment secret manager or a local ignored `.env` file. Then tell me which providers and environments are configured and share only nonsecret values needed to wire the setup, such as the canonical domain, Supabase project URL, publishable key, Razorpay plan ID, and approved staff email addresses.

After inputs are ready, I will verify staging with independent customer/staff accounts, test Google and email login, parallel/expired bookings, captured and failed payments, webhooks, duplicate/late captures, refunds, subscription start/renewal failure/recovery/cancellation, daily attendance, public-data isolation, mobile/keyboard journeys, scheduler recovery, and deployment/rollback readiness. Live payments remain off until that passes and the owner explicitly authorizes activation.
