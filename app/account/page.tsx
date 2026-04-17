"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CarFront, FileText, LogOut, User } from "lucide-react";

type SavedVehicle = { _id: string; plate: string; title?: string; mileageInput?: number; createdAt: string };
type ReportItem = { _id: string; plate: string; locale: "nl" | "en"; channel: "download" | "email"; createdAt: string };

export default function AccountPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const session = await fetch("/api/user/session", { cache: "no-store" });
        const sessionPayload = (await session.json()) as { authenticated?: boolean; email?: string };
        if (!session.ok || !sessionPayload.authenticated) {
          if (active) {
            setEmail(null);
            setLoading(false);
          }
          return;
        }
        if (active) setEmail(sessionPayload.email ?? null);
        const [savedResponse, reportResponse] = await Promise.all([
          fetch("/api/user/saved-vehicles", { cache: "no-store" }),
          fetch("/api/user/reports", { cache: "no-store" })
        ]);
        if (savedResponse.ok && active) {
          const payload = (await savedResponse.json()) as { items?: SavedVehicle[] };
          setSavedVehicles(payload.items ?? []);
        }
        if (reportResponse.ok && active) {
          const payload = (await reportResponse.json()) as { items?: ReportItem[] };
          setReports(payload.items ?? []);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
    await fetch("/api/user/logout", { method: "POST" });
    window.location.reload();
  };

  if (loading) {
    return <div className="mx-auto max-w-5xl px-6 py-12 text-slate-500">Loading dashboard...</div>;
  }

  if (!email) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <User className="mx-auto h-10 w-10 text-brand-600" />
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Sign in to your account</h1>
          <p className="mt-2 text-slate-500">Login from save-vehicle flow and your dashboard will appear here.</p>
          <Link href="/" className="mt-5 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">My Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">{email}</p>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-slate-900">
            <CarFront className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold">Saved Vehicles</h2>
          </div>
          <div className="space-y-3">
            {savedVehicles.length === 0 ? (
              <p className="text-sm text-slate-500">No saved vehicles yet.</p>
            ) : (
              savedVehicles.map((item) => (
                <Link
                  key={item._id}
                  href={`/search/${item.plate}${typeof item.mileageInput === "number" ? `?mileage=${item.mileageInput}` : ""}`}
                  className="block rounded-xl border border-slate-200 px-4 py-3 hover:border-brand-300"
                >
                  <div className="font-semibold text-slate-900">{item.title || item.plate}</div>
                  <div className="text-xs text-slate-500">
                    Plate: {item.plate} {typeof item.mileageInput === "number" ? `• Mileage: ${item.mileageInput.toLocaleString("nl-NL")} km` : ""}
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2 text-slate-900">
            <FileText className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-bold">Downloaded Reports</h2>
          </div>
          <div className="space-y-3">
            {reports.length === 0 ? (
              <p className="text-sm text-slate-500">No report history yet.</p>
            ) : (
              reports.map((item) => (
                <div key={item._id} className="rounded-xl border border-slate-200 px-4 py-3">
                  <div className="font-semibold text-slate-900">{item.plate}</div>
                  <div className="text-xs text-slate-500">
                    {item.channel === "download" ? "Downloaded" : "Sent by email"} • {new Date(item.createdAt).toLocaleString("nl-NL")} • {item.locale.toUpperCase()}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
