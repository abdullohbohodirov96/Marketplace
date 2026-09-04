"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle, Store, TrendingUp, CheckCircle2 } from "lucide-react";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

const SCREENS = [
  {
    icon: Store,
    label: "Do'kon sahifasi",
    accent: "from-primary-500/30 to-primary-500/5",
    rotate: -6,
    x: -40,
    content: (
      <div className="space-y-2">
        <div className="h-16 rounded-lg bg-gradient-to-br from-primary-300/40 to-primary-200/20" />
        <div className="flex items-center gap-1.5 text-white/70">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span className="text-[10px] font-medium">Tasdiqlangan do&rsquo;kon</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 rounded bg-white/10" />
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: TrendingUp,
    label: "Narx solishtirish",
    accent: "from-accent/30 to-accent/5",
    rotate: 0,
    x: 0,
    content: (
      <div className="space-y-2">
        {[
          { s: "Do'kon A", p: "12 400 000", best: true },
          { s: "Do'kon B", p: "12 950 000", best: false },
          { s: "Do'kon C", p: "13 100 000", best: false },
        ].map((row) => (
          <div
            key={row.s}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-[10px] ${
              row.best ? "bg-success/15 text-success" : "bg-white/5 text-white/60"
            }`}
          >
            <span>{row.s}</span>
            <span className="font-semibold">{row.p}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: MessageCircle,
    label: "Sotuvchi bilan chat",
    accent: "from-primary-400/30 to-accent/10",
    rotate: 6,
    x: 40,
    content: (
      <div className="space-y-2">
        <div className="ml-auto w-4/5 rounded-xl rounded-tr-sm bg-primary-500/30 px-3 py-2 text-[10px] text-white">
          Mahsulot omborda bormi?
        </div>
        <div className="w-4/5 rounded-xl rounded-tl-sm bg-white/10 px-3 py-2 text-[10px] text-white/70">
          Ha, bor! 30 daqiqada javob berdi ⚡
        </div>
      </div>
    ),
  },
];

export function ShowcaseSection() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[#0a0b18] py-16 sm:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600/10 blur-[160px]" />
      </div>

      <div className="container relative">
        <ScrollReveal className="mx-auto max-w-xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-400">Ko&rsquo;rinish</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Har bir ekran — sodda va tushunarli
          </h2>
          <p className="mt-3 text-white/50">
            Do&rsquo;kon sahifasidan narx solishtirishgacha, sotuvchi bilan yozishishgacha — bir necha bosishda.
          </p>
        </ScrollReveal>

        <div className="mt-16 flex flex-col items-center gap-6 sm:flex-row sm:items-end sm:justify-center sm:gap-4">
          {SCREENS.map((screen, i) => (
            <motion.div
              key={screen.label}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 60, rotate: 0 }}
              whileInView={
                reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, rotate: screen.rotate }
              }
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              whileHover={reduceMotion ? undefined : { rotate: 0, y: -8, scale: 1.03 }}
              style={{ zIndex: i === 1 ? 10 : 5 }}
              className={`w-[220px] shrink-0 rounded-2xl border border-white/10 bg-gradient-to-b p-4 shadow-2xl backdrop-blur ${screen.accent} ${
                i === 1 ? "sm:w-[240px]" : "sm:mb-6"
              }`}
            >
              <div className="mb-3 flex items-center gap-1.5 text-white/60">
                <screen.icon className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium uppercase tracking-wide">{screen.label}</span>
              </div>
              {screen.content}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
