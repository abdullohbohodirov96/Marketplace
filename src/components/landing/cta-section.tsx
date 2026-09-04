"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/landing/scroll-reveal";

export function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#0d0f22] py-14 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-primary-500/25 via-accent/15 to-transparent blur-[120px]"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container relative flex flex-col items-center text-center">
        <ScrollReveal>
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Bugundan boshlab, aqlliroq xarid qiling
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-white/50 sm:text-lg">
            Ro&rsquo;yxatdan o&rsquo;tish 1 daqiqa vaqt oladi — mijoz sifatida qidiring yoki sotuvchi sifatida
            do&rsquo;koningizni oching.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-white text-[#0a0b18] shadow-[0_20px_50px_-15px_rgba(255,255,255,0.35)] hover:bg-white/90"
            >
              <Link href="/register">
                Bepul ro&rsquo;yxatdan o&rsquo;tish <ArrowRight />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-white/15 bg-white/5 text-white backdrop-blur hover:bg-white/10 hover:text-white"
            >
              <Link href="/register?role=seller">Sotuvchi bo&rsquo;lish</Link>
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
