"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export function NewsletterForm({ variant = "compact" }: { variant?: "compact" | "hero" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    const response = await fetch("/api/v1/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const json = await response.json();
    if (json?.success) {
      setStatus("done");
      setMessage("You are subscribed. Watch out for Friday's fresh drop!");
      setEmail("");
    } else {
      setStatus("error");
      setMessage(json?.error?.message ?? "Could not subscribe right now.");
    }
  }

  return (
    <form onSubmit={submit} className="w-full">
      <div className={variant === "hero" ? "flex flex-col gap-2 sm:flex-row" : "flex gap-2"}>
        <label className="flex-1">
          <span className="sr-only">Email address</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="field"
          />
        </label>
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn btn-primary px-4 py-2.5 text-sm disabled:opacity-60"
        >
          {status === "loading" ? "Joining…" : "Subscribe"}
          <Send className="h-4 w-4" aria-hidden />
        </button>
      </div>
      {message && (
        <p
          role="status"
          className={`mt-2 text-xs font-medium ${status === "error" ? "text-red-600" : "text-brand-700"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
