import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CreateCategoryForm } from "@/components/admin/create-category-form";
import { toggleCategoryActiveAction } from "@/app/admin/categories/actions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  const { data: categories } = await supabase
    .from("categories")
    .select("id, parent_id, name_uz, name_ru, slug, icon, sort_order, is_active")
    .order("sort_order", { ascending: true });

  const rows = (categories ?? []) as CategoryRow[];
  const topLevel = rows.filter((c) => !c.parent_id);
  const childrenByParent = new Map<string, CategoryRow[]>();
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
          Marketplace bo&rsquo;ylab ko&rsquo;rinadigan kategoriyalarni shu yerdan boshqaring.
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

      <div className="flex flex-col gap-2.5">
        {topLevel.map((cat) => (
          <div key={cat.id} className="flex flex-col gap-2">
            <CategoryRowItem category={cat} isAdmin={isAdmin} />
            {(childrenByParent.get(cat.id) ?? []).map((child) => (
              <div key={child.id} className="ml-6">
                <CategoryRowItem category={child} isAdmin={isAdmin} />
              </div>
            ))}
          </div>
        ))}
        {topLevel.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Hali kategoriya yo&rsquo;q.
          </p>
        )}
      </div>
    </div>
  );
}

function CategoryRowItem({ category, isAdmin }: { category: CategoryRow; isAdmin: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
        <Tag className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{category.name_uz}</p>
        <p className="truncate text-xs text-muted-foreground">
          /{category.slug} {category.name_ru && `· ${category.name_ru}`}
        </p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-medium ${
          category.is_active ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground"
        }`}
      >
        {category.is_active ? "Faol" : "O'chirilgan"}
      </span>
      {isAdmin && (
        <form action={toggleCategoryActiveAction.bind(null, category.id, !category.is_active)}>
          <Button type="submit" size="sm" variant="outline">
            {category.is_active ? "O'chirish" : "Yoqish"}
          </Button>
        </form>
      )}
    </div>
  );
}
