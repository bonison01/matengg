type Props = {
  eyebrow: string;
  title: string;
  eyebrowColor?: string;
  className?: string;
};

export default function SectionHeading({
  eyebrow,
  title,
  eyebrowColor = "text-[#8FA391]",
  className = "mb-10",
}: Props) {
  return (
    <>
      <span className={`eyebrow text-[11px] mb-3 ${eyebrowColor}`}>{eyebrow}</span>
      <h2
        className={`text-2xl sm:text-3xl text-center ${className}`}
        style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
      >
        {title}
      </h2>
    </>
  );
}
