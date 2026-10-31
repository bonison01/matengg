// components/manipur/Hero.tsx
"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { LoktakMotif, RidgeMotif, SangaiMotif } from "./Motifs";

const facts = [
  { k: "Capital", v: "Imphal" },
  { k: "Statehood", v: "1972" },
  { k: "Classical dance", v: "Ras Lila" },
];

const headline = ["Manipur,", "the", "jewelled", "land", "of", "the", "hidden", "lake"];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1] as const;

  // pointer position, normalised -1..1 for parallax and in px for the spotlight
  const nx = useMotionValue(0);
  const ny = useMotionValue(0);
  const px = useMotionValue(-400);
  const py = useMotionValue(-400);
  const sx = useSpring(nx, { stiffness: 60, damping: 18 });
  const sy = useSpring(ny, { stiffness: 60, damping: 18 });

  const lakeX = useTransform(sx, [-1, 1], [-26, 26]);
  const lakeY = useTransform(sy, [-1, 1], [-18, 18]);
  const deerX = useTransform(sx, [-1, 1], [20, -20]);
  const deerY = useTransform(sy, [-1, 1], [14, -14]);
  const ridgeX = useTransform(sx, [-1, 1], [-10, 10]);

  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${px}px ${py}px, rgba(139, 30, 45, 0.07), transparent 70%)`;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 80]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  function onMove(e: React.MouseEvent) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    px.set(x);
    py.set(y);
    nx.set((x / r.width) * 2 - 1);
    ny.set((y / r.height) * 2 - 1);
  }

  return (
    <header
      ref={ref}
      onMouseMove={onMove}
      className="relative h-[92vh] min-h-[640px] overflow-hidden bg-white text-ink"
    >
      <motion.div
        aria-hidden
        style={{ backgroundImage: spotlight }}
        className="pointer-events-none absolute inset-0"
      />

      <motion.div
        style={{ x: ridgeX }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-44 w-full"
      >
        <RidgeMotif className="h-full w-full text-maroon/30" />
      </motion.div>

      <motion.div
        style={{ x: lakeX, y: lakeY }}
        className="pointer-events-none absolute -right-20 top-14 h-[26rem] w-[26rem] sm:-right-4 sm:top-10"
      >
        <LoktakMotif className="h-full w-full text-teal/35" />
      </motion.div>

      <motion.div
        style={{ x: deerX, y: deerY }}
        className="pointer-events-none absolute bottom-24 right-[8%] hidden h-56 w-56 lg:block"
      >
        <SangaiMotif className="h-full w-full text-maroon/50" />
      </motion.div>

      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative mx-auto flex max-w-6xl flex-col px-6 pb-28 pt-20 sm:px-10 sm:pt-28"
      >
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 0.1 }}
          className="label inline-flex items-center gap-3 text-maroon"
        >
          <span className="h-px w-10 bg-gold" />
          A state in India&rsquo;s far northeast
        </motion.p>

        <h1 className="mt-6 max-w-3xl font-display text-[3.2rem] leading-[0.98] sm:text-[5.4rem]">
          {headline.map((w, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 0.25 + i * 0.06 }}
              whileHover={{ y: -6 }}
              className="mr-[0.25em] inline-block cursor-default transition-colors duration-200 hover:text-maroon"
            >
              {w}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease, delay: 0.85 }}
          className="mt-8 max-w-prose text-lg leading-relaxed text-ink/70 sm:text-xl"
        >
          Between the Himalayan foothills and the Chindwin basin sits a valley
          ringed by nine hill ranges, home to Meitei, Naga, and Kuki-Zo
          communities whose dance, sport, and craft have travelled far past its
          borders &ndash; from the origins of polo to an Olympic boxing
          champion.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 1.05 }}
          className="mt-12 flex flex-wrap gap-3"
        >
          {facts.map((f) => (
            <motion.div
              key={f.k}
              whileHover={{ y: -3 }}
              className="group rounded-full border border-ink/15 bg-white px-5 py-2.5 text-sm shadow-sm transition-colors hover:border-maroon hover:bg-maroon hover:text-white"
            >
              <span className="text-ink/50 group-hover:text-white/70">{f.k}</span>
              <span className="mx-2 text-ink/25 group-hover:text-white/40">/</span>
              <span className="font-medium">{f.v}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.a
        href="#culture"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-label="Scroll to content"
      >
        <motion.div
          animate={reduce ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-ink/50"
        >
          <span className="label">Scroll</span>
          <span className="h-8 w-px bg-ink/30" />
        </motion.div>
      </motion.a>
    </header>
  );
}