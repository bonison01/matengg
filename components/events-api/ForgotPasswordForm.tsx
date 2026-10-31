"use client";
// Forgot password for customer accounts: email → 6-digit code + new password.
// On success the customer is logged in with the new password and sent on.

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, KeyRound, MailCheck } from "lucide-react";
import { authService } from "@/lib/api/service";
import { ApiError } from "@/lib/api/api";
import { Btn, C, Field, Notice, OtpInput, PasswordInput } from "./ui";

/** Email typed on the login form, carried over without putting it in the URL. */
export const AUTH_EMAIL_KEY = "mateng.authEmail";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

export default function ForgotPasswordForm({ onDone, loginHref }: { onDone: () => void; loginHref: string }) {
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [otpInfo, setOtpInfo] = useState<{ expiresIn: number; debug?: string | null } | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_EMAIL_KEY);
      if (saved) setEmail(saved);
    } catch {}
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const resetErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (otp.length !== 6) e.otp = "Enter the 6-digit code from your email";
    if (password.length < 8) e.new_password = "At least 8 characters";
    if (!confirm) e.confirm_password = "Re-enter your new password";
    else if (confirm !== password) e.confirm_password = "Passwords don't match";
    return e;
  }, [otp, password, confirm]);
  const errOf = (k: string) => fieldErrors[k] || (touched ? resetErrors[k] : undefined);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    if (!isEmail(email)) { setFieldErrors({ email: "Enter a valid email address" }); return; }
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      setOtpInfo({ expiresIn: res.otp_expires_in_seconds, debug: res.otp_debug });
      setCooldown(30);
      setFieldErrors({});
      setStep("reset");
    } catch (err) {
      const a = err as ApiError;
      const fe = a.fieldErrors();
      setFieldErrors(fe);
      setError(fe.email ? null : a.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      const res = await authService.forgotPassword(email.trim());
      setOtpInfo({ expiresIn: res.otp_expires_in_seconds, debug: res.otp_debug });
      setCooldown(30);
      setOtp("");
    } catch (err) {
      setError((err as ApiError).message);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setError(null);
    if (Object.keys(resetErrors).length) return;
    setLoading(true);
    try {
      await authService.resetPassword(email.trim(), otp, password);
      try { sessionStorage.removeItem(AUTH_EMAIL_KEY); } catch {}
      // Log straight in with the new password. If that fails (e.g. a staff
      // account), the reset still worked — show the success step instead.
      try {
        await authService.login(email.trim(), password);
        onDone();
      } catch {
        setStep("done");
      }
    } catch (err) {
      const a = err as ApiError;
      if (a.status === 400 && /code/i.test(String(a.detail))) {
        setFieldErrors({ otp: "That code is wrong or has expired. Check your email or resend a new one." });
        setOtp("");
      } else {
        const fe = a.fieldErrors();
        setFieldErrors(fe);
        setError(Object.keys(fe).length ? null : a.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: C.greenSoft }}>
          <KeyRound className="h-6 w-6" style={{ color: C.green }} />
        </div>
        <div>
          <h2 className="mx-display text-3xl">Password updated</h2>
          <p className="mt-2 text-sm" style={{ color: C.muted }}>You can now log in with your new password.</p>
        </div>
        <Link href={loginHref} replace className="block"><Btn block>Log in <ArrowRight className="h-4 w-4" /></Btn></Link>
      </div>
    );
  }

  if (step === "reset") {
    return (
      <form onSubmit={reset} className="space-y-5" noValidate>
        <button type="button" onClick={() => { setStep("email"); setOtp(""); setError(null); setFieldErrors({}); setTouched(false); }}
          className="inline-flex items-center gap-1.5 text-sm hover:text-[#F3F1EA] transition" style={{ color: C.muted }}>
          <ArrowLeft className="h-4 w-4" /> Use a different email
        </button>
        <div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: C.greenSoft }}>
            <MailCheck className="h-6 w-6" style={{ color: C.green }} />
          </div>
          <h2 className="mx-display text-3xl">Check your email</h2>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: C.muted }}>
            If an account exists for <span style={{ color: C.cream }}>{email}</span>, we&apos;ve sent a 6-digit code
            {otpInfo?.expiresIn ? ` — it's valid for ${Math.round(otpInfo.expiresIn / 60)} minutes.` : "."}
          </p>
        </div>

        {error && <Notice>{error}</Notice>}
        {otpInfo?.debug && <Notice tone="info">Dev backend code: <span className="mx-tabular">{otpInfo.debug}</span></Notice>}

        <Field label="Code" error={errOf("otp")}>
          <OtpInput value={otp} invalid={!!errOf("otp")} onChange={(v) => { setOtp(v); setFieldErrors((f) => ({ ...f, otp: "" })); }} />
        </Field>

        <Field label="New password" htmlFor="fp-password" error={errOf("new_password")} hint="At least 8 characters">
          <PasswordInput id="fp-password" value={password} show={show} setShow={setShow} autoComplete="new-password"
            invalid={!!errOf("new_password")} onChange={(v) => { setPassword(v); setFieldErrors((f) => ({ ...f, new_password: "" })); }} />
        </Field>

        <Field label="Confirm new password" htmlFor="fp-confirm" error={errOf("confirm_password")}
          hint={confirm && confirm === password ? <span style={{ color: C.green }}>Passwords match</span> : undefined}>
          <PasswordInput id="fp-confirm" value={confirm} show={show} setShow={setShow} autoComplete="new-password"
            invalid={!!errOf("confirm_password")} onChange={setConfirm} />
        </Field>

        <Btn type="submit" block loading={loading} className="mt-2">
          Reset password <ArrowRight className="h-4 w-4" />
        </Btn>

        <p className="text-center text-sm" style={{ color: C.muted }}>
          Didn&apos;t get it?{" "}
          {cooldown > 0 ? (
            <span className="mx-tabular" style={{ color: C.muted2 }}>Resend in {cooldown}s</span>
          ) : (
            <button type="button" onClick={resend} className="font-semibold hover:underline" style={{ color: C.green }}>Resend code</button>
          )}
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-5" noValidate>
      <Link href={loginHref} replace className="inline-flex items-center gap-1.5 text-sm hover:text-[#F3F1EA] transition" style={{ color: C.muted }}>
        <ArrowLeft className="h-4 w-4" /> Back to log in
      </Link>
      <div>
        <h2 className="mx-display text-3xl">Forgot password?</h2>
        <p className="mt-2 text-sm" style={{ color: C.muted }}>Enter your account email and we&apos;ll send you a code to reset it.</p>
      </div>

      {error && <Notice>{error}</Notice>}

      <Field label="Email" htmlFor="fp-email" error={fieldErrors.email}>
        <input id="fp-email" className="mx-input" type="email" inputMode="email" autoComplete="email" autoFocus
          value={email} onChange={(e) => { setEmail(e.target.value); setFieldErrors({}); }} placeholder="you@example.com"
          aria-invalid={!!fieldErrors.email} />
      </Field>

      <Btn type="submit" block loading={loading} disabled={!email.trim()}>
        Send code <ArrowRight className="h-4 w-4" />
      </Btn>
    </form>
  );
}
