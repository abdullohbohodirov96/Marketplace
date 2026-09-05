/**
 * Automated regression tests for the reservation security invariants added
 * in 0028_reservation_and_variant_hardening.sql and
 * 0029_reservation_state_machine_and_locking.sql.
 *
 * These hit a REAL Postgres database directly with `pg` (not the Supabase
 * client) so they exercise the actual triggers/constraints, the same way a
 * malicious direct REST call to PostgREST would — this is deliberately
 * testing the database's own defenses, not just the Next.js server actions
 * that normally front them.
 *
 * Requires DATABASE_URL to point at a disposable local/test Postgres
 * database with every migration in supabase/migrations applied (see
 * scripts/local-supabase-shim.sql + README "Local verification" section
 * for how to build one). NEVER point this at a production database — the
 * suite inserts and deletes data. If DATABASE_URL isn't set, the whole
 * suite is skipped with a clear message rather than failing CI/dev
 * machines that haven't set up a local Postgres.
 */
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Client } from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;

const SELLER = "e1e1e1e1-0000-0000-0000-000000000001";
const BUYER1 = "e1e1e1e1-0000-0000-0000-000000000002";
const BUYER2 = "e1e1e1e1-0000-0000-0000-000000000003";
const STRANGER = "e1e1e1e1-0000-0000-0000-000000000004";
const ADMIN = "e1e1e1e1-0000-0000-0000-000000000009";
const STORE = "e1e1e1e1-0000-0000-0000-000000000005";
const CATEGORY = "e1e1e1e1-0000-0000-0000-000000000006";
const BRAND = "e1e1e1e1-0000-0000-0000-000000000007";
const CATALOG = "e1e1e1e1-0000-0000-0000-000000000008";

/**
 * is_local=true (the third arg) makes this setting transaction-scoped — it
 * evaporates on COMMIT/ROLLBACK, so every test starts as "no session" (a
 * real NULL from current_setting(..., true)) unless it opts in. Note that
 * Postgres has no clean way to go back to a true NULL mid-transaction once
 * set_config has been called (it coerces to '', which auth.uid()'s ::uuid
 * cast then rejects) — tests that need "privileged" mid-test use the ADMIN
 * fixture (a real profiles.role = 'admin' row) rather than trying to
 * simulate a service-role/no-session request after already acting as a
 * real user.
 */
async function actAs(client: Client, uid: string) {
  await client.query("select set_config('request.jwt.uid', $1, true)", [uid]);
}

async function insertUsedDevice(client: Client, opts: { availability?: boolean; price?: number } = {}) {
  const id = randomUUID();
  const price = opts.price ?? 5_000_000;
  await client.query(
    `insert into public.used_device_units (id, catalog_product_id, store_id, slug, price, status, availability)
     values ($1, $2, $3, $4, $5, 'active', $6)`,
    [id, CATALOG, STORE, `vitest-device-${id}`, price, opts.availability ?? true],
  );
  return { id, price };
}

/** Runs `fn` inside a SAVEPOINT and asserts it rejects with a message matching `pattern`, then rolls back to the savepoint so the enclosing test transaction can keep going. */
async function expectRejected(client: Client, fn: () => Promise<unknown>, pattern: RegExp) {
  await client.query("savepoint sp");
  try {
    await fn();
    throw new Error("Expected the query to be rejected by the database, but it succeeded");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    expect(message).toMatch(pattern);
  } finally {
    await client.query("rollback to savepoint sp");
  }
}

const maybeDescribe = connectionString ? describe : describe.skip;

if (!connectionString) {
  console.warn(
    "\n[reservations.security.test] DATABASE_URL is not set — skipping. " +
      "Point it at a disposable local Postgres test database (see README) to run these tests.\n",
  );
}

maybeDescribe("reservation security invariants (0028 + 0029)", () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({ connectionString });
    await client.connect();

    await client.query("insert into auth.users (id) values ($1), ($2), ($3), ($4), ($5) on conflict do nothing", [
      SELLER,
      BUYER1,
      BUYER2,
      STRANGER,
      ADMIN,
    ]);
    // handle_new_auth_user() (0003_identity.sql) auto-creates a profiles
    // row (default role) the instant auth.users gets a new row above, so a
    // plain "on conflict do nothing" here would silently keep that default
    // role — upsert the role explicitly instead.
    await client.query(
      `insert into public.profiles (id, full_name, role) values
         ($1, 'Vitest Seller', 'seller'),
         ($2, 'Vitest Buyer 1', 'customer'),
         ($3, 'Vitest Buyer 2', 'customer'),
         ($4, 'Vitest Stranger', 'customer'),
         ($5, 'Vitest Admin', 'admin')
       on conflict (id) do update set role = excluded.role`,
      [SELLER, BUYER1, BUYER2, STRANGER, ADMIN],
    );
    await client.query(
      "insert into public.categories (id, name_uz, slug) values ($1, 'Vitest Telefonlar', 'vitest-telefonlar') on conflict do nothing",
      [CATEGORY],
    );
    await client.query("insert into public.brands (id, name, slug) values ($1, 'Vitest Brand', 'vitest-brand') on conflict do nothing", [
      BRAND,
    ]);
    await client.query(
      `insert into public.stores (id, owner_id, name, slug, phone_primary, status)
       values ($1, $2, 'Vitest Store', 'vitest-store', '+998900000099', 'approved')
       on conflict (id) do nothing`,
      [STORE, SELLER],
    );
    await client.query(
      `insert into public.catalog_products (id, name, slug, category_id, brand_id, status)
       values ($1, 'Vitest Phone', 'vitest-phone', $2, $3, 'approved')
       on conflict (id) do nothing`,
      [CATALOG, CATEGORY, BRAND],
    );
  });

  afterAll(async () => {
    await client.end();
  });

  beforeEach(async () => {
    await client.query("begin");
  });

  afterEach(async () => {
    await client.query("rollback");
  });

  it("normalizes a buyer's INSERT so status/timestamps/seller_comment can never be fabricated", async () => {
    const device = await insertUsedDevice(client);
    await actAs(client, BUYER1);

    const { rows } = await client.query(
      `insert into public.reservations
         (user_id, store_id, used_device_unit_id, price_locked, status, confirmed_at, purchased_at, seller_comment)
       values ($1, $2, $3, $4, 'purchased', now(), now(), 'fake self-approval')
       returning status, confirmed_at, purchased_at, seller_comment`,
      [BUYER1, STORE, device.id, device.price],
    );

    expect(rows[0].status).toBe("pending");
    expect(rows[0].confirmed_at).toBeNull();
    expect(rows[0].purchased_at).toBeNull();
    expect(rows[0].seller_comment).toBeNull();
  });

  it("forces a server-computed expires_at regardless of what the client sends", async () => {
    const device = await insertUsedDevice(client);
    await actAs(client, BUYER1);

    const { rows } = await client.query(
      `insert into public.reservations (user_id, store_id, used_device_unit_id, price_locked, expires_at)
       values ($1, $2, $3, $4, now() + interval '5 years')
       returning expires_at`,
      [BUYER1, STORE, device.id, device.price],
    );

    const expiresAt = new Date(rows[0].expires_at).getTime();
    expect(expiresAt).toBeLessThan(Date.now() + 5 * 60 * 60 * 1000);
  });

  it("rejects a price_locked that doesn't match the device's real price", async () => {
    const device = await insertUsedDevice(client, { price: 5_000_000 });
    await actAs(client, BUYER1);

    await expectRejected(
      client,
      () =>
        client.query(
          `insert into public.reservations (user_id, store_id, used_device_unit_id, price_locked) values ($1, $2, $3, 1)`,
          [BUYER1, STORE, device.id],
        ),
      /price_locked joriy narxga mos emas/,
    );
  });

  it("rejects reserving an unavailable device", async () => {
    const device = await insertUsedDevice(client, { availability: false });
    await actAs(client, BUYER1);

    await expectRejected(
      client,
      () =>
        client.query(`insert into public.reservations (user_id, store_id, used_device_unit_id, price_locked) values ($1, $2, $3, $4)`, [
          BUYER1,
          STORE,
          device.id,
          device.price,
        ]),
      /mahsulot hozir mavjud emas/,
    );
  });

  it("prevents two buyers from holding an active reservation on the same device at once", async () => {
    const device = await insertUsedDevice(client);
    await actAs(client, BUYER1);
    await client.query(`insert into public.reservations (user_id, store_id, used_device_unit_id, price_locked) values ($1, $2, $3, $4)`, [
      BUYER1,
      STORE,
      device.id,
      device.price,
    ]);

    await actAs(client, BUYER2);
    await expectRejected(
      client,
      () =>
        client.query(`insert into public.reservations (user_id, store_id, used_device_unit_id, price_locked) values ($1, $2, $3, $4)`, [
          BUYER2,
          STORE,
          device.id,
          device.price,
        ]),
      /duplicate key value violates unique constraint "reservations_one_active_per_device_idx"/,
    );
  });

  it("lets a second buyer reserve the same device once the first hold is cancelled", async () => {
    const device = await insertUsedDevice(client);
    await actAs(client, BUYER1);
    const {
      rows: [reservation],
    } = await client.query(
      `insert into public.reservations (user_id, store_id, used_device_unit_id, price_locked) values ($1, $2, $3, $4) returning id`,
      [BUYER1, STORE, device.id, device.price],
    );
    await client.query("update public.reservations set status = 'cancelled' where id = $1", [reservation.id]);

    await actAs(client, BUYER2);
    const { rows } = await client.query(
      `insert into public.reservations (user_id, store_id, used_device_unit_id, price_locked) values ($1, $2, $3, $4) returning status`,
      [BUYER2, STORE, device.id, device.price],
    );
    expect(rows[0].status).toBe("pending");
  });

  it("enforces the seller's state machine — no skipping from pending straight to purchased", async () => {
    const device = await insertUsedDevice(client);
    await actAs(client, BUYER1);
    const {
      rows: [reservation],
    } = await client.query(
      `insert into public.reservations (user_id, store_id, used_device_unit_id, price_locked) values ($1, $2, $3, $4) returning id`,
      [BUYER1, STORE, device.id, device.price],
    );

    await actAs(client, SELLER);
    await expectRejected(
      client,
      () => client.query("update public.reservations set status = 'purchased' where id = $1", [reservation.id]),
      /bu status o'tishi ruxsat etilmagan/,
    );
  });

  it("never lets a store member change price_locked, the target, or the buyer", async () => {
    const device = await insertUsedDevice(client);
    await actAs(client, BUYER1);
    const {
      rows: [reservation],
    } = await client.query(
      `insert into public.reservations (user_id, store_id, used_device_unit_id, price_locked) values ($1, $2, $3, $4) returning id`,
      [BUYER1, STORE, device.id, device.price],
    );

    await actAs(client, SELLER);
    await expectRejected(
      client,
      () => client.query("update public.reservations set price_locked = 1 where id = $1", [reservation.id]),
      /bu maydonlarni faqat administrator o'zgartira oladi/,
    );
    await expectRejected(
      client,
      () => client.query("update public.reservations set user_id = $2 where id = $1", [reservation.id, BUYER2]),
      /bu maydonlarni faqat administrator o'zgartira oladi/,
    );
  });

  it("never lets a buyer set their own reservation to purchased", async () => {
    const device = await insertUsedDevice(client);
    await actAs(client, BUYER1);
    const {
      rows: [reservation],
    } = await client.query(
      `insert into public.reservations (user_id, store_id, used_device_unit_id, price_locked) values ($1, $2, $3, $4) returning id`,
      [BUYER1, STORE, device.id, device.price],
    );

    await expectRejected(
      client,
      () => client.query("update public.reservations set status = 'purchased' where id = $1", [reservation.id]),
      /xaridor faqat kutilayotgan band qilishni bekor qila oladi/,
    );
  });

  it("blocks a totally unrelated user from touching someone else's reservation", async () => {
    const device = await insertUsedDevice(client);
    await actAs(client, BUYER1);
    const {
      rows: [reservation],
    } = await client.query(
      `insert into public.reservations (user_id, store_id, used_device_unit_id, price_locked) values ($1, $2, $3, $4) returning id`,
      [BUYER1, STORE, device.id, device.price],
    );

    await actAs(client, STRANGER);
    await expectRejected(
      client,
      () => client.query("update public.reservations set status = 'cancelled' where id = $1", [reservation.id]),
      /sizda bu yozuvni o'zgartirish huquqi yo'q/,
    );
  });

  it("walks a reservation through the full legal state machine and auto-closes the device on purchase", async () => {
    const device = await insertUsedDevice(client);
    await actAs(client, BUYER1);
    const {
      rows: [reservation],
    } = await client.query(
      `insert into public.reservations (user_id, store_id, used_device_unit_id, price_locked) values ($1, $2, $3, $4) returning id`,
      [BUYER1, STORE, device.id, device.price],
    );

    await actAs(client, SELLER);
    await client.query("update public.reservations set status = 'seller_confirmed' where id = $1", [reservation.id]);
    await client.query("update public.reservations set status = 'customer_arrived' where id = $1", [reservation.id]);
    const {
      rows: [{ status: finalStatus, purchased_at: purchasedAt }],
    } = await client.query("update public.reservations set status = 'purchased' where id = $1 returning status, purchased_at", [
      reservation.id,
    ]);

    expect(finalStatus).toBe("purchased");
    expect(purchasedAt).not.toBeNull();

    const {
      rows: [deviceRow],
    } = await client.query("select status, availability from public.used_device_units where id = $1", [device.id]);
    expect(deviceRow.status).toBe("out_of_stock");
    expect(deviceRow.availability).toBe(false);

    await expectRejected(
      client,
      () => client.query("update public.reservations set status = 'seller_confirmed' where id = $1", [reservation.id]),
      /bu status o'tishi ruxsat etilmagan/,
    );
  });

  it("expire_stale_reservations() flips lapsed holds but refuses an ordinary authenticated caller", async () => {
    const device = await insertUsedDevice(client);
    await actAs(client, BUYER1);
    const {
      rows: [reservation],
    } = await client.query(
      `insert into public.reservations (user_id, store_id, used_device_unit_id, price_locked) values ($1, $2, $3, $4) returning id`,
      [BUYER1, STORE, device.id, device.price],
    );

    // Backdating expires_at requires privilege (service-role/admin) — the
    // same reason a buyer/seller can never do this themselves.
    await actAs(client, ADMIN);
    await client.query("update public.reservations set expires_at = now() - interval '1 hour' where id = $1", [reservation.id]);

    const { rows: expireRows } = await client.query("select public.expire_stale_reservations() as n");
    expect(expireRows[0].n).toBeGreaterThanOrEqual(1);

    const {
      rows: [{ status }],
    } = await client.query("select status from public.reservations where id = $1", [reservation.id]);
    expect(status).toBe("expired");

    await actAs(client, BUYER1);
    await expectRejected(client, () => client.query("select public.expire_stale_reservations()"), /ruxsat etilmagan/);
  });
});
