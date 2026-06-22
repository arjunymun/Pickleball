import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Mirrors the "@/*" -> "./*" path alias from tsconfig.json so tests can import modules that
// use it (e.g. lib/mock-data.ts -> "@/lib/booking/may"). The regex matches only the "@/"
// prefix, so scoped package imports like "@supabase/ssr" are left untouched.
const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: projectRoot }],
  },
});
