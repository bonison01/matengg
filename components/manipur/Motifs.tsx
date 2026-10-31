// Hand-built line-art motifs referencing Manipuri landscape and craft:
// layered hills around the valley, Loktak's floating phumdi islands,
// the brow-antlered Sangai deer, a horseback polo rider, and the
// interlocking diamond lattice common to Manipuri handloom borders.

//components/manipur/CountUp.tsx
export function RidgeMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 220"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0 170 L60 110 L110 150 L170 70 L230 140 L290 90 L350 155 L410 100 L480 160"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.35"
      />
      <path
        d="M0 200 L80 150 L140 185 L210 120 L270 175 L340 130 L400 190 L480 145"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.6"
      />
      <circle cx="400" cy="46" r="26" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}

export function LoktakMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 320"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <ellipse cx="210" cy="250" rx="190" ry="46" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      {/* phumdi islands, drifting circles of varied size */}
      {[
        [120, 210, 26],
        [205, 235, 18],
        [270, 200, 32],
        [90, 255, 14],
        [320, 245, 16],
        [175, 190, 12],
      ].map(([cx, cy, r], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          stroke="currentColor"
          strokeWidth="1.4"
          opacity={0.45 + (i % 3) * 0.1}
        />
      ))}
      <path
        d="M20 40 L60 15 L100 42 L140 10 L180 44 L220 18 L260 46 L300 14 L340 42 L380 20"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity="0.4"
      />
    </svg>
  );
}

export function SangaiMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 300 260"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* stylised brow-antlered deer, side profile, dancing pose */}
      <path
        d="M150 60 C 120 40, 95 45, 82 20 M150 60 C 165 35, 190 38, 205 15 M150 60 C 130 48, 118 30, 108 8 M150 60 C 168 50, 182 34, 196 12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M150 60 C 130 78, 118 100, 122 130 C 110 150, 96 168, 70 178"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.85"
      />
      <path
        d="M122 130 C 150 148, 190 150, 220 132 C 236 150, 232 178, 210 196"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.85"
      />
      <path
        d="M70 178 L58 224 M84 176 L76 226 M210 196 L222 238 M192 198 L198 240"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.8"
      />
      <circle cx="152" cy="52" r="3.2" fill="currentColor" opacity="0.9" />
    </svg>
  );
}

export function LatticeMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 24"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      {Array.from({ length: 17 }).map((_, i) => (
        <path
          key={i}
          d={`M${i * 12} 12 L${i * 12 + 6} 2 L${i * 12 + 12} 12 L${i * 12 + 6} 22 Z`}
          stroke="currentColor"
          strokeWidth="1"
          fill="none"
          opacity="0.55"
        />
      ))}
    </svg>
  );
}

export function RiderMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 180"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M20 150 C 40 100, 60 90, 90 92 C 96 70, 112 54, 138 52 C 150 40, 168 40, 176 52 C 200 54, 214 70, 214 92 C 234 96, 244 112, 238 132"
        stroke="currentColor"
        strokeWidth="1.8"
        opacity="0.8"
      />
      <path
        d="M150 60 C 158 40, 150 20, 132 16 C 146 30, 148 46, 140 58"
        stroke="currentColor"
        strokeWidth="1.6"
        opacity="0.75"
      />
      <path
        d="M214 92 L236 40"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M90 92 L78 150 M118 96 L106 152 M170 96 L184 150 M198 92 L208 148"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        opacity="0.7"
      />
      <ellipse cx="30" cy="160" rx="16" ry="4" stroke="currentColor" strokeWidth="1.2" opacity="0.4" />
    </svg>
  );
}
