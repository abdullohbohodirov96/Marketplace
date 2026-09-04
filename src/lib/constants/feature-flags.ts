/**
 * Keys must match `feature_flags.key` rows seeded in 0017_admin_platform.sql.
 * Read live values with `getFeatureFlags()` in src/lib/feature-flags.ts —
 * this file only gives callers compile-time safe keys to ask for.
 */
export const FEATURE_FLAG_KEYS = [
  "internal_chat",
  "trade_in_requests",
  "installment_calculator",
  "warranty_documents",
  "price_history",
  "price_alerts",
  "request_for_offer",
  "promo_codes",
  "web_push",
  "seller_verification",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];
