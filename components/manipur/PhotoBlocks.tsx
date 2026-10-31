import Photo from "./Photo";

type Item = { src: string; alt: string; caption?: string };

/* A row of 2 or 3 photos. With 3, the first one is large (editorial look). */
export function PhotoMosaic({ items, className = "" }: { items: Item[]; className?: string }) {
  const three = items.length === 3;
  return (
    <div
      className={`grid gap-3 ${three ? "md:grid-cols-3 md:grid-rows-2" : "sm:grid-cols-2"} ${className}`}
    >
      {items.map((it, i) => (
        <figure
          key={it.src}
          className={`group relative overflow-hidden rounded-2xl ${
            three && i === 0 ? "md:col-span-2 md:row-span-2" : ""
          }`}
        >
          <Photo
            src={it.src}
            alt={it.alt}
            className={`w-full transition duration-500 group-hover:scale-[1.03] ${
              three && i === 0 ? "aspect-[4/3] md:aspect-auto md:h-full" : "aspect-[4/3]"
            }`}
          />
          {it.caption && (
            <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent p-3 text-xs text-white">
              {it.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

/* One wide cinematic banner. */
export function PhotoBand({ src, alt, caption }: Item) {
  return (
    <figure className="relative overflow-hidden rounded-3xl">
      <Photo src={src} alt={alt} className="aspect-[21/9] w-full" />
      {caption && (
        <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5 font-display text-lg italic text-white">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}