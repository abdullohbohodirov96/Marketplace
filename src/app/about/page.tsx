import type { Metadata } from "next";
import { Info } from "lucide-react";
import { LegalPage } from "@/components/layout/legal-page";

export const metadata: Metadata = { title: "Biz haqimizda" };

export default function AboutPage() {
  return (
    <LegalPage
      icon={Info}
      title="Biz haqimizda"
      updatedAt="2026-yil sentyabr"
      intro={
        <p>
          Telefy — Toshkentdagi Malika elektronika bozori sotuvchilari uchun yaratilgan onlayn
          vitrina. Bozorga bormasdan turib, qaysi do&rsquo;konda qanday telefon, qanday narxda
          borligini oldindan solishtirib ko&rsquo;rish — shu orqali xaridor vaqtini tejash va
          sotuvchiga ko&rsquo;proq mijoz olib kelish maqsadida qurilgan.
        </p>
      }
      sections={[
        {
          heading: "Qanday ishlaydi",
          body: (
            <p>
              Malika bozoridagi do&rsquo;kon egasi ro&rsquo;yxatdan o&rsquo;tib o&rsquo;z
              do&rsquo;konini va sotayotgan telefonlarini (yangi yoki ishlatilgan) qo&rsquo;shadi.
              Xaridor esa saytda yoki xaritada kerakli modelni qidiradi, narxlarni solishtiradi va
              yoqqan telefonni bozordagi aniq do&rsquo;konga borib ko&rsquo;rib chiqadi. Telefy
              savdoning o&rsquo;ziga aralashmaydi — pul o&rsquo;tkazish, kafolat va yetkazib berish
              kabi masalalar to&rsquo;g&rsquo;ridan-to&rsquo;g&rsquo;ri xaridor bilan sotuvchi
              o&rsquo;rtasida, bozorning o&rsquo;zida hal qilinadi.
            </p>
          ),
        },
        {
          heading: "Nega bunday platforma kerak",
          body: (
            <p>
              Malika kabi katta bozorda yuzlab do&rsquo;kon bor va bitta modelni izlab hammasini
              aylanib chiqish vaqt oladi. Telefy shu izlashni oldindan, uydan turib qilish imkonini
              beradi — qaysi qavat, qaysi qator, qaysi do&rsquo;konda borligigacha.
            </p>
          ),
        },
        {
          heading: "E'lonlar qanday tekshiriladi",
          body: (
            <p>
              Har bir yangi do&rsquo;kon va har bir yangi e&rsquo;lon saytda ko&rsquo;rinishidan
              oldin qisqacha ko&rsquo;rib chiqiladi. Bu haqda batafsil{" "}
              <a href="/terms" className="font-medium text-primary hover:underline">
                foydalanish shartlari
              </a>{" "}
              sahifasida yozilgan.
            </p>
          ),
        },
      ]}
    />
  );
}
