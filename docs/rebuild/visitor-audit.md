# Customer experience audit — October 6, 2026

**Fixes implemented; delivery verification in progress.** Reviewed the academy as a first-time customer, excluding payment-provider activation. This is part of the existing rebuild goal; that full goal remains blocked on verified payment inputs.

| Team member | Model | Assignment | Status |
|---|---|---|---|
| CEO / lead orchestrator | gpt-6.1-sol | Live visitor journeys, issue prioritization, integration and final verification | Local checks passed; publishing and verifying live |
| Customer specialist | gpt-6-luna | Booking, sign-in, membership/account UX and targeted fixes | Finished; lead reviewed and corrected integration details |
| Admin specialist | gpt-6-luna | Staff workflow issues, visitor-to-staff handoffs and targeted fixes | Finished; lead reviewed against timeline behavior |

Only one heavy model runs. Specialists have separate file ownership and no child agents. Model names describe assigned models, not billing measurements.

## Audit scope

- Discovery: understand location, hours, prices, membership and how to start playing.
- Booking: browse real availability, choose court/date/time and preserve the choice through sign-in.
- Account: understandable signed-out, empty, expired and unavailable states.
- Practical usability: mobile layout, keyboard access, clear errors and reduced-motion behavior.
- Operations: staff can act on customer requests without confusing dates, statuses or missing context.

## Findings and fixes

| Priority | Visitor issue | Evidence | Owner / action |
|---|---|---|---|
| High | Refresh loses chosen date, time and court | Live `/book`: choose October 8, 10 AM, Court 3; URL stays `/book`; reload resets October 7, 6 PM and Court 1 | Customer: preserve selection in URL and verify refresh/back |
| High | A requested court can silently change to another available court | `court-booking.tsx` falls back to the first available slot even with an explicit requested court | Customer: retain explicit choice and explain unavailable state |
| Medium | Staff shortcut starts on a past slot | `academy-operations.tsx` initializes global Add reservation at 06:00, even after that hour | Admin: choose a valid slot or explain none remain |
| Medium | Availability can look current after a slot has started | Loaded customer slots are not aged out locally until refresh | Customer: disable elapsed slots and reconcile fresh selection |
| Medium | Late visitors land on elapsed 6 PM availability | Original default hour was always 18; reproduced with fixed-clock regressions | Customer / lead: default to a future start, preserving explicit elapsed intent with an explanation |
| Medium | Customer reaches a predictable dead end | Live mobile Continue returns “Online payments are temporarily unavailable. Please call the academy.”; existing authenticated session; no hold was created | Customer: show call-to-reserve action upfront when checkout is unavailable; collection stays excluded |
| Medium | Booking/account instructions contradict available actions | Booking promises holding “while you pay”; held account item says “Continue to payment” when mode is unconfigured | Customer: honest status and next-action labels |
| Low | Local time is ambiguous on some detail views | Review/account time rows lack an IST label | Customer: consistent timezone disclosure |
| Medium | First-time practical questions require hunting through terms or calling without context | Homepage lacks concise cancellation/equipment/weather guidance | Lead: accessible practical FAQ, verified rules only; ask staff for unverified equipment/weather details |

All nine findings have implemented fixes. Passing build/tests alone does not establish good customer experience. Priority indicates customer impact, not a claim of a security vulnerability. Equipment and wet-weather details remain unverified business facts rather than invented answers.

## Guardrails and verification

No live customer reservations, membership changes, staff records or payments will be created for this audit. Preserve the existing recruiter preparation file. Genuine commits and the existing Vercel deployment remain authorized; no paid services or fabricated evidence.

This report will be updated at review and integration checkpoints. It is not a live token counter or an automatic agent telemetry dashboard.

## Integration checkpoint

- All 138 tests in 15 files, TypeScript, lint, scoped formatting checks and production build pass. Integrated lint caught the server timestamp read inside render; the request-time loader correction passed fresh lint. CI and hosted delivery checks accompany the delivery revision.
- Lead review corrected default-card highlighting and copy that described a hold before one existed. Initial selection and browser-history restoration now share a validated parser. The server passes an initial timestamp to keep initial rendering consistent across clock boundaries.
- Local mobile review verified the new FAQ opens with keyboard and pointer input without horizontal overflow. The original October 8 / 10 AM / Court 3 refresh case now retains all three choices; browser Back restores the prior choice.
- Review criteria: [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Selection history follows the documented [Next.js native History API](https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api).

## Practical limits and follow-up

- Equipment provision/rental, coaching or beginner sessions, and exact wet-weather policy are not verified business facts. The FAQ directs customers to staff rather than promising those services.
- Existing Google/email delivery was verified in the earlier launch checkpoint. This audit has not sent new sign-in emails or created a new customer account. Signed-out UI and account states have fixture coverage; existing authenticated live browsing was checked.
- Staff quick-add and its time/filter/occupancy rules have focused regression coverage and source review. No live staff reservation or attendance mutation was performed.
- Actual field performance, all assistive technologies and every device have not been certified by this audit. Existing WebGL fallback and reduced-motion behavior are preserved; this is a focused usability pass, not a guarantee that no defects remain.
