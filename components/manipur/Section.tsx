// components/manipur/Section.tsx
import { ReactNode } from "react";
import Reveal from "./Reveal";
import ParallaxLayer from "./ParallaxLayer";

export default function Section({
  id,
  index,
  eyebrow,
  title,
  children,
  aside,
  layout = "split",
  parallaxAside = true,
  className = "",
}: {
  id: string;
  index: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  aside?: ReactNode;
  layout?: "split" | "stacked";
  parallaxAside?: boolean;
  className?: string;
}) {
  const header = (
    <div className="flex items-center gap-4 border-t border-ink/10 pt-6">
      <span className="font-display text-sm text-maroon">{index}</span>
      <span className="h-px w-10 bg-gold" />
      <p className="label text-ink/60">{eyebrow}</p>
    </div>
  );

  return (
    <section id={id} className={`scroll-mt-32 bg-white text-ink ${className}`}>
      <div className="mx-auto max-w-6xl px-6 py-20 sm:px-10 sm:py-28">
        {header}

        {layout === "stacked" ? (
          <div className="mt-6">
            <Reveal>
              <h2 className="max-w-3xl font-display text-4xl leading-tight text-balance sm:text-5xl">
                {title}
              </h2>
            </Reveal>
            <div className="mt-12">{children}</div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr,0.9fr] lg:gap-20">
            <Reveal>
              <h2 className="max-w-xl font-display text-4xl leading-tight text-balance sm:text-5xl">
                {title}
              </h2>
              <div className="mt-8 max-w-prose space-y-5 leading-relaxed text-ink/80">
                {children}
              </div>
            </Reveal>
            {aside &&
              (parallaxAside ? (
                <ParallaxLayer distance={36} className="lg:pt-2">
                  {aside}
                </ParallaxLayer>
              ) : (
                <div className="lg:pt-2">{aside}</div>
              ))}
          </div>
        )}
      </div>
    </section>
  );
}