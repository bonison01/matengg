//components/manipur/CountUp.tsx
"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useParallax } from "@/lib/useParallax";

export default function ParallaxLayer({
  children,
  distance = 50,
  className = "",
}: {
  children: ReactNode;
  distance?: number;
  className?: string;
}) {
  const { ref, y } = useParallax(distance);
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
