import { ScrollReveal } from "@/components/landing/scroll-reveal";

const BENEFITS = [
  {
    n: "01",
    title: "Bir joyda — hammasi",
    text: "Malika bozoridagi yuzlab do'kon endi bitta ilovada. Bozor bo'ylab yurishga hojat yo'q.",
  },
  {
    n: "02",
    title: "Shaffof narxlar",
    text: "Har bir mahsulotning narx tarixi saqlanadi — sun'iy tarzda oshirilgan narxlarga aldanmaysiz.",
  },
  {
    n: "03",
    title: "Sotuvchilar uchun ham foydali",
    text: "Do'koningizni bepul ro'yxatdan o'tkazing, mahsulot qo'shing va yangi mijozlarga chiqing.",
  },
  {
    n: "04",
    title: "Doimiy rivojlanish",
    text: "Chat, kredit kalkulyatori, trade-in va boshqa imkoniyatlar muntazam qo'shilib boradi.",
  },
];

export function BenefitsSection() {
  return (
    <section id="benefits" className="relative overflow-hidden bg-[#0d0f22] py-12 sm:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-px w-full -translate-x-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-primary-600/10 blur-[130px]" />
      </div>

      <div className="container relative">
        <ScrollReveal className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-400">Nega biz</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Telefy&rsquo;ni tanlashning sabablari
          </h2>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
          {BENEFITS.map((b, i) => (
            <ScrollReveal key={b.n} delay={0.08 * i} className="h-full">
              <div className="h-full bg-[#0d0f22] p-5 sm:p-9">
                <span className="text-3xl font-bold text-white/10">{b.n}</span>
                <h3 className="mt-3 text-lg font-semibold text-white">{b.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{b.text}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
