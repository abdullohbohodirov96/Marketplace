"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhoneMockup } from "@/components/landing/phone-mockup";

const HEADLINE_LINES = ["Malika bozorining", "yangi raqamli yuzi."];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const lineVariant: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-[#0a0b18]">
      {/* animated ambient gradient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-primary-600/25 blur-[140px]"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-32 top-20 h-[460px] w-[460px] rounded-full bg-accent/20 blur-[130px]"
          animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0a0b18] to-transparent" />
      </div>

      <div className="container relative grid items-center gap-8 pb-10 pt-6 sm:gap-10 sm:pb-16 sm:pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6 lg:pb-24 lg:pt-16">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/70 backdrop-blur sm:mb-5 sm:gap-2 sm:px-3.5 sm:py-1.5 sm:text-xs"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Endi onlaynda — yuzlab sotuvchi, bitta platforma
          </motion.span>

          <motion.h1
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-xl text-[2.1rem] font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]"
          >
            {HEADLINE_LINES.map((line) => (
              <motion.span key={line} variants={lineVariant} className="block">
                {line.split(" ").map((word, i) => (
                  <span
                    key={i}
                    className={
                      line === HEADLINE_LINES[1]
                        ? "bg-gradient-to-r from-primary-300 via-primary-400 to-accent bg-clip-text text-transparent"
                        : ""
                    }
                  >
                    {word}{" "}
                  </span>
                ))}
              </motion.span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-4 max-w-md text-sm text-white/60 sm:mt-5 sm:text-lg"
          >
            Narxlarni solishtiring, eng ishonchli sotuvchini toping va bir necha soniyada
            buyurtma bering — hammasi bitta zamonaviy platformada.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="mt-6 flex w-full max-w-md flex-col gap-2.5 sm:mt-8 sm:flex-row sm:gap-3 lg:w-auto"
          >
            <Button
              asChild
              className="h-11 flex-1 bg-white px-5 text-sm text-[#0a0b18] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_20px_40px_-15px_rgba(255,255,255,0.3)] hover:bg-white/90 sm:h-12 sm:flex-none sm:px-6 sm:text-base"
            >
              <Link href="/search">
                Mahsulot qidirish <ArrowRight />
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="h-11 flex-1 border-white/15 bg-white/5 px-5 text-sm text-white backdrop-blur hover:bg-white/10 hover:text-white sm:h-12 sm:flex-none sm:px-6 sm:text-base"
            >
              <Link href="/register?role=seller">
                <PlayCircle />
                Sotuvchi bo&rsquo;lish
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="mt-7 flex items-center gap-4 text-white/40 sm:mt-10 sm:gap-6"
          >
            <p className="text-[11px] sm:text-xs">
              <span className="text-base font-bold text-white sm:text-lg">500+</span> sotuvchi
            </p>
            <span className="h-6 w-px bg-white/10 sm:h-8" />
            <p className="text-[11px] sm:text-xs">
              <span className="text-base font-bold text-white sm:text-lg">10 000+</span> mahsulot
            </p>
            <span className="h-6 w-px bg-white/10 sm:h-8" />
            <p className="text-[11px] sm:text-xs">
              <span className="text-base font-bold text-white sm:text-lg">4.8</span> reyting
            </p>
          </motion.div>
        </div>

        <PhoneMockup />
      </div>
    </section>
  );
}
