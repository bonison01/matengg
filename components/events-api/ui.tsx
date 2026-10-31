"use client";
// Shared look for the pages backed by the centralized events API (event
// detail, checkout, confirmation, account). Same tokens as the homepage:
// deep green-black canvas, cream text, Mateng green + gold, dashed hairlines,
// Fraunces / Inter / JetBrains Mono.

import React from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Footer from "@/components/footer/Footer";
import { fontVariables } from "@/app/(main)/home/_lib/fonts";

export const C = {
  bg: "#0B1410",
  surface: "#101B15",
  surface2: "#14221A",
  cream: "#F3F1EA",
  muted: "#92A395",
  muted2: "#6B7A6D",
  green: "#3FA637",
  greenSoft: "rgba(63,166,55,0.14)",
  gold: "#E8B84B",
  red: "#F08A7E",
  line: "rgba(243,241,234,0.14)",
  lineStrong: "rgba(243,241,234,0.22)",
};

export function ThemeStyles() {
  return (
    <style jsx global>{`
      .mx-eyebrow { font-family: var(--font-mono); letter-spacing: 0.18em; text-transform: uppercase; }
      .mx-tabular { font-family: var(--font-mono); font-feature-settings: "tnum" 1; }
      .mx-display { font-family: var(--font-display); font-weight: 600; }
      @keyframes mx-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
      .mx-rise { animation: mx-rise 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
      @keyframes mx-pulse { 0%,100% { box-shadow: 0 0 0 0 rgba(63,166,55,0.4); } 50% { box-shadow: 0 0 0 8px rgba(63,166,55,0); } }
      .mx-live { animation: mx-pulse 1.8s ease-in-out infinite; }
      .mx-input {
        width: 100%; height: 48px; padding: 0 16px; border-radius: 14px;
        background: rgba(243,241,234,0.04); border: 1px solid ${C.line}; color: ${C.cream};
        font-size: 15px; transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
      }
      .mx-input::placeholder { color: ${C.muted2}; }
      .mx-input:focus { outline: none; border-color: ${C.green}; background: rgba(243,241,234,0.06); box-shadow: 0 0 0 4px rgba(63,166,55,0.15); }
      .mx-input[aria-invalid="true"] { border-color: ${C.red}; }
      textarea.mx-input { height: auto; padding: 12px 16px; resize: vertical; }
      .mx-card { background: ${C.surface}; border: 1px dashed ${C.lineStrong}; border-radius: 22px; }
      .mx-glow { box-shadow: 0 0 0 1px rgba(63,166,55,0.28), 0 30px 80px -30px rgba(63,166,55,0.4); }
    `}</style>
  );
}

/** Page wrapper: fonts, dark canvas, footer. */
export function Shell({ children, footer = true, className = "" }: { children: React.ReactNode; footer?: boolean; className?: string }) {
  return (
    <div
      className={`${fontVariables} w-full min-h-[calc(100svh-64px)] flex flex-col ${className}`}
      style={{ background: C.bg, color: C.cream, fontFamily: "var(--font-body)", position: "relative", zIndex: 1 }}
    >
      <ThemeStyles />
      <div className="flex-grow">{children}</div>
      {footer && (
        <footer className="w-full mt-16 text-[#92A395]">
          <Footer />
        </footer>
      )}
    </div>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "gold";
  loading?: boolean;
  block?: boolean;
};

export function Btn({ variant = "primary", loading, block, className = "", children, disabled, style, ...rest }: BtnProps) {
  const base =
    "inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full font-semibold text-[15px] transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100";
  const look =
    variant === "primary"
      ? { background: C.green, color: C.bg }
      : variant === "gold"
        ? { background: C.gold, color: C.bg }
        : { background: "transparent", color: C.cream, border: `1px solid ${C.lineStrong}` };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`${base} ${variant !== "ghost" ? "hover:-translate-y-0.5 hover:brightness-110" : "hover:bg-white/5"} ${block ? "w-full" : ""} ${className}`}
      style={{ ...look, ...style }}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
  aside,
}: {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  htmlFor?: string;
  /** Shown at the right end of the label row, e.g. a "Forgot password?" link. */
  aside?: React.ReactNode;
}) {
  const labelText = (
    <span className="mx-eyebrow block text-[10px]" style={{ color: C.muted }}>
      {label}
    </span>
  );
  if (aside) {
    // A link can't sit inside <label>, so this variant labels via htmlFor.
    return (
      <div>
        <div className="flex items-center justify-between gap-3 mb-2">
          <label htmlFor={htmlFor}>{labelText}</label>
          {aside}
        </div>
        {children}
        {error ? (
          <span className="block mt-1.5 text-[12.5px]" style={{ color: C.red }}>{error}</span>
        ) : hint ? (
          <span className="block mt-1.5 text-[12.5px]" style={{ color: C.muted2 }}>{hint}</span>
        ) : null}
      </div>
    );
  }
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mx-eyebrow block text-[10px] mb-2" style={{ color: C.muted }}>
        {label}
      </span>
      {children}
      {error ? (
        <span className="block mt-1.5 text-[12.5px]" style={{ color: C.red }}>{error}</span>
      ) : hint ? (
        <span className="block mt-1.5 text-[12.5px]" style={{ color: C.muted2 }}>{hint}</span>
      ) : null}
    </label>
  );
}

export function Notice({ tone = "error", children }: { tone?: "error" | "info" | "success"; children: React.ReactNode }) {
  const color = tone === "error" ? C.red : tone === "success" ? C.green : C.gold;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed"
      style={{ background: `${color}14`, border: `1px solid ${color}40`, color: tone === "error" ? "#F6C1B9" : C.cream }}
    >
      {children}
    </div>
  );
}

export function PageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-3" style={{ color: C.muted }}>
      <Loader2 className="h-6 w-6 animate-spin" style={{ color: C.green }} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

const PAYMENT_LOOK: Record<string, { label: string; color: string }> = {
  paid: { label: "Confirmed", color: C.green },
  success: { label: "Confirmed", color: C.green },
  pending: { label: "Awaiting payment", color: C.gold },
  failed: { label: "Payment failed", color: C.red },
  expired: { label: "Expired", color: C.muted },
  cancelled: { label: "Cancelled", color: C.muted },
};

export function PaymentBadge({ status }: { status: string }) {
  const s = PAYMENT_LOOK[status] || { label: status, color: C.muted };
  return (
    <span
      className="mx-eyebrow inline-flex items-center gap-1.5 text-[9.5px] px-2.5 py-1 rounded-full"
      style={{ color: s.color, background: `${s.color}17`, border: `1px solid ${s.color}40` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  );
}

export function PasswordInput({
  id, value, onChange, show, setShow, autoComplete, invalid,
}: {
  id: string; value: string; onChange: (v: string) => void; show: boolean; setShow: (v: boolean) => void; autoComplete: string; invalid?: boolean;
}) {
  return (
    <div className="relative">
      <input id={id} className="mx-input pr-12" type={show ? "text" : "password"} autoComplete={autoComplete}
        value={value} onChange={(e) => onChange(e.target.value)} placeholder="••••••••" aria-invalid={invalid} />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/5 transition"
        style={{ color: C.muted }}>
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

/** Six-box email code input, styled for the dark theme. */
export function OtpInput({ value, onChange, onComplete, invalid }: {
  value: string; onChange: (v: string) => void; onComplete?: (v: string) => void; invalid?: boolean;
}) {
  return (
    <InputOTP maxLength={6} value={value} inputMode="numeric" autoFocus containerClassName="justify-between"
      onChange={(v) => { const d = v.replace(/\D/g, ""); onChange(d); if (d.length === 6) onComplete?.(d); }}>
      <InputOTPGroup className="gap-2 sm:gap-3 w-full justify-between">
        {Array.from({ length: 6 }).map((_, i) => (
          <InputOTPSlot key={i} index={i}
            className="!h-14 !w-12 sm:!w-14 !rounded-xl !border text-xl mx-tabular data-[active=true]:!border-[#3FA637] data-[active=true]:!ring-[#3FA637]/25"
            style={{ background: "rgba(243,241,234,0.04)", borderColor: invalid ? C.red : C.line, color: C.cream }} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  );
}
