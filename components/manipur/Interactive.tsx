// components/manipur/Interactive.tsx
"use client";

import { ReactNode, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Photo from "./Photo";

const spring = { type: "spring", stiffness: 380, damping: 32 } as const;

/* ---------- Tabs ---------- */
export function Tabs({
  items,
}: {
  items: { id: string; label: string; body: ReactNode }[];
}) {
  const [active, setActive] = useState(items[0].id);
  const uid = useId();
  const current = items.find((i) => i.id === active)!;

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-2">
        {items.map((i) => {
          const on = i.id === active;
          return (
            <button
              key={i.id}
              role="tab"
              aria-selected={on}
              onClick={() => setActive(i.id)}
              className="relative rounded-full border border-ink/15 px-4 py-2 text-sm transition-colors hover:border-maroon"
            >
              {on && (
                <motion.span
                  layoutId={`tab-${uid}`}
                  transition={spring}
                  className="absolute inset-0 rounded-full bg-ink"
                />
              )}
              <span className={`relative ${on ? "text-white" : "text-ink/70"}`}>
                {i.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-8 min-h-[11rem]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            role="tabpanel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="space-y-5 leading-relaxed text-ink/80"
          >
            {current.body}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ---------- Accordion ---------- */
export function Accordion({
  items,
  startOpen = 0,
}: {
  items: { title: string; tag?: string; body: string }[];
  startOpen?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(startOpen);

  return (
    <div className="divide-y divide-ink/10 border-y border-ink/10">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={it.title}>
            <button
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="group flex w-full items-center gap-4 py-5 text-left"
            >
              <span className="label w-8 shrink-0 text-maroon">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`flex-1 font-display text-xl transition-all group-hover:translate-x-1 ${
                  isOpen ? "text-maroon" : ""
                }`}
              >
                {it.title}
              </span>
              {it.tag && (
                <span className="hidden rounded-full border border-ink/15 px-3 py-0.5 text-xs text-ink/60 sm:inline">
                  {it.tag}
                </span>
              )}
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                className="text-2xl leading-none text-maroon"
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-prose pb-6 pl-12 leading-relaxed text-ink/75">
                    {it.body}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- People: filter chips + expandable cards ---------- */
export function PeopleGrid({
  people,
}: {
  people: { name: string; role: string; note: string }[];
}) {
  const roles = ["All", ...Array.from(new Set(people.map((p) => p.role)))];
  const [filter, setFilter] = useState("All");
  const [open, setOpen] = useState<string | null>(null);
  const shown = people.filter((p) => filter === "All" || p.role === filter);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            key={r}
            onClick={() => {
              setFilter(r);
              setOpen(null);
            }}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              filter === r
                ? "border-maroon bg-maroon text-white"
                : "border-ink/15 text-ink/70 hover:border-maroon"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <motion.div layout className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {shown.map((p) => {
            const isOpen = open === p.name;
            const initials = p.name
              .split(" ")
              .map((s) => s[0])
              .join("");
            return (
              <motion.button
                layout
                key={p.name}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                whileHover={{ y: -4 }}
                onClick={() => setOpen(isOpen ? null : p.name)}
                aria-expanded={isOpen}
                className={`rounded-2xl border bg-white p-6 text-left shadow-sm transition-colors ${
                  isOpen ? "border-maroon shadow-md" : "border-ink/10 hover:border-ink/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal/10 font-display text-lg text-teal">
                    {initials}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-display text-2xl leading-tight">{p.name}</h3>
                    <p className="label mt-0.5 text-maroon">{p.role}</p>
                  </div>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    className="text-2xl leading-none text-maroon"
                  >
                    +
                  </motion.span>
                </div>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden pt-4 leading-relaxed text-ink/75"
                    >
                      {p.note}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ---------- Places explorer ---------- */
export function PlaceExplorer({
  places,
}: {
  places: { name: string; note: string; motif: ReactNode; photo?: string }[];
}) {
  const [i, setI] = useState(0);
  const uid = useId();
  const p = places[i];
  const go = (d: number) => setI((i + d + places.length) % places.length);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr,1.2fr]">
      <ul className="space-y-1" role="tablist" aria-label="Places">
        {places.map((pl, idx) => {
          const on = idx === i;
          return (
            <li key={pl.name}>
              <button
                role="tab"
                aria-selected={on}
                onClick={() => setI(idx)}
                onMouseEnter={() => setI(idx)}
                onFocus={() => setI(idx)}
                className="relative flex w-full items-center gap-4 rounded-xl px-4 py-3 text-left"
              >
                {on && (
                  <motion.span
                    layoutId={`place-${uid}`}
                    transition={spring}
                    className="absolute inset-0 rounded-xl bg-teal/10"
                  />
                )}
                <span className="label relative w-6 text-maroon">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span
                  className={`relative font-display text-xl ${
                    on ? "text-teal" : "text-ink/70"
                  }`}
                >
                  {pl.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-white p-8 shadow-sm sm:p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={p.name}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.3 }}
          >
            {(() => {
              const motif = (
                <div className="h-44 w-full text-maroon/60 [&>svg]:mx-auto [&>svg]:h-full [&>svg]:w-auto">
                  {p.motif}
                </div>
              );
              // Shows the photo when the file exists, the line-art motif otherwise.
              return p.photo ? (
                <Photo
                  key={p.photo}
                  src={p.photo}
                  alt={p.name}
                  className="h-56 w-full rounded-2xl sm:h-64"
                  fallback={motif}
                />
              ) : (
                motif
              );
            })()}
            <h3 className="mt-6 font-display text-3xl">{p.name}</h3>
            <p className="mt-3 max-w-prose leading-relaxed text-ink/75">{p.note}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex gap-1.5">
            {places.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-6 bg-maroon" : "w-1.5 bg-ink/20"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => go(-1)}
              aria-label="Previous place"
              className="h-10 w-10 rounded-full border border-ink/15 transition-colors hover:border-maroon hover:bg-maroon hover:text-white"
            >
              &larr;
            </button>
            <button
              onClick={() => go(1)}
              aria-label="Next place"
              className="h-10 w-10 rounded-full border border-ink/15 transition-colors hover:border-maroon hover:bg-maroon hover:text-white"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Playful motif wrappers ---------- */
export function Draggable({
  children,
  hint,
  className = "",
}: {
  children: ReactNode;
  hint?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={className}>
      <motion.div
        drag={!reduce}
        dragSnapToOrigin
        dragElastic={0.35}
        whileHover={{ scale: 1.03 }}
        whileDrag={{ scale: 1.08, rotate: -3 }}
        className="cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
      {hint && <p className="label mt-3 text-center text-ink/40">{hint}</p>}
    </div>
  );
}

export function Gallop({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      whileHover={
        reduce
          ? undefined
          : { x: [0, 24, 0], rotate: [0, -2, 0], transition: { duration: 0.9 } }
      }
    >
      {children}
    </motion.div>
  );
}