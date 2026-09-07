-- ============================================================================
-- Telefy — 0035: Standard category taxonomy for a phone/electronics bazaar
--
-- 0022/0030 seeded a first pass (Telefonlar + phone brands, Noutbuklar,
-- Quloqchinlar, Kompyuter va aksessuarlar, Smart soatlar, Kameralar) but a
-- few categories every Malika-bozor-style electronics marketplace needs were
-- still missing entirely — most notably a dedicated "Aksessuarlar" bucket
-- (cases, chargers, cables, power banks — a huge share of real listings at
-- the bazaar) and "Planshetlar" (tablets, currently homeless under
-- Telefonlar). Also adds laptop-brand subcategories to match the existing
-- phone-brand pattern, and an "Ehtiyot qismlar" (spare parts) bucket for
-- repair-shop sellers. Idempotent: safe to run more than once.
-- ============================================================================

-- --- New top-level categories -----------------------------------------------
insert into public.categories (name_uz, name_ru, slug, icon, sort_order, is_active)
values
  ('Planshetlar', 'Планшеты', 'planshetlar', 'tablet', 7, true),
  ('Aksessuarlar', 'Аксессуары', 'aksessuarlar', 'cable', 8, true),
  ('Ehtiyot qismlar', 'Запчасти', 'ehtiyot-qismlar', 'package', 9, true),
  ('O''yin konsollari', 'Игровые приставки', 'oyin-konsollari', 'gamepad-2', 10, true)
on conflict (slug) do nothing;

-- --- Aksessuarlar subcategories ----------------------------------------------
insert into public.categories (parent_id, name_uz, name_ru, slug, icon, sort_order, is_active)
select id, v.name_uz, v.name_ru, v.slug, v.icon, v.sort_order, true
from public.categories parent
cross join (
  values
    ('Telefon g''ilofi', 'Чехлы для телефона', 'telefon-gilofi', 'package', 1),
    ('Ekran himoya oynasi', 'Защитное стекло', 'ekran-himoya-oynasi', 'package', 2),
    ('Zaryad qurilmalari', 'Зарядные устройства', 'zaryad-qurilmalari', 'battery-charging', 3),
    ('Simsiz zaryadlovchi', 'Беспроводная зарядка', 'simsiz-zaryadlovchi', 'battery-charging', 4),
    ('Kabellar', 'Кабели', 'kabellar', 'cable', 5),
    ('Quvvat banki', 'Повербанки', 'quvvat-banki', 'battery-charging', 6),
    ('Boshqa aksessuarlar', 'Другие аксессуары', 'boshqa-aksessuarlar', 'package', 7)
) as v(name_uz, name_ru, slug, icon, sort_order)
where parent.slug = 'aksessuarlar'
on conflict (slug) do nothing;

-- --- Ehtiyot qismlar subcategories --------------------------------------------
insert into public.categories (parent_id, name_uz, name_ru, slug, icon, sort_order, is_active)
select id, v.name_uz, v.name_ru, v.slug, v.icon, v.sort_order, true
from public.categories parent
cross join (
  values
    ('Displeylar', 'Дисплеи', 'displeylar', 'package', 1),
    ('Batareyalar', 'Батареи', 'batareyalar', 'battery-charging', 2),
    ('Boshqa ehtiyot qismlar', 'Другие запчасти', 'boshqa-ehtiyot-qismlar', 'package', 3)
) as v(name_uz, name_ru, slug, icon, sort_order)
where parent.slug = 'ehtiyot-qismlar'
on conflict (slug) do nothing;

-- --- Noutbuk brand subcategories (mirrors 0030's phone-brand pattern) --------
insert into public.categories (parent_id, name_uz, name_ru, slug, sort_order, is_active)
select id, v.name_uz, v.name_ru, v.slug, v.sort_order, true
from public.categories parent
cross join (
  values
    ('Apple (MacBook)', 'Apple (MacBook)', 'macbook', 1),
    ('Asus', 'Asus', 'asus', 2),
    ('Lenovo', 'Lenovo', 'lenovo', 3),
    ('HP', 'HP', 'hp', 4),
    ('Dell', 'Dell', 'dell', 5),
    ('Acer', 'Acer', 'acer', 6),
    ('Boshqa brendlar', 'Другие бренды', 'boshqa-noutbuk-brendlari', 7)
) as v(name_uz, name_ru, slug, sort_order)
where parent.slug = 'noutbuklar'
on conflict (slug) do nothing;
