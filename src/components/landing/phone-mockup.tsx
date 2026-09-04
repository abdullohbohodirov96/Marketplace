"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { Search, Heart, MapPin, Star, TrendingDown } from "lucide-react";

const PARTICLES = [
  { top: "8%", left: "-6%", size: 10, delay: 0, duration: 6 },
  { top: "22%", left: "104%", size: 7, delay: 0.6, duration: 7 },
  { top: "68%", left: "-10%", size: 14, delay: 1.1, duration: 8 },
  { top: "82%", left: "98%", size: 8, delay: 0.3, duration: 6.5 },
  { top: "45%", left: "108%", size: 6, delay: 1.6, duration: 5.5 },
  { top: "4%", left: "60%", size: 9, delay: 0.9, duration: 7.5 },
];

/**
 * The hero "wow" element: a floating phone frame showing a stylized preview
 * of the Malika Market product feed, with an entrance animation (slide +
 * scale + rotate), an ambient glow, floating particles, and a subtle
 * pointer-driven tilt on desktop.
 */
export function PhoneMockup() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 120, damping: 14 });
  const springY = useSpring(rotateY, { stiffness: 120, damping: 14 });
  const glowX = useTransform(springY, [-8, 8], [-40, 40]);
  const glowY = useTransform(springX, [-8, 8], [40, -40]);

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 16);
    rotateX.set(-py * 16);
  }

  function handlePointerLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative mx-auto flex w-full max-w-[340px] items-center justify-center py-8 [perspective:1200px] sm:max-w-[380px]"
    >
      {/* ambient glow */}
      <motion.div
        aria-hidden
        style={{ x: glowX, y: glowY }}
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/30 blur-[90px]" />
        <div className="absolute left-[65%] top-[70%] h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[80px]" />
      </motion.div>

      {/* floating particles */}
      {PARTICLES.map((p, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-full bg-primary-300/70 shadow-[0_0_12px_2px_rgba(129,140,248,0.55)]"
          style={{ top: p.top, left: p.left, width: p.size, height: p.size }}
          animate={
            reduceMotion
              ? undefined
              : { y: [0, -14, 0], opacity: [0.4, 1, 0.4] }
          }
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* phone frame */}
      <motion.div
        style={reduceMotion ? undefined : { rotateX: springX, rotateY: springY }}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 70, scale: 0.85, rotate: -8 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, rotate: -3 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        whileHover={reduceMotion ? undefined : { rotate: 0, scale: 1.02 }}
        className="relative [transform-style:preserve-3d]"
      >
        <div className="relative h-[560px] w-[280px] rounded-[2.75rem] border-[6px] border-white/10 bg-gradient-to-b from-[#12142a] to-[#0a0b18] p-2.5 shadow-[0_40px_100px_-20px_rgba(59,79,214,0.55)] ring-1 ring-white/10 sm:h-[620px] sm:w-[310px]">
          {/* notch */}
          <div className="absolute left-1/2 top-2.5 z-20 h-5 w-28 -translate-x-1/2 rounded-full bg-[#0a0b18]" />

          {/* screen */}
          <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-gradient-to-b from-[#f6f7fb] to-white">
            {/* status/app bar */}
            <div className="flex items-center justify-between px-4 pb-2 pt-6 text-[10px] font-medium text-slate-400">
              <span>9:41</span>
              <span className="text-primary-600">Malika Market</span>
            </div>

            {/* search pill */}
            <div className="mx-4 mb-3 flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-slate-400">
              <Search className="h-3.5 w-3.5" />
              <span className="text-[10px]">iPhone 15 Pro qidirish...</span>
            </div>

            {/* category chips */}
            <div className="mb-3 flex gap-1.5 overflow-hidden px-4">
              {["Telefonlar", "Noutbuk", "Aksessuar"].map((c, i) => (
                <span
                  key={c}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-medium ${
                    i === 0 ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {c}
                </span>
              ))}
            </div>

            {/* product grid */}
            <div className="grid grid-cols-2 gap-2 px-4">
              {[
                { grad: "from-primary-200 to-primary-100", price: "12 400 000", drop: true },
                { grad: "from-amber-100 to-orange-100", price: "3 250 000", drop: false },
                { grad: "from-emerald-100 to-teal-100", price: "890 000", drop: true },
                { grad: "from-rose-100 to-pink-100", price: "5 100 000", drop: false },
              ].map((card, i) => (
                <div key={i} className="rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-100">
                  <div className={`relative h-16 w-full rounded-lg bg-gradient-to-br ${card.grad}`}>
                    <Heart className="absolute right-1.5 top-1.5 h-3 w-3 text-white drop-shadow" />
                    {card.drop && (
                      <span className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded bg-success px-1 py-0.5 text-[7px] font-semibold text-success-foreground">
                        <TrendingDown className="h-2 w-2" />
                        -8%
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[9px] font-semibold text-slate-700">
                    {card.price} <span className="font-normal text-slate-400">so&apos;m</span>
                  </p>
                  <div className="mt-0.5 flex items-center gap-0.5 text-[8px] text-slate-400">
                    <Star className="h-2 w-2 fill-amber-400 text-amber-400" />
                    4.{8 - i} · <MapPin className="h-2 w-2" /> Malika
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
