-- ============================================================================
-- Telefy — 0022: Seed a starter set of top-level categories
--
-- No earlier migration inserted any rows into public.categories, so a fresh
-- project has none — which meant there was nothing to pick when creating a
-- listing, and nothing to browse. This seeds the categories the landing page
-- already has icons for (see categories-strip.tsx's FALLBACK_ICONS order).
-- Idempotent: safe to run more than once.
-- ============================================================================

insert into public.categories (name_uz, name_ru, slug, sort_order, is_active)
values
  ('Telefonlar', 'Телефоны', 'telefonlar', 1, true),
  ('Noutbuklar', 'Ноутбуки', 'noutbuklar', 2, true),
  ('Quloqchinlar', 'Наушники', 'quloqchinlar', 3, true),
  ('Kompyuter va aksessuarlar', 'Компьютеры и аксессуары', 'kompyuter-aksessuarlari', 4, true),
  ('Smart soatlar', 'Смарт-часы', 'smart-soatlar', 5, true),
  ('Kameralar', 'Камеры', 'kameralar', 6, true)
on conflict (slug) do nothing;
