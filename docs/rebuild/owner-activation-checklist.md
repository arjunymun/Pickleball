# Owner activation checklist

This is the single owner-input gate for connecting the locally verified academy build to real services. The project is not launch-ready until staging authentication, payment, staff, and deployment flows pass. Review the detailed steps and security notes in `backend-setup.md` first. Per the October 4 owner update, Razorpay setup is on hold; do not create gateway credentials/plans/webhooks or enable payment collection until the owner resumes that work.

## Business and account decisions

- [x] Owner has no custom domain and does not authorize domain/hosting charges. Use a provider subdomain for staging while available; preferred candidate is Netlify Free, whose current documentation supports Next.js App Router and a `*.netlify.app` site address. Confirm the account's Free-plan limits before deployment; free hosting has no service-level commitment and may suspend the site at its limits. ChatGPT Sites can publish separate lightweight sites, but it is not the hosting/deployment pipeline for this existing Next.js/Supabase application. A custom domain is not included and would have to be purchased separately.
- [x] Use India for first Google Cloud onboarding. No Google Cloud project, OAuth client, billing account, or paid resource has been created. Keep billing unlinked/disabled.
- [x] Check the current Supabase project creation price for the existing organization immediately before provisioning: the connected Supabase tool quoted $0/month on October 3, 2026; its cost-confirmation step completed.
- [x] Owner requests access for themself only; no additional staff accounts. Assign the signed-in owner account after first verified sign-in. No password or one-time code is needed in chat.
- [x] Use `Doon Pickleball Academy` as the customer-facing sender name. Sender address and production magic-link email remain blocked until the owner controls an authenticated sending domain. Do not use a made-up address or send customer auth emails from the academy's free hosting subdomain. Brevo Free remains a candidate only after a real owned domain can be authenticated; purchasing a domain is outside the zero-cost constraint.
- [on hold] Razorpay merchant approval, subscription mandate, plans, credentials, webhooks, and payment testing. Owner explicitly asked to keep all Razorpay work paused; do not create or configure anything until resumed.

## Configure in provider dashboards

- [x] Create the dedicated Supabase project in the approved organization after confirming its price. Project: `doon-pickleball-academy` (`usvhawfvhvgepnwauqrs`), Mumbai (`ap-south-1`), PostgreSQL 17.11. Both versioned academy migrations are applied; all 14 academy tables have RLS enabled. The ignored local development file has this project’s URL, publishable key, and existing service-role key; academy switches remain off.
- [x] Add this project's existing service-role key only to the git-ignored local server environment (`.env.development.local`). It was validated against the `service_role` JWT claim; academy enable switches remain off, and the different-project `.env.local` was not reused.
- [ ] Configure Google OAuth and email magic-link SMTP and set the exact hosted `/auth/callback` redirect. Do not turn on the academy switches until OAuth and owner authorization are verified. Email magic-link delivery is blocked on an owned, authenticated sender domain.
- [ ] Create/configure the Google OAuth client and add the Supabase callback URL in Google Cloud after the owner completes India-based onboarding without enabling billing. Register the selected hosted callback in Supabase Auth.
- [ ] Choose/obtain an owner-controlled sending domain before setting up custom SMTP; current zero-cost constraint means no domain purchase is authorized. After a domain exists, configure the sender name above, verify DNS, and configure a no-cost SMTP provider after checking current limits. Brevo requires sender-domain authentication for reliable delivery. Put SMTP secrets only in provider/deployment settings.
- [on hold] Create the ₹2,500/month Razorpay subscription plan, enable automatic capture/subscriptions, configure webhooks, and generate secrets. Do not proceed until the owner resumes Razorpay.
- [on hold] Create test-mode Razorpay keys and webhook secret. Do not create keys while the hold is active.
- [on hold] Razorpay payment testing and any live-payment activation. No charges or paid account upgrades are authorized.
- [x] Generate a private 32-byte `CRON_SECRET` for local development and store it only in ignored `.env.development.local`.
- [ ] Deploy a staging build to the chosen no-cost provider subdomain after its account is authenticated; do not enable automatic GitHub deployment or push commits without separate authorization. Verify the free plan cannot incur usage charges and note its suspension/no-SLA limits.
- [ ] Configure a compatible scheduler for `/api/cron/reconcile` and private `CRON_SECRET`; verify runtime limits first. Netlify scheduled functions have a shorter execution limit than this endpoint's current 120-second maximum, so do not assume a direct scheduled-function deployment is compatible. Evaluate an alternative scheduler or make a tested bounded-runtime adjustment before activation.
- [ ] Add the remaining academy environment variables from `.env.example` to private staging settings. Keep customer and server enable switches off until OAuth and owner authorization are verified. Keep email-dependent flows unavailable until custom SMTP is configured.

## Share safely for integration

Do not paste keys, webhook secrets, SMTP credentials, OAuth client secrets, recovery codes, customer records, or payment data into this chat. Add secrets directly to the deployment secret manager or a local ignored `.env` file. Then tell me which providers and environments are configured and share only nonsecret values needed to wire the setup, such as the canonical domain, Supabase project URL, publishable key, Razorpay plan ID, and approved staff email addresses.

After owner account setup is ready, I will verify staging with the owner's account, test Google login, parallel/expired booking holds, public-data isolation, mobile/keyboard journeys, scheduler recovery, and deployment/rollback readiness. Email magic links cannot be verified until a sending domain and SMTP are configured. Razorpay and payment tests remain on hold until the owner explicitly resumes them; no payment credentials or charges are permitted now.
