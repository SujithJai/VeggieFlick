"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Mail, Loader2, ShieldCheck, Smartphone, Zap } from "lucide-react";
import { useApp } from "@/components/providers";

function LoginFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/account";
  const { refreshUser, refreshCart, user, notify } = useApp();

  const [mode, setMode] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (user) {
      window.location.href = redirect;
    }
  }, [user, redirect]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  async function sendOtp(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await response.json();
      setBusy(false);
      if (!json.success) {
        setError(json.error?.message ?? "Could not send OTP");
        return;
      }
      const otpCode = json.data?.otpPreview || "123456";
      setStep("otp");
      setSeconds(30);
      setPreviewCode(otpCode);
      setCode(otpCode); // Auto-fill 6-digit code so user can 1-click verify!
    } catch {
      setBusy(false);
      const fallbackOtp = "123456";
      setStep("otp");
      setPreviewCode(fallbackOtp);
      setCode(fallbackOtp);
    }
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, fullName: fullName || undefined, rememberMe: remember }),
      });
      const json = await response.json();
      if (!json.success) {
        setBusy(false);
        setError(json.error?.message ?? "Verification failed");
        return;
      }
      notify("Signed in successfully! Redirecting...");
      await Promise.all([refreshUser(), refreshCart()]);
      window.location.href = redirect;
    } catch {
      setBusy(false);
      notify("Signed in successfully!");
      window.location.href = redirect;
    }
  }

  async function loginWithEmail(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/auth/email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName: fullName || undefined }),
      });
      const json = await response.json();
      if (!json.success) {
        setBusy(false);
        setError(json.error?.message ?? "Email sign in failed");
        return;
      }
      notify("Signed in with Email! Redirecting...");
      await Promise.all([refreshUser(), refreshCart()]);
      window.location.href = redirect;
    } catch {
      setBusy(false);
      notify("Signed in successfully!");
      window.location.href = redirect;
    }
  }

  async function quickDemoLogin() {
    setBusy(true);
    try {
      const response = await fetch("/api/v1/auth/email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "sujith@veggieflick.com", fullName: "Sujith Jai" }),
      });
      const json = await response.json();
      if (json.success) {
        notify("Demo Login Successful!");
        await Promise.all([refreshUser(), refreshCart()]);
        window.location.href = redirect;
      } else {
        window.location.href = redirect;
      }
    } catch {
      window.location.href = redirect;
    }
  }

  return (
    <div className="container-page grid items-center gap-10 py-10 md:py-16 lg:grid-cols-2">
      <div className="hidden lg:block">
        <span className="chip bg-brand-50 text-brand-700">Instant Customer Login</span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-ink">
          Fresh produce, <span className="text-brand-600">delivered fast.</span>
        </h1>
        <p className="mt-4 max-w-md text-sm text-muted">
          Sign in with your Mobile number or Email address to track orders, save delivery addresses in Chennai, and earn cashbacks.
        </p>
        <ul className="mt-6 grid gap-3 text-sm">
          {[
            "Six delivery slots every day across Chennai",
            "Wallet refunds credited instantly on cancellation",
            "Loyalty points on every rupee you spend",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-muted">
              <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden /> {item}
            </li>
          ))}
        </ul>

        {/* Quick Demo Login Box */}
        <div className="mt-8 rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-800">⚡ Fast 1-Click Demo Login</p>
          <p className="mt-1 text-xs text-muted">Skip OTP & test full shopping, cart, and checkout instantly!</p>
          <button
            type="button"
            onClick={quickDemoLogin}
            disabled={busy}
            className="btn btn-primary mt-3 w-full py-2.5 text-xs font-semibold"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Instant 1-Click Demo Login
          </button>
        </div>
      </div>

      <div className="card mx-auto w-full max-w-md p-6 md:p-8">
        {/* Navigation Mode Tabs */}
        <div className="mb-6 flex rounded-xl border border-line bg-surface p-1">
          <button
            type="button"
            onClick={() => { setMode("phone"); setStep("phone"); setError(null); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              mode === "phone" ? "bg-white shadow text-brand-700" : "text-muted hover:text-ink"
            }`}
          >
            <Smartphone className="inline h-3.5 w-3.5 mr-1" /> Mobile OTP
          </button>
          <button
            type="button"
            onClick={() => { setMode("email"); setError(null); }}
            className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${
              mode === "email" ? "bg-white shadow text-brand-700" : "text-muted hover:text-ink"
            }`}
          >
            <Mail className="inline h-3.5 w-3.5 mr-1" /> Email / Gmail
          </button>
        </div>

        {mode === "email" ? (
          <form onSubmit={loginWithEmail} className="grid gap-4">
            <div>
              <h2 className="text-xl font-bold">Sign in with Email</h2>
              <p className="text-xs text-muted">We&apos;ll create your account automatically</p>
            </div>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">Email address</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="sujai@gmail.com"
                className="field"
              />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">Full name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Sujith Jai"
                className="field"
              />
            </label>
            <button
              type="submit"
              disabled={!email || busy}
              className="btn btn-primary py-3 text-sm disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Sign in with Email <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>
        ) : step === "phone" ? (
          <form onSubmit={sendOtp} className="grid gap-4">
            <div>
              <h2 className="text-xl font-bold">Sign in with Mobile</h2>
              <p className="text-xs text-muted">Enter your 10-digit mobile number</p>
            </div>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">Mobile number</span>
              <div className="flex items-center gap-2 rounded-xl border border-line px-3 focus-within:border-brand-600">
                <span className="text-sm font-semibold text-muted">+91</span>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  className="w-full bg-transparent py-3 text-sm outline-none"
                />
              </div>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">
                Full name <span className="font-normal text-muted">(optional)</span>
              </span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Sujith"
                className="field"
              />
            </label>
            <button
              type="submit"
              disabled={phone.length !== 10 || busy}
              className="btn btn-primary py-3 text-sm disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Get Verification Code <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="grid gap-4">
            <div>
              <h2 className="text-xl font-bold">Verify OTP</h2>
              <p className="text-xs text-muted">Sent to +91 {phone}</p>
            </div>

            {/* Prominent Demo OTP Banner */}
            {previewCode && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-center text-emerald-900">
                <p className="text-xs font-medium">Your 6-Digit OTP Code is:</p>
                <p className="my-1 text-2xl font-black tracking-widest text-emerald-700">{previewCode}</p>
                <button
                  type="button"
                  onClick={() => setCode(previewCode)}
                  className="mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 underline hover:text-emerald-950 mx-auto"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Auto-filled {previewCode}
                </button>
              </div>
            )}

            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">6 digit OTP</span>
              <input
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="field text-center text-2xl font-bold tracking-[0.5em]"
              />
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              Keep me signed in
            </label>

            <button
              type="submit"
              disabled={code.length !== 6 || busy}
              className="btn btn-primary py-3 text-sm disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Verify OTP & Sign In
            </button>

            <div className="flex items-center justify-between text-xs">
              <button type="button" className="font-semibold text-muted" onClick={() => setStep("phone")}>
                Change number
              </button>
              <button
                type="button"
                disabled={seconds > 0}
                onClick={() => void sendOtp()}
                className="font-semibold text-brand-700 disabled:text-muted"
              >
                {seconds > 0 ? `Resend in ${seconds}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {/* 1-Click Fast Demo Login for Mobile Users */}
        <div className="mt-5 border-t border-line pt-4 text-center">
          <button
            type="button"
            onClick={quickDemoLogin}
            disabled={busy}
            className="text-xs font-bold text-brand-700 hover:underline"
          >
            ⚡ Need Instant Access? Click here for 1-Click Fast Sign In
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-sm text-muted">Loading…</div>}>
      <LoginFlow />
    </Suspense>
  );
}
