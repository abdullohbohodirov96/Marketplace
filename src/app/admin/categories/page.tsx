import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CreateCategoryForm } from "@/components/admin/create-category-form";
import { CategoryAdminList, type CategoryTreeNode } from "@/components/admin/category-admin-list";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export const metadata: Metadata = { title: "Kategoriyalar — Admin" };

interface CategoryRow {
  id: string;
  parent_id: string | null;
  name_uz: string;
  name_ru: string | null;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: profile } = await (async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null };
    return supabase.from("profiles").select("role").eq("id", user.id).single();
  })();
  const isAdmin = profile?.role === "admin";

  const [{ data: categories }, { data: catalogProducts }] = await Promise.all([
    supabase
      .from("categories")
      .select("id, parent_id, name_uz, name_ru, slug, icon, sort_order, is_active")
      .order("sort_order", { ascending: true }),
    // A lightweight usage signal per category — "is this category actually
    // used, or just clutter?" — counting distinct catalog products (not
    // every seller offer/unit) keeps this a single cheap query.
    supabase.from("catalog_products").select("category_id").eq("status", "approved"),
  ]);

  const productCountByCategory = new Map<string, number>();
  for (const p of catalogProducts ?? []) {
    productCountByCategory.set(p.category_id, (productCountByCategory.get(p.category_id) ?? 0) + 1);
  }

  const rows: CategoryTreeNode[] = ((categories ?? []) as CategoryRow[]).map((c) => ({
    ...c,
    productCount: productCountByCategory.get(c.id) ?? 0,
  }));
  const topLevel = rows.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, CategoryTreeNode[]>();
  for (const c of rows) {
    if (!c.parent_id) continue;
    const list = childrenByParent.get(c.parent_id) ?? [];
    list.push(c);
    childrenByParent.set(c.parent_id, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Kategoriyalar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Marketplace bo&rsquo;ylab ko&rsquo;rinadigan kategoriyalarni shu yerdan boshqaring — qalam
          belgisi orqali tahrirlang, ikonkani rasm sifatida tanlang.
        </p>
      </div>

      {!isAdmin && (
        <p className="rounded-lg bg-warning/10 px-3.5 py-2.5 text-sm text-warning-foreground">
          Kategoriyalarni faqat administrator qo&rsquo;sha/o&rsquo;zgartira oladi — moderator sifatida
          faqat ko&rsquo;rishingiz mumkin.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Yangi kategoriya</CardTitle>
          <CardDescription>Asosiy yoki mavjud kategoriya ostida quyi kategoriya qo&rsquo;shing.</CardDescription>
        </CardHeader>
        <CardContent>{isAdmin ? <CreateCategoryForm parents={topLevel} /> : null}</CardContent>
      </Card>

      <CategoryAdminList topLevel={topLevel} childrenByParent={childrenByParent} isAdmin={isAdmin} />
    </div>
  );
}
