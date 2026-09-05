import { createHmac } from "node:crypto";

/**
 * IMEI handling — the raw IMEI must never be stored in plain text or shown
 * publicly (see the 0028 migration's used_device_units_imei_hash_unique_idx
 * and the security review that requested this). Only two derived values
 * ever reach the database:
 *
 *  - imei_hash: an HMAC-SHA256 of the raw IMEI, keyed with a server-only
 *    secret (IMEI_HASH_SECRET). This is a one-way HASH, not encryption —
 *    it can never be turned back into the original IMEI, which is exactly
 *    why it's safe to store. It lets us detect "this exact physical phone
 *    is already listed" without ever persisting the IMEI itself, and
 *    without a plain sha256 that anyone with a list of candidate IMEIs
 *    could brute-force offline (HMAC's secret key defeats that).
 *  - imei_last_digits: the last 4 digits only, purely cosmetic ("IMEI
 *    ...1234") — never enough on its own to identify a specific device.
 *
 * The raw IMEI passed into hashImei() must never be logged, returned to
 * the client, or written to any column other than through this function.
 */

const IMEI_RE = /^\d{15}$/;

/**
 * Standard IMEI check: 15 digits, and the 15th must be the Luhn check
 * digit computed over the first 14 (TAC + serial number). Rejects
 * obviously-fabricated numbers (random 15-digit strings) up front, before
 * they ever reach hashImei()/the uniqueness index.
 */
function luhnCheckDigit(prefix14: string): number {
  let sum = 0;
  for (let i = 0; i < prefix14.length; i++) {
    let digit = Number(prefix14[i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return (10 - (sum % 10)) % 10;
}

export function isValidImei(raw: string): boolean {
  if (!IMEI_RE.test(raw)) return false;
  return luhnCheckDigit(raw.slice(0, 14)) === Number(raw[14]);
}

export function imeiLastDigits(raw: string): string {
  return raw.slice(-4);
}

export function hashImei(raw: string): string {
  const secret = process.env.IMEI_HASH_SECRET;
  if (!secret) {
    // Fail loudly rather than silently hashing with a guessable/empty key —
    // an IMEI "hash" without a real secret is not a security boundary.
    throw new Error("IMEI_HASH_SECRET sozlanmagan (.env.local ga qo'shing)");
  }
  return createHmac("sha256", secret).update(raw).digest("hex");
}
