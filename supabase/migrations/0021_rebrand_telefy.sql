-- Telefy — 0021: Rebrand seed data (platform was previously named "Malika
-- Market"; the marketplace still serves the Malika bazaar, only the product
-- brand name changed). Safe to re-run.

update public.platform_settings
set value = '"Telefy"'
where key = 'platform_name' and value = '"Malika Market"';

update public.platform_settings
set value = '"Telefy — Malika bozori onlayn"'
where key = 'seo_default_title' and value = '"Malika Market — Malika bozori onlayn"';
