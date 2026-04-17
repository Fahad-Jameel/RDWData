"use client";

import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: () => Promise<void> | void;
};

export function UserAuthModal({ isOpen, onClose, onAuthenticated }: Props) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/user/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Authentication failed.");
      }
      await onAuthenticated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-slate-900">{mode === "login" ? "Login to your account" : "Create account"}</h3>
        <p className="mt-1 text-sm text-slate-500">Save vehicles and keep your report history in dashboard.</p>
        <div className="mt-4 space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={submit}
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
          <button type="button" className="text-sm text-slate-600" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="ml-auto text-sm text-brand-600"
            onClick={() => setMode((prev) => (prev === "login" ? "signup" : "login"))}
          >
            {mode === "login" ? "Need an account? Sign up" : "Already have account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
