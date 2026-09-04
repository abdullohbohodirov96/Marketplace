"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        scrolled ? "border-b border-white/10 bg-[#0a0b18]/80 backdrop-blur-lg" : "bg-transparent"
      }`}
    >
      <div className="container flex h-16 items-center gap-4 sm:h-20">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight text-white sm:text-xl">
          Malika<span className="text-primary-400">Market</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {[
            { href: "#features", label: "Imkoniyatlar" },
            { href: "#benefits", label: "Nega biz" },
            { href: "/categories", label: "Kategoriyalar" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button variant="ghost" size="sm" asChild className="text-white/80 hover:bg-white/10 hover:text-white">
            <Link href="/login">Kirish</Link>
          </Button>
          <Button size="sm" asChild className="bg-white text-[#0a0b18] hover:bg-white/90">
            <Link href="/register?role=seller">Sotuvchi bo&rsquo;lish</Link>
          </Button>
        </div>
      </div>
    </motion.header>
  );
}
