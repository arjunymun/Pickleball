"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { academyFetch } from "@/lib/academy/client";
import { formatMoney } from "@/lib/academy/config";
import type { AdminReconciliationPayload, ReconciliationResult } from "@/lib/academy/reconciliation-types";
import { formatCourtDate, formatCourtTime } from "@/lib/academy/time";
import { displayStatus } from "./operations-utils";
import styles from "./operations.module.css";

function checkedAt(value: string | null): string { return value ? `${formatCourtDate(value)} · ${formatCourtTime(value)} IST` : "Not checked yet"; }

export function AcademyPayments() {
  const [payload, setPayload] = useState<AdminReconciliationPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const version = useRef(0);
  const retryController = useRef<AbortController | null>(null);
  const load = useCallback(async () => {
    const current = ++version.current;
    setLoading(true); setError("");
    try { const result = await academyFetch<AdminReconciliationPayload>("/api/admin/reconciliation"); if (current === version.current) setPayload(result); }
    catch (failure) { if (current === version.current) setError(failure instanceof Error ? failure.message : "Unable to load payment follow-ups."); }
    finally { if (current === version.current) setLoading(false); }
  }, []);
  useEffect(() => { void load(); return () => { version.current += 1; retryController.current?.abort(); }; }, [load]);
  async function retry() {
    setRetrying(true); setError(""); setNotice("");
    const controller = new AbortController();
    retryController.current = controller;
    const timer = setTimeout(() => controller.abort(), 30_000);
    try {
      const result = await academyFetch<ReconciliationResult>("/api/admin/reconciliation", { method: "POST", signal: controller.signal });
      setNotice(`Processing pass: ${result.processed} processed, ${result.failed} failed, ${result.unresolved} unresolved. Review the refreshed queue below.`);
      await load();
    } catch (failure) {
      setError(controller.signal.aborted ? "Processing may still be running. Refresh the queue before retrying; an interrupted browser request does not reverse a provider operation." : failure instanceof Error ? failure.message : "Unable to retry queued processing.");
    } finally { clearTimeout(timer); retryController.current = null; setRetrying(false); }
  }
  const queued = payload ? payload.attempts.length + payload.refunds.length + payload.cancellations.length : 0;
  const busy = loading || retrying;
  return <><div className={styles.pageHeading}><div><p className="academy-eyebrow">Front desk · payments</p><h1>Payment follow-ups.</h1><p>Actual pending orders, refunds and membership cancellations.</p></div><div className={styles.actions}><button className="academy-button-secondary" type="button" disabled={busy} onClick={() => void load()}>Refresh queue</button><button className="academy-button" type="button" disabled={busy || !payload || Boolean(error)} onClick={() => void retry()}>{retrying ? "Processing queued work…" : "Retry queued processing"}</button></div></div>
    <section className={styles.notePanel}><h2>Verify before closing the loop.</h2><p>Processing checks existing provider orders and queued refunds. Failed refunds require a merchant review using their payment and refund references. A queued or failed item is not a completed payment or refund.</p>{payload?.instructions.length ? <ul>{payload.instructions.map((instruction, index) => <li key={index}>{instruction}</li>)}</ul> : null}</section>
    {notice && <p className={styles.success} role="status">{notice}</p>}{error && <div className="academy-alert" role="alert">{error}<p>The visible queue may be out of date. Refresh before taking action.</p></div>}
    <section className={styles.metrics} aria-label="Payment follow-up totals"><div><span>Pending records</span><strong>{payload ? queued : "—"}</strong></div><div><span>Refunds to review</span><strong>{payload?.refunds.length ?? "—"}</strong></div><div><span>Failed webhooks</span><strong>{payload?.webhooks.failed ?? "—"}</strong></div><div><span>Processing webhooks</span><strong>{payload?.webhooks.processing ?? "—"}</strong></div></section>
    <p className={styles.footnote} role="status">{busy ? retrying ? "Provider processing can take up to 20 seconds. Keep this screen open." : "Loading the verified queue…" : payload ? `Queue snapshot ${checkedAt(payload.generatedAt)} · ${payload.paymentMode} payment mode` : "Connect to the payment service to load follow-ups."}</p>
    {payload && <div className={styles.paymentSections}><section><h2>Refunds</h2>{payload.refunds.length === 0 ? <p className={styles.queueEmpty}>No pending or failed refunds.</p> : payload.refunds.map((refund) => <article className={styles.queueRecord} key={refund.id}><div className={styles.queueTitle}><h3>{refund.customerName}</h3><strong>{formatMoney(refund.amountPaise)}</strong><span className={`${styles.badge} ${refund.status === "failed" ? styles.failureBadge : ""}`}>{refund.status}</span></div><p>{refund.reason}</p>{refund.status === "failed" && <p className={styles.manualReview}>Merchant review required. Inspect the existing refund in the payment dashboard before arranging further action.</p>}<dl className={styles.queueDetails}><div><dt>Payment reference</dt><dd>{refund.paymentId}</dd></div><div><dt>Refund reference</dt><dd>{refund.providerRefundId ?? "Awaiting provider reference"}</dd></div><div><dt>Booking ID</dt><dd>{refund.bookingId}</dd></div><div><dt>Last checked</dt><dd>{checkedAt(refund.lastCheckedAt)}</dd></div></dl></article>)}</section>
      <section><h2>Orders & membership setup</h2>{payload.attempts.length === 0 ? <p className={styles.queueEmpty}>No payment setup awaits reconciliation.</p> : payload.attempts.map((attempt) => <article className={styles.queueRecord} key={attempt.id}><div className={styles.queueTitle}><h3>{attempt.customerName}</h3><strong>{formatMoney(attempt.amountPaise)}</strong><span className={styles.badge}>{displayStatus(attempt.status)}</span></div><p>{attempt.kind === "court" ? "Court payment order" : "Monthly membership subscription"}</p><dl className={styles.queueDetails}><div><dt>Provider reference</dt><dd>{attempt.providerId ?? "Provider creation needs reconciliation"}</dd></div><div><dt>Booking / request ID</dt><dd>{attempt.bookingId ?? attempt.id}</dd></div><div><dt>Created</dt><dd>{checkedAt(attempt.createdAt)}</dd></div><div><dt>Last checked</dt><dd>{checkedAt(attempt.lastCheckedAt)}</dd></div></dl></article>)}</section>
      <section><h2>Membership cancellations</h2>{payload.cancellations.length === 0 ? <p className={styles.queueEmpty}>No subscription cancellation awaits confirmation.</p> : payload.cancellations.map((cancellation) => <article className={styles.queueRecord} key={cancellation.id}><div className={styles.queueTitle}><h3>{cancellation.customerName}</h3><span className={styles.badge}>Cancellation pending</span></div><p>Confirm the subscription ends after its paid period. Player benefits follow the verified paid-through date.</p><dl className={styles.queueDetails}><div><dt>Subscription reference</dt><dd>{cancellation.subscriptionId ?? "No provider reference recorded"}</dd></div><div><dt>Requested</dt><dd>{checkedAt(cancellation.createdAt)}</dd></div><div><dt>Last checked</dt><dd>{checkedAt(cancellation.lastCheckedAt)}</dd></div></dl></article>)}</section></div>}
  </>;
}
