import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { ACADEMY } from "@/lib/academy/config";
import { addDays, indiaDate, slotStart } from "@/lib/academy/time";
import { CourtBooking } from "@/components/customer/court-booking";

const mockState = vi.hoisted(() => ({
  paymentMode: "unconfigured" as "unconfigured" | "live",
  availability: null as unknown,
}));

vi.mock("@/components/customer/customer-data", () => ({
  useCustomerData: (path: string) =>
    path.startsWith("/api/availability")
      ? {
          data: mockState.availability,
          loading: false,
          error: null,
          refresh: vi.fn(),
        }
      : {
          data: {
            user: null,
            configured: true,
            paymentMode: mockState.paymentMode,
            membership: null,
          },
          loading: false,
          error: null,
          refresh: vi.fn(),
        },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

function setScenario(
  date: string,
  hour: number,
  startsAt = slotStart(date, hour),
) {
  mockState.availability = {
    date,
    timezone: "Asia/Kolkata",
    generatedAt: new Date().toISOString(),
    courts: [
      { id: "court-1", name: "Court 1", number: 1 },
      { id: "court-2", name: "Court 2", number: 2 },
    ],
    slots: ["court-1", "court-2"].map((courtId) => ({
      id: `${courtId}-slot`,
      courtId,
      startsAt,
      endsAt: new Date(Date.parse(startsAt) + 60 * 60 * 1000).toISOString(),
      available: true,
      pricePaise: ACADEMY.courtPricePaise,
    })),
  };
}

afterEach(() => {
  vi.useRealTimers();
  mockState.paymentMode = "unconfigured";
});

it("offers a direct call action without implying availability reserves a court", () => {
  const date = addDays(indiaDate(), 1);
  setScenario(date, 23);
  const html = renderToStaticMarkup(
    React.createElement(CourtBooking, {
      initialDate: date,
      initialHour: "23",
    }),
  );

  expect(html).toContain(`href="${ACADEMY.phoneHref}"`);
  expect(html).toContain("Call to reserve");
  expect(html).toContain("Checking availability does not reserve this court");
  expect(html).toContain('aria-label="Court 1, selected"');
});

it("explains that Continue creates the hold before payment", () => {
  mockState.paymentMode = "live";
  const date = addDays(indiaDate(), 1);
  setScenario(date, 23);
  const html = renderToStaticMarkup(
    React.createElement(CourtBooking, {
      initialDate: date,
      initialHour: "23",
      initialCourt: "court-1",
    }),
  );

  expect(html).toContain("Continue creates a ten-minute hold");
  expect(html).not.toContain("Court held for ten minutes");
});

it("explains an explicit requested time that has elapsed", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-08T12:00:00.000Z"));
  setScenario("2026-10-08", 16);
  const html = renderToStaticMarkup(
    React.createElement(CourtBooking, {
      initialDate: "2026-10-08",
      initialHour: "16",
      initialCourt: "court-1",
    }),
  );

  expect(html).toContain("That requested start time has passed");
  expect(html).toContain("This court is unavailable at this time");
});

it("explains when an out-of-window query was reset", () => {
  const date = addDays(indiaDate(), 1);
  setScenario(date, 23);
  const html = renderToStaticMarkup(
    React.createElement(CourtBooking, {
      initialDate: "not-a-date",
      initialHour: "30",
    }),
  );

  expect(html).toContain("That date or time is outside the booking options");
});

it("uses the server clock snapshot for a consistent initial selection", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-09T07:30:00+05:30"));
  setScenario("2026-10-08", 21);
  const html = renderToStaticMarkup(
    React.createElement(CourtBooking, {
      initialNow: Date.parse("2026-10-08T20:30:00+05:30"),
    }),
  );
  expect(html).toContain('value="2026-10-08" selected=""');
  expect(html).toContain('value="21" selected=""');
  expect(html).toContain('aria-label="Court 1, selected"');
});
