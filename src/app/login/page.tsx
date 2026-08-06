"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ArrowRight, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import { useApp } from "@/components/providers";

function LoginFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/account";
  const { refreshUser, refreshCart, user, notify } = useApp();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (user) router.replace(redirect);
  }, [user, redirect, router]);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  async function sendOtp(event?: React.FormEvent) {
    event?.preventDefault();
    setBusy(true);
    setError(null);
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
    setStep("otp");
    setSeconds(30);
    setPreview(json.data.otpPreview ?? null);
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/v1/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, fullName: fullName || undefined, rememberMe: remember }),
    });
    const json = await response.json();
    setBusy(false);
    if (!json.success) {
      setError(json.error?.message ?? "Verification failed");
      return;
    }
    await Promise.all([refreshUser(), refreshCart()]);
    notify(json.data.isNewCustomer ? "Welcome to VeggieFlick!" : "Signed in successfully");
    router.replace(redirect);
  }

  return (
    <div className="container-page grid items-center gap-10 py-10 md:py-16 lg:grid-cols-2">
      <div className="hidden lg:block">
        <span className="chip bg-brand-50 text-brand-700">Secure OTP login</span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">
          Fresh produce, <span className="text-brand-600">one tap away.</span>
        </h1>
        <p className="mt-4 max-w-md text-sm text-muted">
          Sign in with your mobile number to track orders, save addresses, earn loyalty points and check out
          faster. We never store your password — only a one-time code.
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
      </div>

      <div className="card mx-auto w-full max-w-md p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Smartphone className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-xl font-bold">{step === "phone" ? "Sign in or create account" : "Verify OTP"}</h2>
            <p className="text-xs text-muted">
              {step === "phone" ? "We'll text a 6 digit code" : `Sent to +91 ${phone}`}
            </p>
          </div>
        </div>

        {step === "phone" ? (
          <form onSubmit={sendOtp} className="grid gap-4">
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
                Full name <span className="font-normal text-muted">(new customers)</span>
              </span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Priya Narayanan"
                className="field"
              />
            </label>
            <button
              type="submit"
              disabled={phone.length !== 10 || busy}
              className="btn btn-primary py-3 text-sm disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Send OTP <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="grid gap-4">
            <label className="grid gap-1.5">
              <span className="text-sm font-semibold">6 digit OTP</span>
              <input
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="field text-center text-2xl font-bold tracking-[0.5em]"
              />
            </label>

            {preview && (
              <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
                SMS gateway is not configured in this environment. Your code is{" "}
                <span className="font-bold">{preview}</span>.
              </p>
            )}

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
                className="h-4 w-4 accent-brand-600"
              />
              Keep me signed in for 30 days
            </label>

            <button
              type="submit"
              disabled={code.length !== 6 || busy}
              className="btn btn-primary py-3 text-sm disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              Verify & continue
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

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-muted">
          By continuing you agree to our{" "}
          <Link href="/legal/terms" className="underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/legal/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="mt-3 text-center text-xs text-muted">
          VeggieFlick staff?{" "}
          <Link href="/admin/login" className="font-semibold text-brand-700 underline">
            Use the staff portal
          </Link>
        </p>
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
