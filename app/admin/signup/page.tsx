"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch("/api/admin/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Signup failed.");
      setLoading(false);
      return;
    }
    router.replace("/admin");
  };

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-6 py-12">
      <form onSubmit={submit} className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Admin Signup</h1>
        <p className="mb-6 text-sm text-slate-500">Create admin account for site controls.</p>

        <label className="mb-4 block text-sm">
          <span className="mb-1 block text-slate-600">Email</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="mb-4 block text-sm">
          <span className="mb-1 block text-slate-600">Password (min 8 chars)</span>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create admin"}
        </button>

        <p className="mt-4 text-sm text-slate-500">
          Already have admin? <Link href="/admin/login" className="font-medium text-brand-700">Sign in</Link>
        </p>
      </form>
    </div>
  );
}

