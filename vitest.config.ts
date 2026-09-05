import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // DB tests share one real Postgres connection per file (see
    // tests/db/reservations.security.test.ts) — running files in parallel
    // workers would each open their own connection against the same test
    // database, which is fine, but keeping this sequential avoids any
    // cross-file fixture ordering surprises as more suites are added.
    fileParallelism: false,
  },
});
