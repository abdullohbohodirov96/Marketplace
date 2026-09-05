-- ============================================================================
-- Telefy — 0030: Seed phone brand subcategories under "Telefonlar"
--
-- Malika bozori asosan telefon sotadi, lekin "Telefonlar" kategoriyasi
-- hozircha bitta yassi bo'lim edi — brendlar bo'yicha filtrlash yoki
-- ko'zdan kechirish imkoni yo'q edi. Bu subcategory'lar 0006dagi
-- parent_id ustuniga tayanadi (categories jadvali o'z-o'ziga bog'langan
-- daraxt). Idempotent: bir necha marta ishga tushirish xavfsiz.
-- ============================================================================

insert into public.categories (parent_id, name_uz, name_ru, slug, sort_order, is_active)
select id, v.name_uz, v.name_ru, v.slug, v.sort_order, true
from public.categories parent
cross join (
  values
    ('iPhone (Apple)', 'iPhone (Apple)', 'iphone', 1),
    ('Samsung', 'Samsung', 'samsung', 2),
    ('Xiaomi', 'Xiaomi', 'xiaomi', 3),
    ('Redmi', 'Redmi', 'redmi', 4),
    ('POCO', 'POCO', 'poco', 5),
    ('realme', 'realme', 'realme', 6),
    ('Honor', 'Honor', 'honor', 7),
    ('Nokia', 'Nokia', 'nokia', 8),
    ('Boshqa brendlar', 'Другие бренды', 'boshqa-telefon-brendlari', 9)
) as v(name_uz, name_ru, slug, sort_order)
where parent.slug = 'telefonlar'
on conflict (slug) do nothing;
