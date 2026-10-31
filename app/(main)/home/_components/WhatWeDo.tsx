import { SERVICES } from "../_data/content";
import SectionHeading from "./SectionHeading";

export default function WhatWeDo() {
  return (
    <section className="mt-24 px-6 flex flex-col items-center">
      <SectionHeading eyebrow="What We Do" title="Three ways we move Manipur" className="mb-12" />
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full">
        {SERVICES.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl p-8 text-left"
            style={{
              background: "rgba(243,241,234,0.03)",
              border: "1px dashed rgba(243,241,234,0.16)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#3FA637" className="mb-4">
              {item.icon}
            </svg>
            <span className="eyebrow text-[10px] text-[#E8B84B]">{item.tag}</span>
            <h3 className="text-lg mt-2" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
              {item.title}
            </h3>
            <p className="text-[#92A395] text-sm mt-3 leading-relaxed">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
