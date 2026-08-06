"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Carrot, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/providers";

export default function AdminLoginPage() {
  const router = useRouter();
  const { refreshUser } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/v1/auth/admin-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, totp: totp || undefined }),
    });
    const json = await response.json();
    setBusy(false);
    if (!json.success) {
      setError(json.error?.message ?? "Sign in failed");
      return;
    }
    await refreshUser();
    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-12">
      <div className="w-full max-w-md rounded-[20px] bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <Carrot size={22} strokeWidth={1.7} />
          </span>
          <div>
            <h1 className="text-xl font-bold">VeggieFlick staff portal</h1>
            <p className="text-xs text-muted">Role-based access · audit logged · 2FA ready</p>
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-4">
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold">Work email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@veggieflick.in"
              className="field"
              autoComplete="username"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="field"
              autoComplete="current-password"
            />
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-semibold">
              2FA code <span className="font-normal text-muted">(if enabled)</span>
            </span>
            <input
              inputMode="numeric"
              maxLength={6}
              value={totp}
              onChange={(event) => setTotp(event.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              className="field"
            />
          </label>

          <button type="submit" disabled={busy} className="btn btn-primary py-3 text-sm disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />}
            Sign in securely
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-6 rounded-xl bg-surface p-3 text-xs text-muted">
          <p className="flex items-center gap-1.5 font-semibold text-ink">
            <ShieldCheck className="h-3.5 w-3.5 text-brand-600" aria-hidden /> Seeded demo credentials
          </p>
          <p className="mt-1">Super admin · admin@veggieflick.in / Admin@12345</p>
          <p>Manager · manager@veggieflick.in / Manager@12345</p>
          <p>Warehouse · warehouse@veggieflick.in / Warehouse@12345</p>
        </div>
      </div>
    </div>
  );
}
