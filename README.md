# Telefy

Malika elektronika bozori sotuvchilari uchun marketplace platforma. Next.js (App
Router) + TypeScript (strict) + Tailwind CSS + Supabase (Postgres, Auth,
Storage, Row Level Security).

Bu repo **Stage 1** natijasi: repository arxitekturasi, to'liq database
sxemasi, autentifikatsiya va dizayn tizimi. Mahsulot katalogi, qidiruv,
xarita, chat, admin panel va h.k. keyingi bosqichlarda qo'shiladi — pastdagi
"Roadmap" bo'limiga qarang.

## 1. Talab qilinadigan narsalar

- Node.js 20+
- Bepul [Supabase](https://supabase.com) akkounti (yoki o'z-o'zidan
  joylashtirilgan Supabase/Postgres)
- Bepul [Vercel](https://vercel.com) akkounti (deploy uchun)

## 2. Loyihani ishga tushirish

```bash
npm install
cp .env.example .env.local
# .env.local faylini pastdagi 3-bo'lim bo'yicha to'ldiring
npm run dev
```

Ishlaydigan skriptlar:

| Skript | Vazifasi |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | `supabase/migrations/*.sql` fayllarini ketma-ket qo'llaydi (pastga qarang) |

## 3. Supabase sozlash yo'riqnomasi

1. [supabase.com/dashboard](https://supabase.com/dashboard) da yangi loyiha
   yarating (region: eng yaqinini tanlang, masalan Singapore/Frankfurt).
2. **Project Settings → API** bo'limidan quyidagilarni `.env.local` ga
   ko'chiring:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` kaliti → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` kaliti → `SUPABASE_SERVICE_ROLE_KEY` (**faqat serverda
     ishlatiladi, hech qachon clientga chiqarilmasin**)
3. Migrationlarni qo'llang. Ikki yo'l bor:

   **A) Supabase CLI orqali (tavsiya etiladi):**

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push
   ```

   **B) To'g'ridan-to'g'ri `psql` orqali** (Project Settings → Database →
   Connection string → URI):

   ```bash
   for f in supabase/migrations/*.sql; do
     psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f" || break
   done
   ```

   Migrationlar `supabase/migrations/0001...` dan `0020...` gacha raqamlangan
   va **ketma-ket** qo'llanishi shart (har biri oldingisiga bog'liq).
   Barchasi mahalliy Postgres 16 instansiyasida sinovdan o'tkazilgan —
   xatosiz o'tadi.

4. **Auth sozlamalari** (Authentication → Settings):
   - Email confirmation: yoqilgan bo'lsa, "Confirm email" o'chirib
     qo'yilishi mumkin (dev uchun) yoki SMTP provider ulang (production).
   - Phone (SMS) autentifikatsiya uchun **Auth → Providers → Phone**dan bir
     SMS provider ulang (Twilio, MessageBird va h.k.) — bo'lmasa, telefon
     orqali ro'yxatdan o'tish ishlaydi, lekin SMS OTP (parolni tiklash)
     yubormaydi. Bu O'zbekiston uchun eng ko'p ishlatiladigan yo'l — Twilio
     hisobingizda O'zbekiston raqamlariga SMS yuborish yoqilganini
     tekshiring.
   - **Redirect URLs**ga qo'shing: `http://localhost:3000/auth/callback` va
     production domeningiz (`https://sizning-domen.uz/auth/callback`).
5. **Storage**: bucketlar migration `0020_storage_buckets.sql` orqali
   avtomatik yaratiladi (`avatars`, `product-images`, `store-branding`,
   `banners`, `review-images`, `chat-attachments`,
   `verification-documents`, `warranty-documents`, `import-files`).

## 4. Admin account yaratish

Birinchi Super Admin akkountini yaratish uchun:

1. Odatdagidek `/register` orqali oddiy (customer) akkount oching.
2. Supabase dashboard → **Table Editor → profiles** jadvaliga o'ting, o'sha
   foydalanuvchi qatorini toping va `role` ustunini `admin` ga o'zgartiring.
   (Yoki SQL Editor'da: `update public.profiles set role = 'admin' where
   phone = '+998901234567';`)
3. Keyingi kirishda u admin huquqlariga ega bo'ladi (`/admin` — Stage 8 da
   qo'shiladi).

Bu qo'lda bosqich ataylab shunday — birinchi adminni tizim ichidan
"o'z-o'zini admin qilish" imkoniyati xavfsizlik nuqtai nazaridan yopiq
bo'lishi kerak.

## 5. Vercel'ga deploy qilish yo'riqnomasi

1. Repo'ni GitHub'ga push qiling (pastga qarang).
2. [vercel.com/new](https://vercel.com/new) da repo'ni import qiling.
3. **Environment Variables** bo'limiga `.env.example`dagi barcha
   o'zgaruvchilarni kiriting (Production **va** Preview muhitlari uchun).
4. Build command va output — Next.js uchun standart, hech narsa
   o'zgartirish shart emas.
5. Deploy tugmasini bosing.

## 6. Cron sozlash yo'riqnomasi (Stage 7+)

Bildirishnoma cron endpointlari (`src/app/api/cron/*`, keyingi bosqichda
qo'shiladi) `CRON_SECRET` bilan himoyalanadi — har bir so'rov
`Authorization: Bearer <CRON_SECRET>` headerini talab qiladi.

`vercel.json`ga misol (Stage 7 da qo'shiladi):

```json
{
  "crons": [
    { "path": "/api/cron/notifications", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/offer-staleness", "schedule": "0 3 * * *" }
  ]
}
```

Vercel Cron so'rovlariga `CRON_SECRET`ni avtomatik qo'shadi (Project
Settings → Cron Jobs), qo'lda sozlash shart emas.

## 7. Arxitektura

```
src/
  app/                    App Router sahifalari
    (auth)/               login, register, forgot/reset-password (layout guruhi)
    auth/callback/        Supabase email-link / OTP callback
    account/blocked/      Bloklangan akkount sahifasi
  components/
    ui/                   shadcn uslubidagi asosiy komponentlar
    auth/                 Auth formalar
    layout/                Header, footer, mobil pastki navigatsiya
  lib/
    supabase/             Browser/server/middleware Supabase clientlari
    validations/          Zod sxemalari
    constants/             Rol, feature-flag konstantalari
    rate-limit.ts         Oddiy in-memory rate limiter (prod uchun Redis'ga almashtiriladi)
    feature-flags.ts      `feature_flags` jadvalini o'qish
  i18n/                   uz (asosiy) / ru (tayyor, keyin to'ldiriladi) lug'atlari
  types/database.types.ts Supabase generated types o'rnini bosuvchi qo'lda yozilgan tiplar
supabase/
  migrations/             0001...0020 — to'liq database sxemasi (pastga qarang)
scripts/
  local-supabase-shim.sql Faqat local test uchun (auth/storage sxema stub'lari)
```

### Rol tizimi

Platforma roli (`profiles.role`): `customer` | `seller` | `moderator` |
`admin`. Do'kon darajasidagi rol (`store_members.role`, bitta sotuvchi bir
nechta do'konda turli rolda bo'lishi mumkin): `owner` | `manager` | `staff`.
Har ikkisi ham **server va database darajasida** (RLS orqali) tekshiriladi
— frontendda yashirish bilan cheklanmagan.

### Database sxemasi

63 ta jadval, 128 ta RLS siyosati, 20 ta migration fayli. To'liq ro'yxat va
har bir jadvalning vazifasi `supabase/migrations/*.sql` fayllaridagi
izohlarda. Asosiy bloklar:

- **Identity**: `profiles`, `roles`
- **Stores**: `stores`, `store_members`, `store_locations` (= filiallar),
  `store_schedules`, `store_verifications`
- **Catalog**: `catalog_products` (kanonik mahsulot) + `product_offers`
  (sotuvchi taklifi) — narx solishtirish shu ajratishga asoslanadi;
  `product_aliases`, `product_merge_history`, `branch_inventory`
- **Narx**: `price_history`, `price_alerts`, `availability_confirmations`
- **Mijoz**: `favorites`, `saved_stores`, `product_comparisons`,
  `search_history`, `saved_searches`
- **Izoh/shikoyat**: `reviews`, `review_replies`, `review_votes`,
  `reports`, `disputes`, `dispute_messages`, `sale_outcomes`
- **Bildirishnoma**: `notifications`, `notification_preferences`,
  `notification_delivery_log`
- **Chat**: `conversations`, `messages`, `blocked_users`,
  `store_quick_replies`
- **Topib bering**: `request_for_offers`, `seller_proposals`
- **Import/Export**: `import_jobs`, `import_rows`, `export_jobs`
- **Kommertsiya**: `delivery_options`, `installment_options`,
  `trade_in_requests`, `promotions`, `promo_codes`, `warranty_documents`
  (feature-flagged)
- **Analytics**: `analytics_events` (yagona event stream — o'tgan
  ProductView/StoreView/ContactClick'ni almashtiradi)
- **Admin**: `moderation_logs`, `audit_logs`, `banners`, `feature_flags`,
  `platform_settings`
- **Monetizatsiya**: `plans` (free/standard/pro), `subscriptions`

### Qidiruv

`0019_search.sql` PostgreSQL Full Text Search (`tsvector` + GIN) va
`pg_trgm` (typo-tolerance) asosida ishlaydi — hozircha tashqi xizmatga
muhtoj emas. Kelajakda Meilisearch/Algolia ulash uchun `src/lib/search/`
papkasida `SearchProvider` interfeysi qo'shiladi (Stage 4), shu orqali
almashtirish kod bazasining qolgan qismiga ta'sir qilmaydi.

### Feature flags

`feature_flags` jadvali (0017-migration) katta funksiyalarni admin orqali
yoqib/o'chirish imkonini beradi (ichki chat, trade-in, bo'lib to'lash,
narx tarixi va h.k.). `src/lib/feature-flags.ts` — server-side o'qish
funksiyasi; har doim serverda tekshiring, clientga ishonmang.

## 8. Xavfsizlik

- Barcha jadvallarda RLS yoqilgan va sinovdan o'tkazilgan (owner o'z
  ma'lumotini ko'radi, begona foydalanuvchi ko'rmaydi — mahalliy Postgres
  ustida amaliy tekshirildi).
- Parollar, sessiyalar — to'liq Supabase Auth zimmasida.
- Zod bilan server-side validatsiya (`src/lib/validations/`).
- Rate limiting: login, register, parolni tiklash, izoh, xabar, shikoyat
  uchun (`src/lib/rate-limit.ts` — dev uchun in-memory, production uchun
  Upstash Redis'ga almashtirish tavsiya etiladi, izoh koddagi faylda bor).
- Maxfiy kalitlar faqat environment variables orqali.
- `SUPABASE_SERVICE_ROLE_KEY` faqat server-only fayllarda (`server-only`
  npm paketi bilan himoyalangan — clientga tasodifan import qilinsa build
  xato beradi).

## 9. Test natijalari (Stage 1)

| Tekshiruv | Natija |
| --- | --- |
| `npm run typecheck` | ✅ Xatosiz |
| `npm run lint` | ✅ Xatosiz |
| `npm run build` | ✅ Muvaffaqiyatli (barcha sahifalar generatsiya qilindi) |
| Migrationlar (0001→0020, mahalliy Postgres 16) | ✅ Ketma-ket, xatosiz qo'llandi |
| Trigger sinovi: ro'yxatdan o'tish → profile+preferences avtomatik yaratiladi | ✅ |
| Trigger sinovi: do'kon yaratish → owner a'zoligi + FREE subscription avtomatik | ✅ |
| Trigger sinovi: narx o'zgarishi → `price_history`ga yoziladi | ✅ (1 ta real xato topilib tuzatildi — pastga qarang) |
| Trigger sinovi: `catalog_products.offer_count`/`min_price` avtomatik yangilanishi | ✅ |
| Trigger sinovi: `availability_confirmations` → `last_confirmed_at` sinxronlanishi | ✅ |
| Trigger sinovi: izoh tasdiqlanishi → do'kon reytingi avtomatik hisoblanishi | ✅ |
| RLS sinovi: begona foydalanuvchi boshqa birovning kutilayotgan do'konini/profilini ko'ra olmaydi | ✅ |
| RLS sinovi: egasi o'z ma'lumotini ko'radi | ✅ |
| RLS sinovi: anon faqat tasdiqlangan do'kon/mahsulotni ko'radi | ✅ |
| Full text search (tsvector, lotin/kirill) | ✅ "iphone" so'zi mos mahsulotni topadi |

**Ishlab chiqarish jarayonida topilgan va tuzatilgan xato**: `price_history`
trigger'i dastlab `changed_by` ustuniga (bu `profiles.id`ga bog'langan)
noto'g'ri ravishda do'kon ID'sini yozishga urinardi — bu FK xatosiga va
natijada **har qanday mahsulot taklifini yaratishning butunlay ishlamay
qolishiga** olib kelardi. Mahalliy Postgres'da sinovdan o'tkazish paytida
aniqlanib, darhol tuzatildi (endi `auth.uid()` ishlatiladi, mavjud bo'lmasa
`null`).

## 10. Checklist — nima tayyor

- [x] Repository arxitekturasi (Next.js 16, TS strict, Tailwind, App Router)
- [x] To'liq database sxemasi — asl va kengaytirilgan spetsifikatsiyaning
      barcha modellari (63 jadval)
- [x] Row Level Security — barcha jadvallarda, rolga asoslangan
- [x] Auth: ro'yxatdan o'tish (telefon/email), login, logout, "meni eslab
      qolish" (asosiy), parolni unutdim/tiklash (email link + telefon SMS
      OTP arxitekturasi), parolni o'zgartirish, accountni o'chirish so'rovi,
      rate limiting
- [x] Middleware orqali rol asosida route himoyasi (`/seller`, `/admin`,
      `/account`)
- [x] Dizayn tizimi: ranglar, spacing, tipografiya, dark mode, asosiy UI
      komponentlar, 44px+ touch target, responsive header/footer/mobil nav
- [x] i18n arxitekturasi (uz asosiy, ru tayyor skeleton)
- [x] PWA manifest skeleti (ikonalar to'liq to'plami Stage 9da)
- [x] .env.example, README, Supabase/Vercel/Cron yo'riqnomalari

## 11. Roadmap — keyingi bosqichlar

| Bosqich | Mazmuni |
| --- | --- |
| 2 | Mijoz va sotuvchi kabinetlari, do'kon yaratish/boshqarish UI |
| 3 | Mahsulot CRUD, kategoriya-asosli dinamik xususiyatlar, rasm yuklash/optimizatsiya, mahsulot sahifasi |
| 4 | Aqlli qidiruv UI, filterlar, ranking, tavsiyalar |
| 5 | Izoh/reyting UI, favorite, boshlang'ich analytics dashboard |
| 6 | Xarita (Leaflet + OSM), marker clustering, do'kon popup |
| 7 | Bildirishnoma markazi UI, cron endpointlari, preferences |
| 8 | Admin panel, moderatsiya, audit log UI |
| 9 | SEO (sitemap, schema.org), PWA to'liq, performance, responsive QA |
| 10 | To'liq test suite, README yakuniy holat, deployment |
| 11 | CatalogProduct/ProductOffer UI — narx solishtirish sahifasi |
| 12 | Narx tarixi grafigi, price alert UI |
| 13 | Mavjudlikni tasdiqlash UI, eskirgan takliflar ranking penalty |
| 14 | Excel/CSV import/export UI |
| 15 | "Topib bering" va sotuvchi takliflari UI |
| 16 | Mahsulot taqqoslash, ro'yxatlar (yorliqlar) |
| 17 | Verification UI, trust indicators, lead analytics dashboard |
| 18 | Ichki chat UI (Supabase Realtime), response metrics, block/report |
| 19 | Filiallar UI, filial qoldiqlari, ish vaqti/"hozir ochiq" |
| 20 | Yetkazib berish/trade-in/bo'lib to'lash/aksiya UI |
| 21 | Warranty hujjatlar UI, savdo natijalari, dispute markazi UI |
| 22 | Fraud flag qoidalari, soft-delete/rollback UI, feature flag admin UI |
| 23 | Xavfsizlik auditi, performance, to'liq responsive QA, e2e testlar |

Har bir bosqichdan keyin: typecheck → lint → build → asosiy funksiyalar
sinovi → responsive tekshiruv, so'ng qisqa hisobot.
