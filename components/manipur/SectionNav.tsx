// components/manipur/SectionNav.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

const links = [
  { href: "#culture", label: "Culture" },
  { href: "#music", label: "Music & dance" },
  { href: "#sports", label: "Sports" },
  { href: "#business", label: "Business" },
  { href: "#people", label: "People" },
  { href: "#places", label: "Places" },
  { href: "#visit", label: "Visit" },
  { href: "#gallery", label: "Gallery" },
  { href: "#achievements", label: "Achievements" },
  { href: "#works", label: "Works" },
  { href: "#community", label: "Community" },
  { href: "#reviews", label: "Reviews" },
];

export default function SectionNav() {
  const [active, setActive] = useState<string>("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 24,
    restDelta: 0.001,
  });

  /* Highlight the section currently in view. */
  useEffect(() => {
    const targets = links
      .map((l) => document.getElementById(l.href.slice(1)))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Keep the active topic visible: slide the nav sideways (only the nav, never the page). */
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";

    // Nothing active yet (top of page): go back to the start.
    if (!active) {
      scroller.scrollTo({ left: 0, behavior });
      return;
    }

    const el = linkRefs.current[active];
    if (!el) return;

    const c = scroller.getBoundingClientRect();
    const l = el.getBoundingClientRect();
    const left = scroller.scrollLeft + (l.left - c.left) - (c.width - l.width) / 2;

    scroller.scrollTo({ left: Math.max(0, left), behavior });
  }, [active]);

  return (
    <nav
      aria-label="Section navigation"
      className="sticky top-[var(--site-nav-h,0px)] z-30 border-b border-ink/10 bg-white/95 backdrop-blur"
    >
      <div className="relative mx-auto max-w-6xl">
        <div
          ref={scrollerRef}
          className="relative flex items-center gap-6 overflow-x-auto px-6 py-3 text-sm [scrollbar-width:none] sm:px-10 [&::-webkit-scrollbar]:hidden"
        >
          <a href="#top" className="shrink-0 font-display text-base italic text-maroon">
            Manipur
          </a>
          <div className="flex shrink-0 gap-1 pr-6">
            {links.map((l) => {
              const isActive = active === l.href;
              return (
                <a
                  key={l.href}
                  href={l.href}
                  ref={(node) => {
                    linkRefs.current[l.href] = node;
                  }}
                  aria-current={isActive ? "true" : undefined}
                  className="relative whitespace-nowrap rounded-full px-3.5 py-1.5 transition-colors"
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-ink"
                    />
                  )}
                  <span
                    className={`relative ${
                      isActive ? "text-white" : "text-ink/60 hover:text-ink"
                    }`}
                  >
                    {l.label}
                  </span>
                </a>
              );
            })}
          </div>
        </div>

        {/* soft edge fade on mobile so it's clear the row keeps going */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white to-transparent sm:hidden" />
      </div>

      <motion.div
        style={{ scaleX: progress }}
        className="h-[2px] w-full origin-left bg-maroon"
      />
    </nav>
  );
}