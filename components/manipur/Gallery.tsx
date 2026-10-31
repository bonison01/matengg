// components/manipur/Gallery.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
  credit?: string;
};

export default function Gallery({ items }: { items: GalleryItem[] }) {
  const [failed, setFailed] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<number | null>(null);

  const markFailed = useCallback((src: string) => {
    setFailed((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));
  }, []);

  const visible = items.filter((i) => !failed.has(i.src));

  const step = useCallback(
    (d: number) =>
      setOpen((o) => (o === null ? o : (o + d + visible.length) % visible.length)),
    [visible.length]
  );

  // Keyboard: Esc closes, arrows move; lock page scroll while open.
  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, step]);

  if (visible.length === 0) {
    if (process.env.NODE_ENV === "production") return null;
    return (
      <p className="rounded-2xl border border-dashed border-ink/20 p-8 text-sm text-ink/60">
        No photos found yet. Add images to <code>public/manipur/</code> using the
        file names listed in <code>page.tsx</code> and this gallery will fill in.
      </p>
    );
  }

  const current = open !== null ? visible[open] : null;

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {visible.map((it, idx) => (
          <button
            key={it.src}
            onClick={() => setOpen(idx)}
            className="group relative mb-4 block w-full break-inside-avoid overflow-hidden rounded-2xl bg-ink/5 text-left"
            aria-label={`Open photo: ${it.alt}`}
          >
            <img
              ref={(el) => {
                if (el && el.complete && el.naturalWidth === 0) {
                  queueMicrotask(() => markFailed(it.src));
                }
              }}
              src={it.src}
              alt={it.alt}
              loading="lazy"
              onError={() => markFailed(it.src)}
              className="h-auto w-full transition-transform duration-500 group-hover:scale-105"
            />
            <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-black/75 to-transparent p-4 text-sm text-white transition-transform duration-300 group-hover:translate-y-0">
              {it.caption}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {current && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            className="fixed inset-0 z-[20000] flex flex-col items-center justify-center bg-black/90 p-4"
            role="dialog"
            aria-modal="true"
            aria-label={current.alt}
          >
            <motion.img
              key={current.src}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              src={current.src}
              alt={current.alt}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[78vh] max-w-full rounded-lg object-contain"
            />
            <p className="mt-4 max-w-prose text-center text-sm text-white/85">
              {current.caption}
              {current.credit && (
                <span className="block text-xs text-white/50">{current.credit}</span>
              )}
            </p>

            <button
              onClick={(e) => { e.stopPropagation(); step(-1); }}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-white/10 text-white transition hover:bg-white/25"
            >
              &larr;
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); step(1); }}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full bg-white/10 text-white transition hover:bg-white/25"
            >
              &rarr;
            </button>
            <button
              onClick={() => setOpen(null)}
              aria-label="Close"
              className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/10 text-xl text-white transition hover:bg-white/25"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}