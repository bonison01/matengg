'use client'

import { IMPACT_STATS } from "../_data/content";
import { useCountUp } from "../_hooks/useCountUp";
import SectionHeading from "./SectionHeading";

function Stat({ target, step, suffix, label }: Omit<(typeof IMPACT_STATS)[number], "key">) {
  const value = useCountUp(target, step);
  return (
    <div>
      <p className="tabular text-2xl sm:text-3xl text-[#3FA637] font-semibold">
        {Math.floor(value)}
        {suffix}
      </p>
      <p className="text-[#92A395] text-xs mt-1">{label}</p>
    </div>
  );
}

export default function Impact() {
  return (
    <section className="mt-24 flex flex-col items-center text-center px-6">
      <SectionHeading eyebrow="Our Impact" title="Ahead on every road, by far." />
      <div
        className="stub-row flex flex-row justify-center gap-8 md:gap-16 rounded-2xl px-8 sm:px-14 py-8"
        style={{ background: "rgba(243,241,234,0.03)", border: "1px dashed rgba(243,241,234,0.16)" }}
      >
        {IMPACT_STATS.map(({ key, ...s }) => (
          <Stat key={key} {...s} />
        ))}
      </div>
    </section>
  );
}