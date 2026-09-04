import { Scale, ShieldCheck, MapPinned, Zap, BellRing, Heart } from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

const FEATURES = [
  {
    icon: Scale,
    title: "Narxlarni solishtiring",
    text: "Bir xil mahsulotni bir nechta sotuvchida solishtirib, eng yaxshi narxni toping.",
  },
  {
    icon: ShieldCheck,
    title: "Tekshirilgan sotuvchilar",
    text: "Har bir do'kon reyting, sharh va tasdiqlash belgisi bilan — ishonch bilan xarid qiling.",
  },
  {
    icon: MapPinned,
    title: "Xarita orqali toping",
    text: "Malika bozoridagi do'konni interaktiv xaritada aniq joylashuvi bilan ko'ring.",
  },
  {
    icon: Zap,
    title: "Aqlli qidiruv",
    text: "Xato yozuvga chidamli, lotin va kirilda ham bir xil natija beruvchi tezkor qidiruv.",
  },
  {
    icon: BellRing,
    title: "Narx tushishidan xabardor bo'ling",
    text: "Yoqtirgan mahsulotingiz narxi tushganda birinchilardan bo'lib bilib oling.",
  },
  {
    icon: Heart,
    title: "Sevimlilar ro'yxati",
    text: "Mahsulot va do'konlarni saqlab qo'ying, keyinroq bir zumda qaytib toping.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="relative bg-[#0a0b18] py-16 sm:py-24">
      <div className="container">
        <ScrollReveal className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-400">
            Imkoniyatlar
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Xarid qilishning yangi tajribasi
          </h2>
          <p className="mt-3 text-white/50">
            Malika Market — faqat e&rsquo;lonlar taxtasi emas, xarid qilishni osonlashtiruvchi to&rsquo;liq vosita.
          </p>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={0.05 * (i % 3)}>
              <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur transition-colors hover:border-primary-400/30 hover:bg-white/[0.06]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500/20 to-accent/10 text-primary-300 ring-1 ring-white/10 transition-transform group-hover:scale-110">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-white/50">{f.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
