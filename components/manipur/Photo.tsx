// components/manipur/Photo.tsx
"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * A photo that disappears (or shows `fallback`) if the file is missing, so the
 * page never shows a broken-image icon while you are still adding pictures.
 */
export default function Photo({
  src,
  alt,
  credit,
  className = "",
  imgClassName = "",
  fallback = null,
}: {
  src: string;
  alt: string;
  credit?: string;
  className?: string;
  imgClassName?: string;
  fallback?: ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  // Catches images that already failed before React attached onError.
  useEffect(() => {
    const el = ref.current;
    if (el && el.complete && el.naturalWidth === 0) setFailed(true);
  }, [src]);

  if (failed) return <>{fallback}</>;

  return (
    <figure className={`relative overflow-hidden bg-ink/5 ${className}`}>
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`h-full w-full object-cover ${imgClassName}`}
      />
      {credit && (
        <figcaption className="absolute bottom-0 right-0 bg-black/55 px-2 py-0.5 text-[10px] text-white/85">
          {credit}
        </figcaption>
      )}
    </figure>
  );
}