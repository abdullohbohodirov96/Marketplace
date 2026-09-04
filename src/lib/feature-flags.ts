import { createClient } from "@/lib/supabase/server";
import type { FeatureFlagKey } from "@/lib/constants/feature-flags";

/**
 * Reads live feature-flag state from the `feature_flags` table (public read,
 * admin-only write — see 0018_row_level_security.sql). Call this in Server
 * Components / Route Handlers before rendering or executing anything behind
 * a flag; never trust a client-passed boolean for the server-side gate.
 */
export async function getFeatureFlags(): Promise<Record<FeatureFlagKey, boolean>> {
  const supabase = await createClient();
  const { data } = await supabase.from("feature_flags").select("key, is_enabled");

  const result = {} as Record<FeatureFlagKey, boolean>;
  for (const row of data ?? []) {
    result[row.key as FeatureFlagKey] = row.is_enabled;
  }
  return result;
}

export async function isFeatureEnabled(key: FeatureFlagKey): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("feature_flags")
    .select("is_enabled")
    .eq("key", key)
    .single();
  return data?.is_enabled ?? false;
}
