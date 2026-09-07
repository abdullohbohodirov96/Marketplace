import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Maxfiylik siyosati" };

export default function PrivacyPage() {
  return (
    <LegalPage
      icon={ShieldCheck}
      title="Maxfiylik siyosati"
      updatedAt="2026-yil sentyabr"
      intro={
        <p>
          Bu sahifa Telefy foydalanuvchisi sifatida qanday ma&rsquo;lumotlaringiz yig&rsquo;ilishini,
          nima uchun va kim tomonidan ko&rsquo;rilishini oddiy tilda tushuntiradi.
        </p>
      }
      sections={[
        {
          heading: "Qanday ma'lumotlar yig'iladi",
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Ro&rsquo;yxatdan o&rsquo;tishda: ism-familiya, telefon raqami yoki email, parol (shifrlangan holda saqlanadi).</li>
              <li>Sotuvchi sifatida: do&rsquo;kon nomi, manzili (blok/qator/do&rsquo;kon raqami), qo&rsquo;shimcha telefon raqamlari, do&rsquo;kon logotipi va e&rsquo;lon rasmlari.</li>
              <li>Ishlatilgan telefon e&rsquo;lonida IMEI kiritilsa — IMEI&rsquo;ning o&rsquo;zi hech qachon ochiq holda saqlanmaydi. Faqat bir tomonlama shifrlangan kod (hash) va oxirgi 2-4 raqami saqlanadi, shu orqali bitta telefon ikki marta ro&rsquo;yxatga olinishining oldi olinadi.</li>
              <li>Platformadan foydalanish davomida: qaysi do&rsquo;kon yoki e&rsquo;lon ko&rsquo;rilgani kabi statistik hodisalar (sotuvchiga o&rsquo;z do&rsquo;koni qancha marta ko&rsquo;rilganini ko&rsquo;rsatish uchun).</li>
            </ul>
          ),
        },
        {
          heading: "Ma'lumotlaringiz kimga ko'rinadi",
          body: (
            <p>
              Sotuvchi sifatida siz o&rsquo;zingiz kiritgan do&rsquo;kon nomi, manzili va telefon
              raqami — bularning barchasi maqsadli ravishda hammaga ochiq (xaridor sizga
              qo&rsquo;ng&rsquo;iroq qilishi yoki do&rsquo;koningizni topishi uchun). Xaridor sifatida
              esa sizning telefon raqamingiz yoki ismingiz boshqa foydalanuvchilarga
              ko&rsquo;rsatilmaydi — faqat platforma ma&rsquo;muriyatiga va band qilish (rezervatsiya)
              qilgan do&rsquo;konga ko&rsquo;rinadi.
            </p>
          ),
        },
        {
          heading: "Moderatsiya",
          body: (
            <p>
              Yangi do&rsquo;kon va e&rsquo;lonlar hammaga ko&rsquo;rinishidan oldin qisqacha ko&rsquo;rib
              chiqiladi — bu jarayonda kiritilgan ma&rsquo;lumotlar va rasmlar platforma
              ma&rsquo;muriyati (admin/moderator) tomonidan ko&rsquo;riladi.
            </p>
          ),
        },
        {
          heading: "Ma'lumotlar qayerda saqlanadi",
          body: (
            <p>
              Barcha ma&rsquo;lumotlar Supabase infratuzilmasida (bulutli, shifrlangan ma&rsquo;lumotlar
              bazasi va fayl xotirasi) saqlanadi. Parolga hech kim — Telefy jamoasi ham — to&rsquo;g&rsquo;ridan-to&rsquo;g&rsquo;ri
              kira olmaydi, u faqat shifrlangan ko&rsquo;rinishda saqlanadi.
            </p>
          ),
        },
        {
          heading: "Hisobni o'chirish",
          body: (
            <p>
              Hisobingizni istalgan vaqtda o&rsquo;chirishni so&rsquo;rashingiz mumkin — bu so&rsquo;rov
              profil sozlamalaridan yuboriladi. So&rsquo;rovdan so&rsquo;ng hisobingiz va unga bog&rsquo;liq
              shaxsiy ma&rsquo;lumotlar platformadan olib tashlanadi.
            </p>
          ),
        },
        {
          heading: "Cookie va sessiya",
          body: (
            <p>
              Telefy faqat tizimga kirgan holatingizni eslab qolish uchun zarur bo&rsquo;lgan sessiya
              cookie&rsquo;laridan foydalanadi. Reklama maqsadida uchinchi tomon kuzatuv (tracking)
              cookie&rsquo;lari ishlatilmaydi.
            </p>
          ),
        },
        {
          heading: "Siyosat o'zgarishi",
          body: (
            <p>
              Bu sahifa vaqti-vaqti bilan yangilanishi mumkin — sezilarli o&rsquo;zgarish bo&rsquo;lsa,
              sahifa yuqorisidagi sana yangilanadi.
            </p>
          ),
        },
      ]}
    />
  );
}
