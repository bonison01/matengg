"use client";
// Customer login + sign-up (email OTP) + forgot password against the
// centralized Mateng API. Used by /account/login, /account/register and
// /account/forgot-password.

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, MailCheck, ShieldCheck, Sparkles, Ticket } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { authService } from "@/lib/api/service";
import { ApiError } from "@/lib/api/api";
import { useCustomer } from "@/lib/api/useCustomer";
import { Btn, C, Field, Notice, PasswordInput, Shell } from "./ui";
import ForgotPasswordForm, { AUTH_EMAIL_KEY } from "./ForgotPasswordForm";
import { duplicateFieldErrors } from "./authErrors";

type Mode = "login" | "register" | "forgot";

/** Only same-site paths; blocks "//evil.com" and absolute URLs. */
export function safeRedirect(raw: string | null | undefined, fallback = "/events") {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

export default function AuthScreen({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = safeRedirect(params.get("redirect"));
  const reason = params.get("reason");
  const { session, ready } = useCustomer();

  
  // Already signed in → straight on.
  useEffect(() => {
    if (ready && session) router.replace(redirect);
  }, [ready, session, redirect, router]);

  const q = params.toString() ? `?${params.toString()}` : "";

  return (
    <Shell footer={false}>
      <div className="relative min-h-[calc(100svh-64px)] grid lg:grid-cols-[1.05fr_1fr]">
        <BrandPanel mode={mode} />

        <div className="relative flex items-center justify-center px-5 sm:px-8 py-12 lg:py-16">
          <div className="w-full max-w-[440px] mx-rise">
            {/* Mode switch (hidden on forgot password, which has its own back link) */}
            {mode !== "forgot" && (
            <div
              className="relative grid grid-cols-2 p-1 rounded-full mb-9"
              style={{ background: "rgba(243,241,234,0.05)", border: `1px solid ${C.line}` }}
            >
              <span
                aria-hidden
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-transform duration-300"
                style={{
                  background: C.cream,
                  transform: mode === "login" ? "translateX(4px)" : "translateX(calc(100% + 4px))",
                  transitionTimingFunction: "cubic-bezier(0.22,1,0.36,1)",
                }}
              />
              <Link
                href={`/account/login${q}`}
                replace
                className="relative z-10 h-10 flex items-center justify-center text-sm font-semibold transition-colors"
                style={{ color: mode === "login" ? C.bg : C.muted }}
              >
                Log in
              </Link>
              <Link
                href={`/account/register${q}`}
                replace
                className="relative z-10 h-10 flex items-center justify-center text-sm font-semibold transition-colors"
                style={{ color: mode === "register" ? C.bg : C.muted }}
              >
                Sign up
              </Link>
            </div>
            )}

            {reason === "checkout" && (
              <div className="mb-6">
                <Notice tone="info">Log in or create a free account to finish booking — your passes are saved.</Notice>
              </div>
            )}

            {mode === "login" ? (
              <LoginForm onDone={() => router.replace(redirect)} forgotHref={`/account/forgot-password${q}`} />
            ) : mode === "register" ? (
              <RegisterForm onDone={() => router.replace(redirect)} />
            ) : (
              <ForgotPasswordForm onDone={() => router.replace(redirect)} loginHref={`/account/login${q}`} />
            )}

            <p className="mt-10 text-center text-[12px] leading-relaxed" style={{ color: C.muted2 }}>
              By continuing you agree to Mateng&apos;s{" "}
              <Link href="/terms" className="underline underline-offset-2 hover:text-[#F3F1EA]">Terms</Link> and{" "}
              <Link href="/privacy_policy" className="underline underline-offset-2 hover:text-[#F3F1EA]">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ── Left brand panel ────────────────────────────────────────────────────────
const BUSINESS_LOGIN_HREF = "https://matengdelivery.com";
const ADMIN_LOGIN_HREF = "/admin/login";
function BrandPanel({ mode }: { mode: Mode }) {
  return (
    <div className="relative overflow-hidden hidden lg:flex flex-col justify-between px-14 py-14" style={{ background: C.surface, borderRight: `1px dashed ${C.line}` }}>
      {/* soft light */}
      <div aria-hidden className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full" style={{ background: "radial-gradient(circle, rgba(63,166,55,0.22), transparent 65%)" }} />
      <div aria-hidden className="absolute -bottom-48 right-[-120px] w-[480px] h-[480px] rounded-full" style={{ background: "radial-gradient(circle, rgba(232,184,75,0.13), transparent 65%)" }} />
      <svg aria-hidden className="absolute inset-x-0 top-24 w-full opacity-40" viewBox="0 0 600 160" fill="none">
        <path d="M-10 120 C 130 20, 220 150, 330 70 S 520 20, 620 90" stroke={C.green} strokeWidth="1.4" strokeDasharray="5 9">
          <animate attributeName="stroke-dashoffset" from="0" to="-200" dur="14s" repeatCount="indefinite" />
        </path>
        <circle cx="330" cy="70" r="4" fill={C.gold} />
      </svg>

      <span className="mx-eyebrow relative text-[11px]" style={{ color: C.muted }}>Mateng · Events</span>

      <div className="relative">
        <h1 className="mx-display text-5xl xl:text-6xl leading-[1.04]" style={{ color: C.cream }}>
          {mode === "login" ? (
            <>Welcome <em style={{ color: C.green }}>back</em>.</>
          ) : mode === "forgot" ? (
            <>Let&apos;s get you <em style={{ color: C.green }}>back in</em>.</>
          ) : (
            <>Your pass to what&apos;s <em style={{ color: C.green }}>happening</em>.</>
          )}
        </h1>
        <p className="mt-6 max-w-md text-[15px] leading-relaxed" style={{ color: C.muted }}>
          One Mateng account for concerts, screenings, festivals and fairs across Manipur — book in seconds, and keep every ticket in one place.
        </p>

        {/* Ticket stub */}
        {/* <div className="mt-12 max-w-md flex rounded-2xl overflow-hidden mx-glow" style={{ background: C.surface2 }}>
          <div className="flex-1 p-6">
            <span className="mx-eyebrow text-[9.5px]" style={{ color: C.gold }}>Admit one</span>
            <p className="mx-display text-2xl mt-2">Mateng Pass</p>
            <div className="mt-5 flex gap-7 text-[12px]" style={{ color: C.muted }}>
              <div><span className="mx-eyebrow block text-[9px]" style={{ color: C.muted2 }}>Book</span>In seconds</div>
              <div><span className="mx-eyebrow block text-[9px]" style={{ color: C.muted2 }}>Pay</span>Razorpay</div>
              <div><span className="mx-eyebrow block text-[9px]" style={{ color: C.muted2 }}>Entry</span>QR ticket</div>
            </div>
          </div>
          <div className="relative w-24 flex items-center justify-center" style={{ borderLeft: `2px dashed ${C.lineStrong}` }}>
            <span aria-hidden className="absolute -top-3 -left-3 w-6 h-6 rounded-full" style={{ background: C.surface }} />
            <span aria-hidden className="absolute -bottom-3 -left-3 w-6 h-6 rounded-full" style={{ background: C.surface }} />
            <Ticket className="h-8 w-8" style={{ color: C.green }} />
          </div>
        </div> */}
      </div>

      <div className="relative flex items-center gap-2 text-[12.5px]" style={{ color: C.muted2 }}>
        <ShieldCheck className="h-4 w-4" style={{ color: C.green }} />
        Secure sign-in · Tickets emailed instantly after payment
      </div>
    </div>
  );
}

// ── Log in ──────────────────────────────────────────────────────────────────

function LoginForm({ onDone, forgotHref }: { onDone: () => void; forgotHref: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authService.login(email.trim(), password);
      onDone();
    } catch (err) {
      const a = err as ApiError;
      setError(a.status === 401 || a.status === 400 ? "That email and password don't match. Try again." : a.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <div>
        <h2 className="mx-display text-3xl">Log in</h2>
        <p className="mt-2 text-sm" style={{ color: C.muted }}>Use your Mateng customer account.</p>
      </div>

      {error && <Notice>{error}</Notice>}

      <Field label="Email" htmlFor="login-email">
        <input id="login-email" className="mx-input" type="email" autoComplete="email" inputMode="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      </Field>

      <Field label="Password" htmlFor="login-password"
        aside={
          <Link href={forgotHref} replace className="text-[12.5px] font-medium hover:underline underline-offset-2" style={{ color: C.green }}
            onClick={() => { try { if (email.trim()) sessionStorage.setItem(AUTH_EMAIL_KEY, email.trim()); } catch {} }}>
            Forgot password?
          </Link>
        }>
        <PasswordInput id="login-password" value={password} onChange={setPassword} show={show} setShow={setShow} autoComplete="current-password" />
      </Field>

      <Btn type="submit" block loading={loading} disabled={!email || !password} className="mt-2">
        Log in <ArrowRight className="h-4 w-4" />
      </Btn>

      {/* Other account types */}
      <div className="pt-5 border-t" style={{ borderColor: C.line }}>
        <p className="text-center text-[12.5px]" style={{ color: C.muted2 }}>Not a customer?</p>
        <div className="mt-2 flex items-center justify-center gap-4 text-[13px] font-medium">
          <a href={BUSINESS_LOGIN_HREF} className="hover:underline underline-offset-2" style={{ color: C.green }}>
            Business login
          </a>
          <span aria-hidden="true" style={{ color: C.muted2 }}>·</span>
          <Link href={ADMIN_LOGIN_HREF} className="hover:underline underline-offset-2" style={{ color: C.green }}>
            Admin login
          </Link>
        </div>
      </div>
    </form>
  );
}

// ── Sign up (2 steps: details → OTP) ────────────────────────────────────────

type RegForm = { full_name: string; username: string; email: string; phone: string; password: string; confirm_password: string };

const REG_FIELDS: (keyof RegForm)[] = ["full_name", "username", "phone", "email", "password", "confirm_password"];
const REG_FIELD_IDS: Record<string, string> = {
  full_name: "reg-name", username: "reg-username", phone: "reg-phone", email: "reg-email", password: "reg-password", confirm_password: "reg-confirm",
};

/** Focus the first field (in form order) that has an error. */
function focusField(keys: string[]) {
  const first = REG_FIELDS.find((k) => keys.includes(k));
  if (!first) return;
  requestAnimationFrame(() => {
    const el = document.getElementById(REG_FIELD_IDS[first]);
    el?.focus();
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

const SUGGEST_MIN_CHARS = 4;
const SUGGEST_DEBOUNCE_MS = 500;

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [form, setForm] = useState<RegForm>({ full_name: "", username: "", email: "", phone: "", password: "", confirm_password: "" });
  // Username suggestions from the API. Auto-fills the main one until the user
  // types their own; clearing the field hands control back to suggestions.
  const [usernameEdited, setUsernameEdited] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestNonce, setSuggestNonce] = useState(0);
  const [touched, setTouched] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [otp, setOtp] = useState("");
  const [otpInfo, setOtpInfo] = useState<{ expiresIn: number; debug?: string | null } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const set = (k: keyof RegForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (k === "phone") v = v.replace(/\D/g, "").slice(0, 10);
    if (k === "username") {
      v = v.replace(/\s/g, "").toLowerCase();
      setUsernameEdited(v.length > 0);
    }
    setForm((f) => ({ ...f, [k]: v }));
    setServerFieldErrors((s) => ({ ...s, [k]: "" }));
  };

  const errors = useMemo(() => {
    const e: Partial<Record<keyof RegForm, string>> = {};
    if (form.full_name.trim().length < 2) e.full_name = "Enter your full name";
    if (!/^[a-z0-9_.]{3,30}$/.test(form.username)) e.username = "3–30 characters: letters, numbers, _ or .";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email";
    if (!/^\d{10}$/.test(form.phone)) e.phone = "10-digit mobile number";
    if (form.password.length < 8) e.password = "At least 8 characters";
    if (!form.confirm_password) e.confirm_password = "Re-enter your password";
    else if (form.confirm_password !== form.password) e.confirm_password = "Passwords don't match";
    return e;
  }, [form]);
  const errOf = (k: keyof RegForm) => serverFieldErrors[k] || (touched ? errors[k] : undefined);

  // Debounced username suggestions once the full name has 4+ characters.
  useEffect(() => {
    const name = form.full_name.trim();
    if (name.length < SUGGEST_MIN_CHARS) { setSuggestions([]); setSuggesting(false); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setSuggesting(true);
      try {
        const res = await authService.usernameSuggestions(name, 3, ctrl.signal);
        setSuggestions([res.suggested, ...res.alternatives].filter((u, i, a) => u && a.indexOf(u) === i));
        if (!usernameEdited) {
          setForm((f) => ({ ...f, username: res.suggested }));
          setServerFieldErrors((s) => ({ ...s, username: "" }));
        }
      } catch {
        /* suggestions are a convenience — the field still works by hand */
      } finally {
        if (!ctrl.signal.aborted) setSuggesting(false);
      }
    }, SUGGEST_DEBOUNCE_MS);
    return () => { clearTimeout(t); ctrl.abort(); };
    // usernameEdited is read, not a trigger: typing a username shouldn't refetch.
  }, [form.full_name, suggestNonce]);

  const pickUsername = (u: string) => {
    setForm((f) => ({ ...f, username: u }));
    setUsernameEdited(true);
    setServerFieldErrors((s) => ({ ...s, username: "" }));
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (Object.keys(errors).length) { focusField(Object.keys(errors)); return; }
    setLoading(true);
    try {
      const res = await authService.register({
        full_name: form.full_name.trim(),
        username: form.username,
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
      });
      setOtpInfo({ expiresIn: res.otp_expires_in_seconds, debug: res.otp_debug });
      setCooldown(30);
      setStep("otp");
    } catch (err) {
      const a = err as ApiError;
      const fe = a.fieldErrors?.() || {};
      const dup = await duplicateFieldErrors(a, form.email.trim());
      Object.assign(fe, dup);
      if (dup.username) { setUsernameEdited(false); setSuggestNonce((n) => n + 1); }
      const onForm = Object.keys(fe).filter((k) => REG_FIELDS.includes(k as keyof RegForm));
      const offForm = Object.keys(fe).filter((k) => !onForm.includes(k)).map((k) => fe[k]);
      setServerFieldErrors(fe);
      // Errors for fields on the form show under those fields; only anything
      // that has no field of its own goes in the banner.
      setError(offForm.length ? offForm.join(" ") : onForm.length ? null : a.message);
      if (onForm.length) focusField(onForm);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (code = otp) => {
    if (code.length !== 6) return;
    setError(null);
    setLoading(true);
    try {
      await authService.verifyOtp(form.email.trim(), code);
      await authService.login(form.email.trim(), form.password);
      onDone();
    } catch (err) {
      const a = err as ApiError;
      setOtp("");
      // The duplicate check can also fire here, at activation. Send the user
      // back to the details step with the error under the right field.
      const dup = await duplicateFieldErrors(a, form.email.trim());
      if (Object.keys(dup).length) {
        if (dup.username) { setUsernameEdited(false); setSuggestNonce((n) => n + 1); }
        setServerFieldErrors(dup);
        setStep("details");
        focusField(Object.keys(dup));
        return;
      }
      setError(a.status === 400 || a.status === 422 ? a.message || "That code isn't right. Check your email and try again." : a.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      const res = await authService.resendOtp(form.email.trim());
      setOtpInfo({ expiresIn: res.otp_expires_in_seconds, debug: res.otp_debug });
      setCooldown(30);
    } catch (err) {
      setError((err as ApiError).message);
    }
  };

  if (step === "otp") {
    return (
      <div className="space-y-6">
        <button type="button" onClick={() => { setStep("details"); setOtp(""); setError(null); }}
          className="inline-flex items-center gap-1.5 text-sm hover:text-[#F3F1EA] transition" style={{ color: C.muted }}>
          <ArrowLeft className="h-4 w-4" /> Edit details
        </button>
        <div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: C.greenSoft }}>
            <MailCheck className="h-6 w-6" style={{ color: C.green }} />
          </div>
          <h2 className="mx-display text-3xl">Check your email</h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>
            We sent a 6-digit code to <span style={{ color: C.cream }}>{form.email}</span>
            {otpInfo?.expiresIn ? ` — it's valid for ${Math.round(otpInfo.expiresIn / 60)} minutes.` : "."}
          </p>
        </div>

        {error && <Notice>{error}</Notice>}
        {otpInfo?.debug && <Notice tone="info">Dev backend code: <span className="mx-tabular">{otpInfo.debug}</span></Notice>}

        <InputOTP maxLength={6} value={otp} onChange={(v) => { setOtp(v.replace(/\D/g, "")); if (v.length === 6) verify(v); }}
          containerClassName="justify-between" autoFocus inputMode="numeric">
          <InputOTPGroup className="gap-2 sm:gap-3 w-full justify-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot key={i} index={i}
                className="!h-14 !w-12 sm:!w-14 !rounded-xl !border text-xl mx-tabular data-[active=true]:!border-[#3FA637] data-[active=true]:!ring-[#3FA637]/25"
                style={{ background: "rgba(243,241,234,0.04)", borderColor: C.line, color: C.cream }} />
            ))}
          </InputOTPGroup>
        </InputOTP>

        <Btn block loading={loading} disabled={otp.length !== 6} onClick={() => verify()}>
          Verify &amp; continue <ArrowRight className="h-4 w-4" />
        </Btn>

        <p className="text-center text-sm" style={{ color: C.muted }}>
          Didn&apos;t get it?{" "}
          {cooldown > 0 ? (
            <span className="mx-tabular" style={{ color: C.muted2 }}>Resend in {cooldown}s</span>
          ) : (
            <button type="button" onClick={resend} className="font-semibold hover:underline" style={{ color: C.green }}>Resend code</button>
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submitDetails} className="space-y-5" noValidate>
      <div>
        <h2 className="mx-display text-3xl">Create your account</h2>
        <p className="mt-2 text-sm" style={{ color: C.muted }}>Takes a minute. We&apos;ll email you a code to verify.</p>
      </div>

      {error && <Notice>{error}</Notice>}

      <Field label="Full name" htmlFor="reg-name" error={errOf("full_name")}>
        <input id="reg-name" className="mx-input" autoComplete="name" value={form.full_name} onChange={set("full_name")}
          placeholder="Your name" aria-invalid={!!errOf("full_name")} />
      </Field>

      <Field label="Username" htmlFor="reg-username" error={errOf("username")}
        hint={form.full_name.trim().length < SUGGEST_MIN_CHARS ? "We'll suggest one from your name" : undefined}>
        <div className="relative">
          <input id="reg-username" className="mx-input pr-10" autoComplete="username" value={form.username} onChange={set("username")}
            placeholder="john_doe" aria-invalid={!!errOf("username")} />
          {suggesting && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" style={{ color: C.muted }} />}
        </div>
      </Field>
      {suggestions.length > 0 && (
        <div className="-mt-2 flex flex-wrap items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" style={{ color: C.gold }} />
          {suggestions.map((u) => {
            const active = u === form.username;
            return (
              <button key={u} type="button" onClick={() => pickUsername(u)}
                className="mx-tabular text-[12px] px-3 h-7 rounded-full transition-colors"
                style={{
                  background: active ? C.greenSoft : "rgba(243,241,234,0.04)",
                  border: `1px solid ${active ? "rgba(63,166,55,0.5)" : C.line}`,
                  color: active ? C.green : C.muted,
                }}>
                {u}
              </button>
            );
          })}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Mobile" htmlFor="reg-phone" error={errOf("phone")}>
          <input id="reg-phone" className="mx-input mx-tabular" type="tel" inputMode="numeric" autoComplete="tel-national"
            value={form.phone} onChange={set("phone")} placeholder="98765 43210" aria-invalid={!!errOf("phone")} />
        </Field>
        <Field label="Email" htmlFor="reg-email" error={errOf("email")}>
          <input id="reg-email" className="mx-input" type="email" inputMode="email" autoComplete="email" value={form.email}
            onChange={set("email")} placeholder="you@example.com" aria-invalid={!!errOf("email")} />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Password" htmlFor="reg-password" error={errOf("password")} hint="At least 8 characters">
          <PasswordInput id="reg-password" value={form.password} onChange={(v) => { setForm((f) => ({ ...f, password: v })); setServerFieldErrors((s) => ({ ...s, password: "" })); }}
            show={show} setShow={setShow} autoComplete="new-password" invalid={!!errOf("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="reg-confirm" error={errOf("confirm_password")}
          hint={form.confirm_password && form.confirm_password === form.password ? <span style={{ color: C.green }}>Passwords match</span> : undefined}>
          <PasswordInput id="reg-confirm" value={form.confirm_password} onChange={(v) => setForm((f) => ({ ...f, confirm_password: v }))}
            show={show} setShow={setShow} autoComplete="new-password" invalid={!!errOf("confirm_password")} />
        </Field>
      </div>

      <Btn type="submit" block loading={loading} className="mt-2">
        Continue <ArrowRight className="h-4 w-4" />
      </Btn>
    </form>
  );
}
