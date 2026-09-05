#!/usr/bin/env node
/**
 * Idempotent dev/staging fixtures — safe to run repeatedly (everything is
 * `on conflict do nothing`). Schema-level seed data (categories, the
 * default Malika market) already ships as ordinary migrations
 * (0022_seed_categories.sql, 0023_markets_and_locations.sql) since those
 * are needed for the app to function at all; this script is for the
 * optional extras that make local/staging data browsable — right now just
 * the brand list used by catalog_products.brand_id.
 */

import pg from "pg";
import "dotenv/config";

const { Client } = pg;

const BRANDS = [
  { name: "Apple", slug: "apple" },
  { name: "Samsung", slug: "samsung" },
  { name: "Xiaomi", slug: "xiaomi" },
  { name: "Redmi", slug: "redmi" },
  { name: "Honor", slug: "honor" },
  { name: "Google", slug: "google" },
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "DATABASE_URL topilmadi. .env.local ga Supabase Project Settings -> Database -> " +
        "Connection string (URI) dan olingan manzilni DATABASE_URL sifatida qo'shing.",
    );
    process.exit(1);
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    let inserted = 0;
    for (const brand of BRANDS) {
      const { rowCount } = await client.query(
        `insert into public.brands (name, slug) values ($1, $2) on conflict (slug) do nothing;`,
        [brand.name, brand.slug],
      );
      inserted += rowCount;
    }
    console.log(`Brendlar: ${inserted} ta yangi qo'shildi (${BRANDS.length - inserted} ta allaqachon bor edi).`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
