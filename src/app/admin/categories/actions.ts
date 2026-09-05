"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/slugify";

export interface CategoryActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

/**
 * Only public.is_admin() may insert/update/delete categories (see
 * categories_admin_write/update/delete in 0018_row_level_security.sql —
 * deliberately admin-only, not moderator) — RLS is the real enforcement
 * here, this action just turns a rejected write into a clear Uzbek message
 * instead of a raw Postgres error.
 */
export async function createCategoryAction(_prevState: CategoryActionState, formData: FormData): Promise<CategoryActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Avval tizimga kiring" };

  const nameUz = String(formData.get("name_uz") ?? "").trim();
  const nameRu = String(formData.get("name_ru") ?? "").trim();
  const parentId = String(formData.get("parent_id") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim();
  const sortOrderRaw = String(formData.get("sort_order") ?? "0").replace(/[^0-9]/g, "");

  const fieldErrors: Record<string, string[]> = {};
  if (nameUz.length < 2) fieldErrors.name_uz = ["Kategoriya nomini kiriting (kamida 2 ta belgi)"];
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const { error } = await supabase.from("categories").insert({
    name_uz: nameUz,
    name_ru: nameRu || null,
    slug: slugify(nameUz),
    parent_id: parentId || null,
    icon: icon || null,
    sort_order: sortOrderRaw ? Number(sortOrderRaw) : 0,
  });

  if (error) {
    if (error.code === "23505") {
      return { fieldErrors: { name_uz: ["Shunday nomli (yoki shunga o'xshash slug'li) kategoriya allaqachon bor"] } };
    }
    if (error.code === "42501") {
      return { error: "Bu amal faqat administrator uchun ruxsat etilgan" };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/sell/new");
  return { success: true };
}

export async function toggleCategoryActiveAction(categoryId: string, nextActive: boolean): Promise<void> {
  const supabase = await createClient();
  await supabase.from("categories").update({ is_active: nextActive }).eq("id", categoryId);
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  revalidatePath("/sell/new");
}
