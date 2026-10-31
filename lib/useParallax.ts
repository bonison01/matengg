"use client";

import { useRef } from "react";
import { useScroll, useTransform, useReducedMotion } from "framer-motion";

/**
 * Ties a vertical offset to how far its element has travelled through the
 * viewport, so the wrapped layer drifts at a different speed than the
 * page's normal scroll. Distance is in pixels, end to end. Disabled
 * automatically when the visitor has requested reduced motion.
 */
export function useParallax(distance: number = 60) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [-distance, distance]
  );
  return { ref, y };
}
