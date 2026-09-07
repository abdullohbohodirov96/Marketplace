import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Foydalanish shartlari" };

export default function TermsPage() {
  return (
    <LegalPage
      icon={FileText}
      title="Foydalanish shartlari"
      updatedAt="2026-yil sentyabr"
      intro={
        <p>
          Telefy&rsquo;dan foydalanish orqali quyidagi shartlarga rozilik bildirasiz. Savol
          tug&rsquo;ilsa, hisobingiz sozlamalaridan bog&rsquo;lanishingiz mumkin.
        </p>
      }
      sections={[
        {
          heading: "Telefy nima, nima emas",
          body: (
            <p>
              Telefy — Malika bozori sotuvchilarining e&rsquo;lonlarini ko&rsquo;rsatuvchi vitrina
              platforma. Savdoning o&rsquo;zi (to&rsquo;lov, kafolat, yetkazib berish) xaridor bilan
              sotuvchi o&rsquo;rtasida, bozorning o&rsquo;zida amalga oshadi. Telefy savdoga taraf emas
              va tovar sifati yoki bitim yuzasidan moliyaviy javobgarlikni o&rsquo;z zimmasiga olmaydi.
            </p>
          ),
        },
        {
          heading: "Sotuvchining javobgarligi",
          body: (
            <ul className="list-disc space-y-1.5 pl-5">
              <li>Kiritilgan narx, holat va rasmlar haqiqiy tovarga mos bo&rsquo;lishi kerak.</li>
              <li>Ishlatilgan telefon uchun kiritilgan IMEI, batareya holati va boshqa texnik ma&rsquo;lumotlar sotuvchi tomonidan o&rsquo;zi kiritiladi va o&rsquo;zi javobgar bo&rsquo;ladi — bu ma&rsquo;lumotlar platforma tomonidan mustaqil tekshirilmagan bo&rsquo;lishi mumkin, faqat &ldquo;Telefy Check&rdquo; belgisi qo&rsquo;yilgan e&rsquo;lonlar moderator tomonidan tasdiqlangan.</li>
              <li>O&rsquo;g&rsquo;irlangan yoki qonuniy egalik huquqi bo&rsquo;lmagan tovar joylashtirish qat&rsquo;iyan taqiqlanadi.</li>
              <li>Boshqa brendning nomi yoki logotipidan o&rsquo;zini shu brend vakili qilib ko&rsquo;rsatish uchun foydalanish taqiqlanadi.</li>
            </ul>
          ),
        },
        {
          heading: "Moderatsiya va e'lon holati",
          body: (
            <p>
              Har bir yangi do&rsquo;kon va har bir yangi e&rsquo;lon platforma ma&rsquo;muriyati
              tomonidan ko&rsquo;rib chiqilgach hammaga ko&rsquo;rina boshlaydi (&ldquo;Kutilmoqda&rdquo;
              holati). Qoidabuzarlik aniqlansa, e&rsquo;lon yoki do&rsquo;kon sababi ko&rsquo;rsatilgan
              holda rad etilishi mumkin — sabab sotuvchining o&rsquo;z paneliga chiqadi.
            </p>
          ),
        },
        {
          heading: "Hisobni to'xtatish",
          body: (
            <p>
              Ushbu shartlar buzilsa, platforma ma&rsquo;muriyati tegishli e&rsquo;lonni, do&rsquo;konni
              yoki foydalanuvchi hisobini vaqtincha yoki butunlay to&rsquo;xtatishga (bloklashga) haqli.
              Bloklangan hisob tizimga kira olmaydi va yangi do&rsquo;kon yoki e&rsquo;lon qo&rsquo;sha
              olmaydi.
            </p>
          ),
        },
        {
          heading: "Band qilish (rezervatsiya)",
          body: (
            <p>
              Xaridor telefonni sotib olishdan oldin do&rsquo;konga borib ko&rsquo;rish uchun uni
              vaqtincha band qilishi mumkin. Band qilish xarid majburiyatini bildirmaydi — sotuvchi
              va xaridor tovarni bozorda ko&rsquo;rishgach, savdo davom etadimi yo&rsquo;qmi, o&rsquo;zlari
              hal qiladi.
            </p>
          ),
        },
        {
          heading: "Shartlar o'zgarishi",
          body: (
            <p>
              Bu shartlar vaqti-vaqti bilan yangilanishi mumkin. Sezilarli o&rsquo;zgarish bo&rsquo;lsa,
              sahifa yuqorisidagi sana yangilanadi.
            </p>
          ),
        },
      ]}
    />
  );
}
