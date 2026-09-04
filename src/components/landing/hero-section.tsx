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

      <div className="container relative grid items-center gap-10 pb-16 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-6 lg:pb-24 lg:pt-16">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white/70 backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Endi onlaynda — yuzlab sotuvchi, bitta platforma
          </motion.span>

          <motion.h1
            variants={container}
            initial="hidden"
            animate="show"
            className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]"
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
            className="mt-5 max-w-md text-base text-white/60 sm:text-lg"
          >
            Narxlarni solishtiring, eng ishonchli sotuvchini toping va bir necha soniyada
            buyurtma bering — hammasi bitta zamonaviy platformada.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65 }}
            className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row lg:w-auto"
          >
            <Button
              size="lg"
              asChild
              className="flex-1 bg-white text-[#0a0b18] shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_20px_40px_-15px_rgba(255,255,255,0.3)] hover:bg-white/90 sm:flex-none"
            >
              <Link href="/search">
                Mahsulot qidirish <ArrowRight />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="flex-1 border-white/15 bg-white/5 text-white backdrop-blur hover:bg-white/10 hover:text-white sm:flex-none"
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
            className="mt-10 flex items-center gap-6 text-white/40"
          >
            <p className="text-xs">
              <span className="text-lg font-bold text-white">500+</span> sotuvchi
            </p>
            <span className="h-8 w-px bg-white/10" />
            <p className="text-xs">
              <span className="text-lg font-bold text-white">10 000+</span> mahsulot
            </p>
            <span className="h-8 w-px bg-white/10" />
            <p className="text-xs">
              <span className="text-lg font-bold text-white">4.8</span> reyting
            </p>
          </motion.div>
        </div>

        <PhoneMockup />
      </div>
    </section>
  );
}
