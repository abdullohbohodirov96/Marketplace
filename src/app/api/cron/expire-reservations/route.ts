import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Flips stale pending/seller_confirmed reservations (past their expires_at)
 * to 'expired'. Postgres has no "trigger on SELECT", so a lapsed hold can't
 * flip itself the instant it lapses — this route is meant to be hit by a
 * scheduled job every few minutes (Render Cron Job / Vercel Cron / any
 * external scheduler hitting this URL with the CRON_SECRET bearer token).
 *
 * The actual work (and the only place allowed to bypass the normal
 * reservation state machine for this) lives in the
 * expire_stale_reservations() DB function — see
 * supabase/migrations/0029_reservation_state_machine_and_locking.sql.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET sozlanmagan" }, { status: 500 });
  }
  if (authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Ruxsat etilmagan" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("expire_stale_reservations");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expired: data ?? 0 });
}
