"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useScroll,
  useReducedMotion,
} from "framer-motion";
import { Search, Heart, TrendingDown } from "lucide-react";

const PARTICLES = [
  { top: "8%", left: "-6%", size: 10, delay: 0, duration: 6 },
  { top: "22%", left: "104%", size: 7, delay: 0.6, duration: 7 },
  { top: "68%", left: "-10%", size: 14, delay: 1.1, duration: 8 },
  { top: "82%", left: "98%", size: 8, delay: 0.3, duration: 6.5 },
  { top: "45%", left: "108%", size: 6, delay: 1.6, duration: 5.5 },
  { top: "4%", left: "60%", size: 9, delay: 0.9, duration: 7.5 },
];

const PRODUCTS = [
  { name: "iPhone 15 Pro 256GB", fill: "fill-indigo-300", price: "12 400 000", oldPrice: "13 500 000", drop: true },
  { name: "Samsung Galaxy S24 Ultra", fill: "fill-amber-300", price: "15 800 000", oldPrice: null, drop: false },
  { name: "Redmi Note 13 Pro", fill: "fill-emerald-300", price: "3 250 000", oldPrice: "3 550 000", drop: true },
  { name: "iPhone 13 128GB", fill: "fill-rose-300", price: "7 100 000", oldPrice: null, drop: false },
];

/**
 * A small, original vector phone silhouette used as the product thumbnail
 * inside the hero mockup's mini feed — not a photo of any real device, just
 * a body + colored screen + notch/home-indicator, so each card reads as "a
 * phone" without reproducing any brand's actual product photography.
 */
function MiniPhoneIcon({ fillClassName, className, uid }: { fillClassName: string; className?: string; uid: string }) {
  const gradId = `phone-sheen-${uid.replace(/[^a-zA-Z0-9-]/g, "")}`;
  return (
    <svg viewBox="0 0 40 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0.35" />
          <stop offset="35%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* body / chassis */}
      <rect x="1" y="1" width="38" height="62" rx="9" className="fill-slate-800" />
      {/* side buttons */}
      <rect x="-0.3" y="14" width="1.3" height="5" rx="0.6" className="fill-slate-700" />
      <rect x="38.9" y="12" width="1.3" height="8" rx="0.6" className="fill-slate-700" />
      {/* screen */}
      <rect x="3.5" y="5.5" width="33" height="53" rx="5.5" className={fillClassName} />
      {/* rear camera module (visible through the screen tint as a design accent) */}
      <rect x="6" y="8" width="9" height="9" rx="3" fill="black" fillOpacity="0.12" />
      <circle cx="10" cy="12" r="1.6" fill="black" fillOpacity="0.22" />
      <circle cx="14" cy="16" r="1.2" fill="black" fillOpacity="0.18" />
      {/* glare */}
      <rect x="3.5" y="5.5" width="33" height="53" rx="5.5" fill={`url(#${gradId})`} />
      {/* front camera notch */}
      <circle cx="20" cy="3.2" r="1.1" className="fill-slate-600" />
      {/* home indicator */}
      <rect x="14.5" y="60" width="11" height="1.6" rx="0.8" className="fill-slate-600" />
    </svg>
  );
}

/**
 * The hero "wow" element: a floating phone frame showing a stylized preview
 * of the Telefy product feed, with an entrance animation (slide +
 * scale + rotate), an ambient glow, floating particles, a pointer-driven
 * tilt, and a continuous 3D rotation tied to scroll position.
 */
export function PhoneMockup() {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 120, damping: 14 });
  const springY = useSpring(rotateY, { stiffness: 120, damping: 14 });
  const glowX = useTransform(springY, [-8, 8], [-40, 40]);
  const glowY = useTransform(springX, [-8, 8], [40, -40]);

  // Scroll-linked 3D spin: as the hero scrolls past, the phone keeps turning
  // in space rather than sitting static.
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end start"],
  });
  const scrollRotateY = useTransform(scrollYProgress, [0, 1], [0, 34]);
  const scrollRotateX = useTransform(scrollYProgress, [0, 1], [0, -10]);
  const scrollY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const springScrollRotateY = useSpring(scrollRotateY, { stiffness: 60, damping: 20 });
  const springScrollRotateX = useSpring(scrollRotateX, { stiffness: 60, damping: 20 });
  const springScrollY = useSpring(scrollY, { stiffness: 60, damping: 20 });

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
      ref={scrollRef}
      className="relative mx-auto flex w-full max-w-[260px] items-center justify-center py-6 [perspective:1200px] sm:max-w-[380px] sm:py-8"
    >
      <div
        ref={ref}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="relative flex w-full items-center justify-center [perspective:1200px]"
      >
        {/* ambient glow */}
        <motion.div
          aria-hidden
          style={{ x: glowX, y: glowY }}
          className="pointer-events-none absolute inset-0 -z-10"
        >
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-500/30 blur-[80px] sm:h-[420px] sm:w-[420px] sm:blur-[90px]" />
          <div className="absolute left-[65%] top-[70%] h-[180px] w-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[70px] sm:h-[260px] sm:w-[260px] sm:blur-[80px]" />
        </motion.div>

        {/* floating particles */}
        {PARTICLES.map((p, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="pointer-events-none absolute hidden rounded-full bg-primary-300/70 shadow-[0_0_12px_2px_rgba(129,140,248,0.55)] sm:block"
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

        {/* idle float — a gentle, continuous bob so the phone is always in
            motion on the page, not just while scrolling or hovering */}
        <motion.div
          animate={reduceMotion ? undefined : { y: [0, -14, 0] }}
          transition={{ duration: 5, delay: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="relative [transform-style:preserve-3d]"
        >
        {/* phone frame — outer layer drives the scroll-linked 3D spin */}
        <motion.div
          style={
            reduceMotion
              ? undefined
              : { rotateY: springScrollRotateY, rotateX: springScrollRotateX, y: springScrollY }
          }
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 70, scale: 0.85, rotate: -8 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, rotate: -3 }}
          transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative [transform-style:preserve-3d]"
        >
          {/* inner layer adds the pointer-driven tilt on top */}
          <motion.div
            style={reduceMotion ? undefined : { rotateX: springX, rotateY: springY }}
            whileHover={reduceMotion ? undefined : { scale: 1.02 }}
            className="relative [transform-style:preserve-3d]"
          >
            <div className="relative h-[440px] w-[220px] rounded-[2.25rem] border-[5px] border-white/10 bg-gradient-to-b from-[#12142a] to-[#0a0b18] p-2 shadow-[0_40px_100px_-20px_rgba(59,79,214,0.55)] ring-1 ring-white/10 sm:h-[620px] sm:w-[310px] sm:rounded-[2.75rem] sm:border-[6px] sm:p-2.5">
              {/* notch */}
              <div className="absolute left-1/2 top-2 z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-[#0a0b18] sm:top-2.5 sm:h-5 sm:w-28" />

              {/* screen */}
              <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-[#f6f7fb] to-white sm:rounded-[2.1rem]">
                {/* status/app bar */}
                <div className="flex items-center justify-between px-3 pb-1.5 pt-4 text-[8px] font-medium text-slate-400 sm:px-4 sm:pb-2 sm:pt-6 sm:text-[10px]">
                  <span>9:41</span>
                  <span className="text-primary-600">Telefy</span>
                </div>

                {/* search pill */}
                <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5 text-slate-400 sm:mx-4 sm:mb-3 sm:gap-2 sm:px-3 sm:py-2">
                  <Search className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="text-[8px] sm:text-[10px]">iPhone 15 Pro qidirish...</span>
                </div>

                {/* category chips */}
                <div className="mb-2 flex gap-1 overflow-hidden px-3 sm:mb-3 sm:gap-1.5 sm:px-4">
                  {["Telefonlar", "Noutbuk", "Aksessuar"].map((c, i) => (
                    <span
                      key={c}
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[7px] font-medium sm:px-2.5 sm:py-1 sm:text-[9px] ${
                        i === 0 ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {/* product grid */}
                <div className="grid grid-cols-2 gap-1.5 px-3 sm:gap-2 sm:px-4">
                  {PRODUCTS.map((card) => (
                    <div key={card.name} className="rounded-lg bg-white p-1.5 shadow-sm ring-1 ring-slate-100 sm:rounded-xl sm:p-2">
                      <div className="relative flex h-11 w-full items-center justify-center rounded-md bg-slate-50 sm:h-16 sm:rounded-lg">
                        <MiniPhoneIcon fillClassName={card.fill} uid={card.name} className="h-9 w-auto drop-shadow-sm sm:h-14" />
                        <Heart className="absolute right-1 top-1 h-2.5 w-2.5 text-slate-300 sm:right-1.5 sm:top-1.5 sm:h-3 sm:w-3" />
                        {card.drop && (
                          <span className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-success px-1 py-0.5 text-[6px] font-semibold text-success-foreground sm:bottom-1.5 sm:left-1.5 sm:text-[7px]">
                            <TrendingDown className="h-1.5 w-1.5 sm:h-2 sm:w-2" />
                            -8%
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-[6.5px] font-medium text-slate-500 sm:text-[8px]">{card.name}</p>
                      <p className="mt-0.5 flex items-baseline gap-1 text-[7.5px] font-semibold text-slate-700 sm:text-[9px]">
                        {card.price}
                        {card.oldPrice && (
                          <span className="text-[6px] font-normal text-slate-300 line-through sm:text-[7px]">
                            {card.oldPrice}
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
