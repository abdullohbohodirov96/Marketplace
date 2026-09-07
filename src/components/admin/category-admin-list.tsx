"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { toggleCategoryActiveAction } from "@/app/admin/categories/actions";
import { Button } from "@/components/ui/button";
import { EditCategoryForm, type EditableCategory } from "@/components/admin/edit-category-form";
import { ICON_BY_KEY, LEGACY_SLUG_ICON, DEFAULT_CATEGORY_ICON } from "@/lib/marketplace/category-icons";
import { cn } from "@/lib/utils/cn";

export interface CategoryTreeNode extends EditableCategory {
  slug: string;
  is_active: boolean;
  productCount: number;
}

/**
 * Renders the 2-level category tree (top-level + their brand/type
 * subcategories) with an inline edit toggle per row — replaced the old
 * static, non-editable list where the only available action was
 * activate/deactivate.
 */
export function CategoryAdminList({
  topLevel,
  childrenByParent,
  isAdmin,
}: {
  topLevel: CategoryTreeNode[];
  childrenByParent: Map<string, CategoryTreeNode[]>;
  isAdmin: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  // A category's "ustki kategoriya" picker only ever offers other top-level
  // categories — the app treats this as a fixed 2-level tree everywhere
  // (this list, the /sell/new category picker), so letting a subcategory
  // become someone's parent would silently create a 3rd level nothing else
  // knows how to render.
  const parentOptions = topLevel.map((c) => ({ id: c.id, name_uz: c.name_uz }));

  if (topLevel.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Hali kategoriya yo&rsquo;q.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {topLevel.map((cat) => (
        <div key={cat.id} className="flex flex-col gap-2">
          <CategoryRow
            category={cat}
            isAdmin={isAdmin}
            isEditing={editingId === cat.id}
            onEdit={() => setEditingId(cat.id)}
            onCancel={() => setEditingId(null)}
            onSaved={() => setEditingId(null)}
            parents={parentOptions}
          />
          {(childrenByParent.get(cat.id) ?? []).length > 0 && (
            <div className="ml-6 flex flex-col gap-2 border-l-2 border-border pl-4">
              {(childrenByParent.get(cat.id) ?? []).map((child) => (
                <CategoryRow
                  key={child.id}
                  category={child}
                  isAdmin={isAdmin}
                  isEditing={editingId === child.id}
                  onEdit={() => setEditingId(child.id)}
                  onCancel={() => setEditingId(null)}
                  onSaved={() => setEditingId(null)}
                  parents={parentOptions}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CategoryRow({
  category,
  isAdmin,
  isEditing,
  onEdit,
  onCancel,
  onSaved,
  parents,
}: {
  category: CategoryTreeNode;
  isAdmin: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSaved: () => void;
  parents: { id: string; name_uz: string }[];
}) {
  if (isEditing) {
    return <EditCategoryForm category={category} parents={parents} onSaved={onSaved} onCancel={onCancel} />;
  }

  const legacyIconKey = LEGACY_SLUG_ICON[category.slug] ?? "";
  const Icon =
    (category.icon && ICON_BY_KEY[category.icon]) || ICON_BY_KEY[legacyIconKey] || DEFAULT_CATEGORY_ICON;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{category.name_uz}</p>
        <p className="truncate text-xs text-muted-foreground">
          /{category.slug}
          {category.name_ru && ` · ${category.name_ru}`}
          {category.productCount > 0 && ` · ${category.productCount} ta mahsulot turi`}
        </p>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2 py-1 text-[11px] font-medium",
          category.is_active ? "bg-success/10 text-success" : "bg-secondary text-muted-foreground",
        )}
      >
        {category.is_active ? "Faol" : "O'chirilgan"}
      </span>
      {isAdmin && (
        <div className="flex shrink-0 gap-1.5">
          <Button type="button" size="sm" variant="outline" onClick={onEdit} aria-label="Tahrirlash">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <form action={toggleCategoryActiveAction.bind(null, category.id, !category.is_active)}>
            <Button type="submit" size="sm" variant="outline">
              {category.is_active ? "O'chirish" : "Yoqish"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}
