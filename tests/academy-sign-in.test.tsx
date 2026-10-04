import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { SignInPanel } from "@/components/auth/sign-in-panel";

afterEach(() => vi.unstubAllEnvs());

it("keeps Google available without offering unconfigured email delivery", () => {
  vi.stubEnv("NEXT_PUBLIC_ACADEMY_BACKEND_ENABLED", "true");
  const html = renderToStaticMarkup(
    React.createElement(SignInPanel, {
      configured: true,
      emailConfigured: false,
    }),
  );
  expect(html).toContain("Continue with Google");
  expect(html).toContain("Email sign-in is currently unavailable");
  expect(html).not.toContain('type="email"');
});

it("offers email links when SMTP has been configured", () => {
  vi.stubEnv("NEXT_PUBLIC_ACADEMY_BACKEND_ENABLED", "true");
  const html = renderToStaticMarkup(
    React.createElement(SignInPanel, {
      configured: true,
      emailConfigured: true,
    }),
  );
  expect(html).toContain('type="email"');
  expect(html).toContain("Email me a sign-in link");
});
