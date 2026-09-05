import { createHmac } from "node:crypto";

/**
 * IMEI handling — the raw IMEI must never be stored in plain text or shown
 * publicly (see the 0028 migration's used_device_units_imei_hash_unique_idx
 * and the security review that requested this). Only two derived values
 * ever reach the database:
 *
 *  - imei_hash: an HMAC-SHA256 of the raw IMEI, keyed with a server-only
 *    secret (IMEI_HASH_SECRET). This lets us detect "this exact physical
 *    phone is already listed" without ever persisting the IMEI itself —
 *    and without a plain sha256 that anyone with a list of candidate IMEIs
 *    could brute-force offline.
 *  - imei_last_digits: the last 4 digits only, purely cosmetic ("IMEI
 *    ...1234") — never enough on its own to identify a specific device.
 *
 * The raw IMEI passed into hashImei() must never be logged, returned to
 * the client, or written to any column other than through this function.
 */

const IMEI_DIGITS_RE = /^\d{14,16}$/; // 15 is standard; 14/16 tolerate check-digit variants seen in the wild

export function isValidImei(raw: string): boolean {
  return IMEI_DIGITS_RE.test(raw);
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
