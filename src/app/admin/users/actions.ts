"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * profiles.status has supported 'blocked' since 0002/0003, and
 * public.is_account_active() has existed just as long — but until
 * 0031_moderation_hardening.sql wired it into the insert policies, setting
 * status = 'blocked' here changed nothing. Only public.is_admin() may
 * update another profile (profiles_admin_update in
 * 0018_row_level_security.sql), never a moderator.
 */
export async function setUserStatusAction(userId: string, status: "active" | "blocked"): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth — the UI already hides this action on the admin's own
  // row, but never let an admin lock themselves out via a replayed request.
  if (user?.id === userId) return;

  await supabase.from("profiles").update({ status }).eq("id", userId);
  revalidatePath("/admin/users");
}
