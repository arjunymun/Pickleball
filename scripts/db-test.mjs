import assert from "node:assert/strict";
import { readFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import net from "node:net";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";

const workspace = process.cwd();
const cacheRoot = path.resolve(workspace, ".cache");
const databaseDir = path.resolve(cacheRoot, `academy-pg-${randomUUID()}`);
assert(
  databaseDir.startsWith(`${cacheRoot}${path.sep}`),
  "Test database must stay inside the workspace cache.",
);
await mkdir(cacheRoot, { recursive: true });
const socket = net.createServer();
await new Promise((resolve, reject) => {
  socket.once("error", reject);
  socket.listen(0, "127.0.0.1", resolve);
});
const address = socket.address();
assert(address && typeof address === "object");
const port = address.port;
await new Promise((resolve) => socket.close(resolve));
const password = randomBytes(24).toString("hex");
const startupLogs = [];
const captureLog = (message) => {
  startupLogs.push(String(message).replaceAll(password, "[redacted]"));
  if (startupLogs.length > 30) startupLogs.shift();
};
const cluster = new EmbeddedPostgres({
  databaseDir,
  port,
  user: "postgres",
  password,
  persistent: true,
  postgresFlags: ["-c", "listen_addresses=127.0.0.1"],
  onLog: captureLog,
  onError: captureLog,
});
const clients = [];
let started = false;
let passed = 0;

async function connect(role) {
  const client = new pg.Client({
    host: "127.0.0.1",
    port,
    user: "postgres",
    password,
    database: "postgres",
  });
  await client.connect();
  clients.push(client);
  if (role) {
    assert(["service_role", "anon", "authenticated"].includes(role));
    await client.query(`set role ${role}`);
  }
  return client;
}
async function rpc(client, action, input = {}, actor = null) {
  const response = await client.query(
    "select public.academy_dispatch($1,$2::jsonb,$3::uuid) as value",
    [action, JSON.stringify(input), actor],
  );
  return response.rows[0].value;
}
async function test(name, run) {
  await run();
  passed += 1;
  process.stdout.write(`PASS ${name}\n`);
}
const key = () => randomUUID();
function runFile(file, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { windowsHide: true, stdio: "ignore" });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`PostgreSQL control exited with ${code}`)),
    );
  });
}
let windowsControl;
async function startCluster() {
  if (process.platform !== "win32") return cluster.start();
  // pg_ctl creates a restricted Windows process when the parent is elevated.
  windowsControl = (await import("@embedded-postgres/windows-x64")).pg_ctl;
  await runFile(
    windowsControl,
    [
      "-D",
      databaseDir,
      "-l",
      path.join(databaseDir, "server.log"),
      "-o",
      `-p ${port} -c listen_addresses=127.0.0.1`,
      "-w",
      "-t",
      "30",
      "start",
    ],
    { windowsHide: true },
  );
}

try {
  await cluster.initialise();
  try {
    await startCluster();
  } catch (error) {
    throw new Error(`PostgreSQL failed to start:\n${startupLogs.join("")}`, {
      cause: error,
    });
  }
  started = true;
  const admin = await connect();
  await admin.query(
    "create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; create schema auth; create table auth.users(id uuid primary key); grant usage on schema public,auth to anon,authenticated,service_role; grant select on auth.users to service_role;",
  );
  const migrationDirectory = path.join(workspace, "supabase/migrations");
  const migrations = (await readdir(migrationDirectory))
    .filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name))
    .sort();
  assert(migrations.length > 0, "At least one academy migration is required.");
  for (const name of migrations)
    await admin.query(await readFile(path.join(migrationDirectory, name), "utf8"));
  const service = await connect("service_role");
  const customerA = randomUUID();
  const customerB = randomUUID();
  const staff = randomUUID();
  await admin.query("insert into auth.users(id) values($1),($2),($3)", [
    customerA,
    customerB,
    staff,
  ]);
  await rpc(
    service,
    "repair_customer",
    { email: "a@example.test", name: "Test customer A" },
    customerA,
  );
  await rpc(
    service,
    "repair_customer",
    { email: "b@example.test", name: "Test customer B" },
    customerB,
  );
  await rpc(
    service,
    "repair_customer",
    { email: "staff@example.test", name: "Test staff" },
    staff,
  );
  await admin.query("update academy_customers set role='staff' where id=$1", [
    staff,
  ]);
  const day = (
    await admin.query(
      "select (((now() at time zone 'Asia/Kolkata')::date)+1)::text as day",
    )
  ).rows[0].day;
  const today = (
    await admin.query(
      "select ((now() at time zone 'Asia/Kolkata')::date)::text as day",
    )
  ).rows[0].day;
  const instant = (hour) =>
    new Date(
      `${day}T${String(hour).padStart(2, "0")}:00:00+05:30`,
    ).toISOString();
  const sameInstant = (a, b) => Date.parse(a) === Date.parse(b);
  const releaseHolds = async () => {
    await admin.query(
      "update academy_bookings set hold_expires_at=now()-interval '1 second' where status='held'",
    );
    await rpc(service, "availability", { date: day });
  };
  let availability = await rpc(service, "availability", { date: day });
  const courts = availability.courts;
  let winningBooking;

  await test("migration creates four courts and seventy-two public one-hour windows", async () => {
    assert.equal(courts.length, 4);
    assert.equal(availability.slots.length, 72);
    assert(
      availability.slots.every(
        (slot) => slot.available && slot.pricePaise === 50_000,
      ),
    );
    assert(!JSON.stringify(availability).includes("customerName"));
    const final = availability.slots.find((slot) =>
      sameInstant(slot.startsAt, instant(23)),
    );
    assert(final);
    assert.equal(new Date(final.endsAt) - new Date(final.startsAt), 3_600_000);
  });
  await test("anonymous and customer database roles cannot write booking state or invoke settlement", async () => {
    for (const role of ["anon", "authenticated"]) {
      const client = await connect(role);
      await assert.rejects(
        client.query("select * from academy_bookings"),
        /permission denied/,
      );
      await assert.rejects(
        client.query("update academy_bookings set payment_status='paid'"),
        /permission denied/,
      );
      await assert.rejects(
        rpc(client, "settle_payment", {}),
        /permission denied/,
      );
      await assert.rejects(
        rpc(client, "schedule", { date: day }, staff),
        /permission denied/,
      );
    }
  });
  await test("twenty simultaneous holds produce exactly one winner", async () => {
    const concurrent = await Promise.all(
      Array.from({ length: 20 }, () => connect("service_role")),
    );
    const results = await Promise.allSettled(
      concurrent.map((client, index) =>
        rpc(
          client,
          "hold",
          {
            courtId: courts[0].id,
            startsAt: instant(7),
            idempotencyKey: key(),
          },
          index % 2 ? customerA : customerB,
        ),
      ),
    );
    const winners = results.filter((result) => result.status === "fulfilled");
    assert.equal(winners.length, 1);
    assert.equal(
      results.filter((result) => result.status === "rejected").length,
      19,
    );
    winningBooking = winners[0].value.booking;
    assert.equal(winningBooking.status, "held");
    assert.equal(winningBooking.paymentStatus, "pending");
  });
  await test("all customers see the same occupied court and adjacent windows remain reservable", async () => {
    const snapshots = [];
    for (const actor of [null, customerA, customerB])
      snapshots.push(await rpc(service, "availability", { date: day }, actor));
    for (const snapshot of snapshots)
      assert.equal(
        snapshot.slots.find(
          (slot) =>
            slot.courtId === courts[0].id &&
            sameInstant(slot.startsAt, instant(7)),
        ).available,
        false,
      );
    const adjacent = await rpc(
      service,
      "hold",
      { courtId: courts[0].id, startsAt: instant(8), idempotencyKey: key() },
      winningBooking.customerId === customerA ? customerB : customerA,
    );
    assert.equal(adjacent.booking.status, "held");
    await releaseHolds();
  });
  await test("repeating a hold with the same key returns one reservation; changed input conflicts", async () => {
    const input = {
      courtId: courts[1].id,
      startsAt: instant(8),
      idempotencyKey: key(),
    };
    const first = await rpc(service, "hold", input, customerA);
    const retry = await rpc(service, "hold", input, customerA);
    assert.equal(first.booking.id, retry.booking.id);
    await assert.rejects(
      rpc(service, "hold", { ...input, startsAt: instant(9) }, customerA),
      /IDEMPOTENCY_CONFLICT/,
    );
    await releaseHolds();
  });
  await test("hold versus maintenance race cannot allocate the same court twice", async () => {
    const c1 = await connect("service_role");
    const c2 = await connect("service_role");
    const results = await Promise.allSettled([
      rpc(
        c1,
        "hold",
        { courtId: courts[2].id, startsAt: instant(10), idempotencyKey: key() },
        customerA,
      ),
      rpc(
        c2,
        "block",
        {
          courtId: courts[2].id,
          startsAt: instant(10),
          endsAt: instant(11),
          reason: "Court maintenance",
          idempotencyKey: key(),
        },
        staff,
      ),
    ]);
    assert.equal(
      results.filter((result) => result.status === "fulfilled").length,
      1,
    );
    await releaseHolds();
  });
  await test("expired holds release inventory and cannot start a new checkout", async () => {
    winningBooking = (
      await rpc(
        service,
        "hold",
        { courtId: courts[0].id, startsAt: instant(7), idempotencyKey: key() },
        customerA,
      )
    ).booking;
    await admin.query(
      "update academy_bookings set hold_expires_at=now()-interval '1 minute' where id=$1",
      [winningBooking.id],
    );
    availability = await rpc(service, "availability", { date: day });
    assert.equal(
      availability.slots.find(
        (slot) =>
          slot.courtId === courts[0].id &&
          sameInstant(slot.startsAt, instant(7)),
      ).available,
      true,
    );
    await assert.rejects(
      rpc(
        service,
        "prepare_order",
        { bookingId: winningBooking.id, idempotencyKey: key() },
        winningBooking.customerId,
      ),
      /HOLD_EXPIRED/,
    );
  });
  await test("customer cannot inspect another account or use staff mutations", async () => {
    const account = await rpc(service, "account", {}, customerA);
    assert(
      account.bookings.every((booking) => booking.customerId === customerA),
    );
    await assert.rejects(
      rpc(
        service,
        "booking_read",
        { bookingId: winningBooking.id },
        winningBooking.customerId === customerA ? customerB : customerA,
      ),
      /NOT_FOUND/,
    );
    await assert.rejects(
      rpc(service, "schedule", { date: day }, customerA),
      /FORBIDDEN/,
    );
    await assert.rejects(
      rpc(
        service,
        "block",
        {
          courtId: courts[3].id,
          startsAt: instant(10),
          endsAt: instant(11),
          reason: "Attempted customer block",
          idempotencyKey: key(),
        },
        customerA,
      ),
      /FORBIDDEN/,
    );
  });
  await test("external booking blocks public availability and records pending collection by default", async () => {
    const result = await rpc(
      service,
      "manual_booking",
      {
        courtId: courts[3].id,
        startsAt: instant(12),
        source: "playo",
        customerName: "Test external player",
        reference: "PL-TEST-1",
        idempotencyKey: key(),
      },
      staff,
    );
    assert.equal(result.booking.paymentStatus, "pending");
    const available = await rpc(service, "availability", { date: day });
    assert.equal(
      available.slots.find(
        (slot) =>
          slot.courtId === courts[3].id &&
          sameInstant(slot.startsAt, instant(12)),
      ).available,
      false,
    );
    await assert.rejects(rpc(service, "booking_action", { bookingId: result.booking.id, action: "check_in", idempotencyKey: key() }, staff), /INVALID_TRANSITION/);
    // Advance this isolated fixture into its session; production never backdates it.
    await admin.query("update academy_allocations set starts_at=now()-interval '5 minutes',ends_at=now()+interval '55 minutes' where id=$1", [result.booking.id]);
    const checked = await rpc(
      service,
      "booking_action",
      {
        bookingId: result.booking.id,
        action: "check_in",
        idempotencyKey: key(),
      },
      staff,
    );
    const schedule = await rpc(service, "schedule", { date: today }, staff);
    assert.equal(checked.booking.status, "checked_in");
    assert(
      schedule.bookings.some(
        (booking) =>
          booking.id === result.booking.id && booking.status === "checked_in",
      ),
    );
    const completed = await rpc(
      service,
      "booking_action",
      {
        bookingId: result.booking.id,
        action: "complete",
        idempotencyKey: key(),
      },
      staff,
    );
    assert.equal(completed.booking.status, "completed");
    await admin.query("update academy_allocations set starts_at=$2,ends_at=$3 where id=$1", [result.booking.id, instant(12), instant(13)]);
  });
  await test("maintenance removal restores a court window", async () => {
    const result = await rpc(
      service,
      "block",
      {
        courtId: courts[3].id,
        startsAt: instant(14),
        endsAt: instant(15),
        reason: "Test net repair",
        idempotencyKey: key(),
      },
      staff,
    );
    assert.equal(
      (await rpc(service, "availability", { date: day })).slots.find(
        (slot) =>
          slot.courtId === courts[3].id &&
          sameInstant(slot.startsAt, instant(14)),
      ).available,
      false,
    );
    await rpc(service, "delete_block", { blockId: result.block.id }, staff);
    assert.equal(
      (await rpc(service, "availability", { date: day })).slots.find(
        (slot) =>
          slot.courtId === courts[3].id &&
          sameInstant(slot.startsAt, instant(14)),
      ).available,
      true,
    );
  });
  await test("paid monthly membership changes court price and enforces one attendance record per day", async () => {
    await admin.query(
      "insert into academy_memberships(customer_id,status,current_period_start,paid_through,subscription_id) values($1,'active',now()-interval '1 day',now()+interval '29 days','sub_local_fixture')",
      [customerA],
    );
    const available = await rpc(
      service,
      "availability",
      { date: day },
      customerA,
    );
    assert(available.slots.every((slot) => slot.pricePaise === 40_000));
    const held = await rpc(
      service,
      "hold",
      { courtId: courts[0].id, startsAt: instant(16), idempotencyKey: key() },
      customerA,
    );
    assert.equal(held.booking.amountPaise, 40_000);
    const first = await rpc(
      service,
      "attendance",
      { customerId: customerA, date: today, idempotencyKey: key() },
      staff,
    );
    const repeated = await rpc(
      service,
      "attendance",
      { customerId: customerA, date: today, idempotencyKey: key() },
      staff,
    );
    assert.equal(first.attendance.id, repeated.attendance.id);
    await assert.rejects(
      rpc(
        service,
        "attendance",
        { customerId: customerB, date: today, idempotencyKey: key() },
        staff,
      ),
      /MEMBER_REQUIRED/,
    );
    await assert.rejects(
      rpc(
        service,
        "attendance",
        { customerId: customerA, date: day, idempotencyKey: key() },
        staff,
      ),
      /INVALID_REQUEST/,
    );
  });
  await test("expired membership has no discount or attendance entitlement", async () => {
    await admin.query(
      "update academy_memberships set paid_through=now()-interval '1 second' where customer_id=$1",
      [customerA],
    );
    const available = await rpc(
      service,
      "availability",
      { date: day },
      customerA,
    );
    assert(available.slots.every((slot) => slot.pricePaise === 50_000));
    await assert.rejects(
      rpc(
        service,
        "attendance",
        { customerId: customerA, date: today, idempotencyKey: key() },
        staff,
      ),
      /MEMBER_REQUIRED/,
    );
  });
  await releaseHolds();
  async function orderedHold(courtIndex, hour, actor = customerB) {
    const booking = (
      await rpc(
        service,
        "hold",
        {
          courtId: courts[courtIndex].id,
          startsAt: instant(hour),
          idempotencyKey: key(),
        },
        actor,
      )
    ).booking;
    const input = { bookingId: booking.id, idempotencyKey: key() };
    const attempt = await rpc(service, "prepare_order", input, actor);
    const orderId = `order_${randomBytes(8).toString("hex")}`;
    await rpc(service, "attach_provider", {
      attemptId: attempt.id,
      providerId: orderId,
      amountPaise: attempt.amount_paise,
    });
    return { booking, attempt, input, orderId, actor };
  }
  const captured = (
    order,
    paymentId = `pay_${randomBytes(8).toString("hex")}`,
  ) => ({
    orderId: order.orderId,
    paymentId,
    amountPaise: order.attempt.amount_paise,
    capturedAt: new Date().toISOString(),
  });
  let paidOrder;
  await test("checkout owns its mapping, reuses an order, and rejects a mismatched amount", async () => {
    paidOrder = await orderedHold(0, 18);
    const retry = await rpc(
      service,
      "prepare_order",
      paidOrder.input,
      paidOrder.actor,
    );
    assert.equal(retry.id, paidOrder.attempt.id);
    assert.equal(retry.provider_id, paidOrder.orderId);
    assert.equal(retry.create, false);
    await assert.rejects(
      rpc(
        service,
        "order_mapping",
        { bookingId: paidOrder.booking.id },
        customerA,
      ),
      /NOT_FOUND/,
    );
    await assert.rejects(
      rpc(service, "settle_payment", {
        ...captured(paidOrder),
        amountPaise: 1,
      }),
      /INVALID_REQUEST/,
    );
    assert.equal(
      (
        await rpc(
          service,
          "booking_read",
          { bookingId: paidOrder.booking.id },
          paidOrder.actor,
        )
      ).booking.status,
      "held",
    );
  });
  await test("captured payment confirms exactly once and duplicate capture gets its own refund", async () => {
    const payment = captured(paidOrder);
    const settled = await rpc(service, "settle_payment", payment);
    const retry = await rpc(service, "settle_payment", payment);
    assert.equal(settled.booking.status, "confirmed");
    assert.equal(retry.booking.id, settled.booking.id);
    const extra = captured(paidOrder);
    assert.equal(
      (await rpc(service, "settle_payment", extra)).booking.status,
      "confirmed",
    );
    const extra2 = captured(paidOrder);
    await rpc(service, "settle_payment", extra2);
    const rows = (
      await admin.query("select * from academy_refunds where booking_id=$1", [
        paidOrder.booking.id,
      ])
    ).rows;
    assert.equal(rows.length, 2);
    assert(rows.every((row) => row.status === "pending"));
    assert.equal(
      (
        await admin.query(
          "select count(*)::int as count from academy_payments where booking_id=$1 and not refund_required",
          [paidOrder.booking.id],
        )
      ).rows[0].count,
      1,
    );
  });
  await test("late payment creates a refund without reviving inventory claimed by another customer", async () => {
    const late = await orderedHold(1, 19);
    await admin.query(
      "update academy_bookings set hold_expires_at=now()-interval '1 second' where id=$1",
      [late.booking.id],
    );
    const replacement = (
      await rpc(
        service,
        "hold",
        { courtId: courts[1].id, startsAt: instant(19), idempotencyKey: key() },
        customerA,
      )
    ).booking;
    const result = await rpc(service, "settle_payment", captured(late));
    assert.equal(result.booking.status, "expired");
    assert.equal(result.booking.paymentStatus, "refund_pending");
    assert.equal(
      (
        await rpc(
          service,
          "booking_read",
          { bookingId: replacement.id },
          customerA,
        )
      ).booking.status,
      "held",
    );
    const jobs = await rpc(service, "jobs");
    assert(jobs.refunds.some((job) => job.amount_paise === 50_000));
    await releaseHolds();
  });
  await test("failed or pending refunds do not fabricate a completed refund; processed callbacks are idempotent", async () => {
    const refundable = await orderedHold(2, 20);
    const payment = captured(refundable);
    await rpc(service, "settle_payment", payment);
    const cancelled = await rpc(
      service,
      "booking_action",
      {
        bookingId: refundable.booking.id,
        action: "cancel",
        reason: "Customer called to cancel",
        refundPaise: 25_000,
        idempotencyKey: key(),
      },
      staff,
    );
    assert.equal(cancelled.booking.status, "cancelled");
    assert.equal(cancelled.booking.refundedPaise, 0);
    const refund = (
      await admin.query("select * from academy_refunds where booking_id=$1", [
        refundable.booking.id,
      ])
    ).rows[0];
    const input = {
      refundId: refund.id,
      providerRefundId: `rfnd_${randomBytes(8).toString("hex")}`,
      paymentId: payment.paymentId,
      amountPaise: 25_000,
    };
    await assert.rejects(
      rpc(service, "refund_finish", {
        ...input,
        amountPaise: 50_000,
        status: "processed",
      }),
      /INVALID_REQUEST/,
    );
    await rpc(service, "refund_finish", { ...input, status: "pending" });
    assert.equal(
      (
        await rpc(
          service,
          "booking_read",
          { bookingId: refundable.booking.id },
          customerB,
        )
      ).booking.refundedPaise,
      0,
    );
    await rpc(service, "refund_finish", { ...input, status: "processed" });
    await rpc(service, "refund_finish", { ...input, status: "processed" });
    const final = (
      await rpc(
        service,
        "booking_read",
        { bookingId: refundable.booking.id },
        customerB,
      )
    ).booking;
    assert.equal(final.refundedPaise, 25_000);
    assert.equal(final.paymentStatus, "partially_refunded");
  });
  await test("webhook claims prevent duplicate processing and permit failed-event retry", async () => {
    const input = {
      eventId: `event_${key()}`,
      bodyHash: "fixture-body-hash",
      payload: { event: "payment.captured" },
    };
    assert.equal((await rpc(service, "claim_event", input)).claimed, true);
    assert.equal((await rpc(service, "claim_event", input)).claimed, false);
    await assert.rejects(
      rpc(service, "claim_event", { ...input, bodyHash: "different-body" }),
      /CONFLICT/,
    );
    await rpc(service, "finish_event", {
      eventId: input.eventId,
      success: false,
    });
    assert.equal((await rpc(service, "claim_event", input)).claimed, true);
    await rpc(service, "finish_event", {
      eventId: input.eventId,
      success: true,
    });
    const completed = await rpc(service, "claim_event", input);
    assert.equal(completed.claimed, false);
    assert.equal(completed.processed, true);
  });
  await test("staff reconciliation is private and exposes failed refunds without a fabricated return", async () => {
    await assert.rejects(rpc(service, "reconciliation", {}, customerA), /FORBIDDEN/);
    const refund = (await admin.query("select * from academy_refunds where status='pending' order by created_at limit 1")).rows[0];
    assert(refund);
    const providerRefundId = `rfnd_${randomBytes(8).toString("hex")}`;
    await rpc(service, "refund_finish", { refundId: refund.id, providerRefundId, paymentId: refund.payment_id, amountPaise: refund.amount_paise, status: "failed" });
    const queue = await rpc(service, "reconciliation", {}, staff);
    assert(queue.refunds.some((row) => row.id === refund.id && row.status === "failed" && row.providerRefundId === providerRefundId));
    assert(!JSON.stringify(queue).includes("body_hash"));
    assert(!JSON.stringify(queue).includes("payload"));
    assert.equal((await admin.query("select status from academy_refunds where id=$1", [refund.id])).rows[0].status, "failed");
  });
  await test("membership remains unpaid until charge, preserves paid time on cancellation and loses benefit on expiry", async () => {
    const attempt = await rpc(
      service,
      "prepare_subscription",
      { idempotencyKey: key() },
      customerB,
    );
    const subscriptionId = `sub_${randomBytes(8).toString("hex")}`;
    await rpc(service, "attach_provider", {
      attemptId: attempt.id,
      providerId: subscriptionId,
      amountPaise: 250_000,
    });
    assert.equal(
      (await rpc(service, "account", {}, customerB)).membership.status,
      "pending",
    );
    const start = new Date(Date.now() - 60_000).toISOString();
    const end = new Date(Date.now() + 29 * 86_400_000).toISOString();
    const input = {
      subscriptionId,
      paymentId: `pay_${randomBytes(8).toString("hex")}`,
      amountPaise: 250_000,
      capturedAt: new Date().toISOString(),
      periodStart: start,
      periodEnd: end,
    };
    await assert.rejects(
      rpc(service, "subscription_charge", { ...input, amountPaise: 25_000 }),
      /INVALID_REQUEST/,
    );
    await rpc(service, "subscription_charge", input);
    await rpc(service, "subscription_charge", input);
    assert.equal(
      (await rpc(service, "account", {}, customerB)).membership.status,
      "active",
    );
    const cancelled = await rpc(
      service,
      "cancel_membership",
      { providerConfirmed: true },
      customerB,
    );
    assert.equal(cancelled.membership.cancelAtPeriodEnd, true);
    assert.equal(cancelled.membership.status, "active");
    assert(
      (
        await rpc(service, "availability", { date: day }, customerB)
      ).slots.every((slot) => slot.pricePaise === 40_000),
    );
    await rpc(service, "membership_state", {
      subscriptionId,
      state: "halted",
      eventTime: 100,
    });
    assert.equal(
      (
        await rpc(service, "membership_state", {
          subscriptionId,
          state: "active",
          eventTime: 99,
        })
      ).ignored,
      true,
    );
    await admin.query(
      "update academy_memberships set paid_through=now()-interval '1 second' where subscription_id=$1",
      [subscriptionId],
    );
    assert(
      (
        await rpc(service, "availability", { date: day }, customerB)
      ).slots.every((slot) => slot.pricePaise === 50_000),
    );
  });
  await test("free individual member play consumes today's benefit and blocks that court without free court hire", async () => {
    const memberId = randomUUID();
    await admin.query("insert into auth.users(id) values($1)", [memberId]);
    await rpc(
      service,
      "repair_customer",
      { email: "member@example.test", name: "Test daily member" },
      memberId,
    );
    await admin.query(
      "insert into academy_memberships(customer_id,status,current_period_start,paid_through,subscription_id) values($1,'active',now()-interval '1 day',now()+interval '29 days','sub_daily_fixture')",
      [memberId],
    );
    const currentHour = (await admin.query("select greatest(6,extract(hour from now() at time zone 'Asia/Kolkata'))::int as hour")).rows[0].hour;
    const startsAt = new Date(`${today}T${String(currentHour).padStart(2, "0")}:00:00+05:30`).toISOString();
    const input = {
      courtId: courts[3].id,
      startsAt,
      source: "individual_play",
      customerName: "Test daily member",
      customerId: memberId,
      idempotencyKey: key(),
    };
    const booking = (await rpc(service, "manual_booking", input, staff))
      .booking;
    assert.equal(booking.amountPaise, 0);
    assert.equal(booking.paymentStatus, "not_required");
    assert.equal(
      (
        await admin.query(
          "select count(*)::int as count from academy_attendance where customer_id=$1 and visit_date=$2",
          [memberId, today],
        )
      ).rows[0].count,
      1,
    );
    await assert.rejects(
      rpc(
        service,
        "manual_booking",
        { ...input, courtId: courts[2].id, idempotencyKey: key() },
        staff,
      ),
      /BENEFIT_USED/,
    );
    const held = (
      await rpc(
        service,
        "hold",
        { courtId: courts[3].id, startsAt: instant(22), idempotencyKey: key() },
        memberId,
      )
    ).booking;
    assert.equal(held.amountPaise, 40_000);
  });
  process.stdout.write(
    `\n${passed} PostgreSQL integration scenarios passed. Database roles and concurrent connections were exercised against PostgreSQL 17.\n`,
  );
} finally {
  await Promise.allSettled(clients.map((client) => client.end()));
  if (started) {
    if (windowsControl)
      await runFile(
        windowsControl,
        ["-D", databaseDir, "-m", "fast", "-w", "stop"],
        { windowsHide: true },
      );
    else await cluster.stop();
  }
}
