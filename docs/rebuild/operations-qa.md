# Staff component QA evidence

Checked on 2026-10-03 using the isolated synthetic component fixture at `http://localhost:3004/`. The stale fixture PID 34996 was absent and port 3004 had no listener; started one fixture process (PID 7184). Browser session used a fresh Edge tab, ID `95780599`; the other existing Edge tabs were left untouched. The fixture banner identifies synthetic players and simulated requests, and the retry adapter is local-only.

## Render and keyboard checks

- Desktop payment follow-ups rendered the queue totals, failed refund review instructions, payment/refund references, pending court order, and membership cancellation. Screenshot: `.cache/operations-qa/staff-payments-desktop.png`.
- The same page was viewed at 375 CSS px by framing the fixture in `.cache/operations-qa/mobile-375.html`; its iframe is exactly 375px wide and 812px tall. The page and dialogs reflow into the narrow column. The staff navigation scrolls horizontally at this width, and the page keeps its own vertical scroll. Screenshots: `.cache/operations-qa/staff-court-board-mobile-375.png`, `.cache/operations-qa/staff-payments-mobile-375.png`, and `.cache/operations-qa/staff-reservation-dialog-mobile-375.png`.
- The reservation form selected Court 1, 09:00–10:00, and showed the expected source, customer, amount, and payment fields. The maintenance-block form showed court, time range, reason, and save control. Pressing Escape closed both dialogs and restored focus to the original opener (the 09:00 Court 1 slot and Add maintenance block). Maintenance dialog screenshot: `.cache/operations-qa/staff-maintenance-dialog-mobile-375.png`.
- The synthetic retry returned `1 processed, 1 failed, 2 unresolved`; after queue refresh, the failed ₹250 refund remained marked Failed with `pay_QA456` / `rfnd_QA456` and merchant-review guidance. No external provider was called.

## Scoped checks

- `eslint app/admin components/admin`: passed.
- TypeScript check with `.cache/operations-qa/tsconfig.admin.json` including `app/admin` and `components/admin`: passed.
- No formatter is installed/configured in this project (`prettier` unavailable).
- The existing 37 scoped staff tests were reported passing by the preceding run; not rerun because no code changed during this QA pass.

The preview cannot establish production authentication, reconciliation-provider behavior, real refunds, database/RLS behavior, or the provisioned-backend integration. Those remain unverified here.
