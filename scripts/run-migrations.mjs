#!/usr/bin/env node
/**
 * Applies every file in supabase/migrations/*.sql, in order, against
 * DATABASE_URL — tracking what has already run in a `public._migrations`
 * table so this is safe to re-run (only new files execute; nothing is
 * re-applied). This is what `npm run db:migrate` calls.
 *
 * This was previously referenced by package.json but didn't exist —
 * `npm run db:migrate` silently failed with "cannot find module". The
 * Supabase CLI (`npx supabase db push`) or plain psql (see README) still
 * work as alternatives; this script exists for anyone who'd rather run one
 * npm command with a plain Postgres connection string.
 */

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import "dotenv/config";

const { Client } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, "..", "supabase", "migrations");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "DATABASE_URL topilmadi. .env.local ga Supabase Project Settings -> Database -> " +
        "Connection string (URI) dan olingan manzilni DATABASE_URL sifatida qo'shing.",
    );
    process.exit(1);
  }

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("supabase/migrations/ ichida .sql fayl topilmadi.");
    return;
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(
      `create table if not exists public._migrations (
         filename text primary key,
         applied_at timestamptz not null default now()
       );`,
    );

    const { rows } = await client.query("select filename from public._migrations;");
    const applied = new Set(rows.map((r) => r.filename));

    let appliedCount = 0;
    for (const file of files) {
      if (applied.has(file)) continue;

      const sql = await readFile(path.join(migrationsDir, file), "utf8");
      console.log(`-> ${file}`);

      await client.query("begin");
      try {
        await client.query(sql);
        await client.query("insert into public._migrations (filename) values ($1);", [file]);
        await client.query("commit");
        appliedCount += 1;
      } catch (err) {
        await client.query("rollback");
        console.error(`XATOLIK: ${file} qo'llanmadi.`);
        throw err;
      }
    }

    if (appliedCount === 0) {
      console.log("Barcha migrationlar allaqachon qo'llangan — yangi fayl yo'q.");
    } else {
      console.log(`${appliedCount} ta yangi migration qo'llandi.`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
