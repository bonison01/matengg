'use client';

import Image from 'next/image';
import { CalendarDays, Users, Music, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --------------- Event details ---------------
const EVENT_DATE_LABEL = "24 July 2026";

// --------------- Recap copy ---------------
// TODO: swap in your real numbers/copy for how the day actually went.
const RECAP_STATS = [
  { icon: Users, value: "2,000+", label: "Attendees" },
  { icon: Music, value: "12", label: "Performances" },
  { icon: CalendarDays, value: "1", label: "Unforgettable day" },
];

// --------------- Past-event gallery photos ---------------
// Drop your G15 highlight photos into /public/g15-gallery/ named 1.jpg, 2.jpg, etc.
// (or swap these paths for your real filenames)
const GALLERY_IMAGES = [
  '/g15-gallery/1.jpeg',
  '/g15-gallery/2.jpeg',
  '/g15-gallery/3.jpeg',
  '/g15-gallery/4.jpeg',
  '/g15-gallery/5.jpeg',
  '/g15-gallery/6.jpeg',
  '/g15-gallery/7.jpeg',
  '/g15-gallery/8.jpeg',
  '/g15-gallery/9.jpeg',
  '/g15-gallery/10.jpeg',
];

// The hero slideshow uses the first N gallery photos — pick your strongest shots
// by putting them first in GALLERY_IMAGES.
const HERO_SLIDE_COUNT = 5;

// Tiles at these positions span 2 grid rows in the gallery below, for a
// non-uniform, magazine-style layout. Point this at your best landscape shots.
const TALL_TILE_INDICES = new Set([0, 3, 6]);

// --------------- Full-bleed hero slideshow ---------------
function HeroSlideshow({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 4500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [images.length]);

  const goTo = (i: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIndex(i);
    timerRef.current = setInterval(() => {
      setIndex((cur) => (cur + 1) % images.length);
    }, 4500);
  };

  return (
    <div className="relative w-full h-[52vh] sm:h-[62vh] min-h-[320px] overflow-hidden">
      <AnimatePresence mode="sync">
        {images.map((src, i) =>
          i === index ? (
            <motion.div
              key={src}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0"
            >
              <Image
                src={src}
                alt={`G15 Festival highlight ${i + 1}`}
                fill
                priority={i === 0}
                className="object-cover"
                sizes="100vw"
              />
            </motion.div>
          ) : null
        )}
      </AnimatePresence>

      {/* Legibility gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0620] via-black/10 to-black/40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {images.map((_, i) => (
          <button
            key={i}
            aria-label={`Go to photo ${i + 1}`}
            onClick={() => goTo(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === index ? '22px' : '7px',
              background: i === index ? '#3FA637' : 'rgba(255,255,255,0.4)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// --------------- Photo gallery grid with lightbox + thumbnail strip ---------------
function EventGallery({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const showPrev = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length]
  );
  const showNext = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') showPrev();
      if (e.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeIndex, close, showPrev, showNext]);

  return (
    <>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
        style={{ gridAutoRows: '160px' }}
      >
        {images.map((src, i) => {
          const isTall = TALL_TILE_INDICES.has(i);
          return (
            <motion.button
              key={src}
              type="button"
              onClick={() => setActiveIndex(i)}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: (i % 8) * 0.05 }}
              className="relative rounded-xl overflow-hidden group border border-white/10 hover:border-green-400/40 transition-colors"
              style={{ gridRow: isTall ? 'span 2' : 'span 1' }}
            >
              <Image
                src={src}
                alt={`G15 Festival highlight ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/92 backdrop-blur-sm px-4 py-6"
            onClick={close}
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative w-full max-w-4xl flex items-center justify-center flex-1 min-h-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                aria-label="Previous photo"
                className="absolute left-0 sm:-left-4 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="relative w-full h-full max-h-[70vh] aspect-video rounded-xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={images[activeIndex]}
                  alt={`G15 Festival highlight ${activeIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </motion.div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                aria-label="Next photo"
                className="absolute right-0 sm:-right-4 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Thumbnail strip for quick jump */}
            <div
              className="flex items-center gap-2 mt-5 max-w-full overflow-x-auto px-2 py-1"
              style={{ scrollbarWidth: 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActiveIndex(i)}
                  aria-label={`View photo ${i + 1}`}
                  className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-200"
                  style={{
                    outline: i === activeIndex ? '2px solid #3FA637' : '2px solid transparent',
                    opacity: i === activeIndex ? 1 : 0.5,
                  }}
                >
                  <Image src={src} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>

            <span className="mt-2 text-xs text-zinc-400 tabular-nums">
              {activeIndex + 1} / {images.length}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function EventRecapPage() {
  return (
    <div className="relative min-h-screen w-full text-white" style={{ background: '#0b0620' }}>

      {/* PHOTOS FIRST — full-bleed hero slideshow, the first thing visitors see */}
      <HeroSlideshow images={GALLERY_IMAGES.slice(0, HERO_SLIDE_COUNT)} />

      {/* CONTENT */}
      <div className="relative z-10 w-full flex flex-col items-center px-4 pt-10 pb-16 gap-14 -mt-16 sm:-mt-20">

        {/* TITLE */}
        <motion.div
          className="text-center max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 border border-green-500/30 px-3 py-1 text-xs font-medium text-green-300 backdrop-blur-sm mb-4">
            <CalendarDays className="h-3.5 w-3.5" />
            {EVENT_DATE_LABEL}
          </span>

          <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight bg-gradient-to-r from-[#50C273] to-[#E2DE59] bg-clip-text text-transparent drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]">
            G15 Festival 2026
          </h1>
          <p className="mt-3 text-zinc-200 text-base md:text-lg drop-shadow-md">
            That's a wrap. Thank you to everyone who came out and made it
            an unforgettable day.
          </p>
        </motion.div>

        {/* RECAP STATS */}
        <motion.div
          className="w-full max-w-2xl grid grid-cols-3 gap-3 sm:gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {RECAP_STATS.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center text-center rounded-2xl border border-white/10 bg-zinc-950/50 backdrop-blur-xl px-3 py-5"
            >
              <Icon className="h-5 w-5 text-green-300 mb-2" />
              <span className="text-xl sm:text-2xl font-bold tabular-nums">{value}</span>
              <span className="text-xs text-zinc-400 mt-1">{label}</span>
            </div>
          ))}
        </motion.div>

        {/* WHAT HAPPENED */}
        <motion.div
          className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950/50 backdrop-blur-xl px-6 py-6 sm:px-8 sm:py-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <h2 className="text-xl sm:text-2xl font-semibold mb-3">
            What went down
          </h2>
          {/* TODO: replace with your real recap copy */}
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            G15 Festival brought together live music, food stalls, and a
            full day of energy in one place. From the opening set to the
            closing headliner, the crowd kept the vibe going from start to
            finish. Here's a look back at how it all went down — stay
            tuned for the next one.
          </p>
        </motion.div>

        {/* PHOTO GALLERY */}
        <motion.div
          className="w-full max-w-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 border border-green-500/30 px-3 py-1 text-xs font-medium text-green-300 backdrop-blur-sm mb-3">
              Highlights
            </span>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">
              Every moment, all in one place
            </h2>
          </div>
          <EventGallery images={GALLERY_IMAGES} />
        </motion.div>

      </div>
    </div>
  );
}