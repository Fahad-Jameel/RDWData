"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, Save, Scale } from "lucide-react";

type SessionResponse = {
  authenticated: boolean;
  admin?: { id: string; email: string };
};

type CmsPage = {
  _id: string;
  title: string;
  slug: string;
  content: string;
  published: boolean;
  showInHeader: boolean;
  showInFooter: boolean;
};

function TextInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  rows,
  onChange
}: {
  label: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <textarea
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        rows={rows ?? 3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition hover:border-slate-300 hover:bg-slate-100">
      <span className="font-medium text-slate-700">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  );
}

export default function AdminLegalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminEmail, setAdminEmail] = useState("");
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [activeLegalTab, setActiveLegalTab] = useState<"privacy-policy" | "terms-and-conditions">("privacy-policy");

  useEffect(() => {
    let active = true;
    const load = async () => {
      const sessionRes = await fetch("/api/admin/session", { cache: "no-store" });
      if (!sessionRes.ok) {
        router.replace("/admin/login");
        return;
      }
      const session = (await sessionRes.json()) as SessionResponse;
      if (!session.authenticated || !session.admin) {
        router.replace("/admin/login");
        return;
      }

      const pagesRes = await fetch("/api/admin/pages", { cache: "no-store" });
      if (!pagesRes.ok) {
        router.replace("/admin/login");
        return;
      }

      if (!active) return;
      setAdminEmail(session.admin.email);
      setPages((await pagesRes.json()) as CmsPage[]);
      setLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [router]);

  const activeLegalPage = pages.find((page) => page.slug === activeLegalTab);
  const activeLegalRoute = activeLegalTab === "privacy-policy" ? "/privacy-policy" : "/terms-and-conditions";

  const saveLegalPage = async () => {
    if (!activeLegalPage) return;
    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/admin/pages/${activeLegalPage._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activeLegalPage)
    });
    if (!response.ok) {
      setMessage("Failed to save legal page.");
      setSaving(false);
      return;
    }
    setMessage("Legal page saved successfully.");
    setSaving(false);
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  if (loading) {
    return <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-slate-500">Loading legal editor...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100">
      <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
              <Scale className="h-3.5 w-3.5" /> Legal Editor
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Legal Pages</h1>
            <p className="text-sm text-slate-500">Signed in as {adminEmail}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              <ArrowLeft className="h-4 w-4" /> Admin
            </Link>
            <button
              type="button"
              onClick={() => void saveLegalPage()}
              disabled={saving || !activeLegalPage}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 py-6">
        {message ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeLegalTab === "privacy-policy"
                ? "bg-brand-600 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => setActiveLegalTab("privacy-policy")}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeLegalTab === "terms-and-conditions"
                ? "bg-brand-600 text-white"
                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
            onClick={() => setActiveLegalTab("terms-and-conditions")}
          >
            Terms & Conditions
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!activeLegalPage ? (
            <div className="text-sm text-slate-500">Loading legal page...</div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="text-base font-semibold text-slate-900">{activeLegalPage.title}</div>
                <Link href={activeLegalRoute} target="_blank" className="text-xs font-medium text-brand-700 underline">
                  Open page
                </Link>
              </div>
              <div className="space-y-3">
                <TextInput
                  label="Title"
                  value={activeLegalPage.title}
                  onChange={(value) =>
                    setPages((prev) =>
                      prev.map((page) => (page._id === activeLegalPage._id ? { ...page, title: value } : page))
                    )
                  }
                />
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Slug</span>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                    {activeLegalPage.slug}
                  </div>
                </label>
                <TextArea
                  label="Content"
                  rows={24}
                  value={activeLegalPage.content}
                  onChange={(value) =>
                    setPages((prev) =>
                      prev.map((page) => (page._id === activeLegalPage._id ? { ...page, content: value } : page))
                    )
                  }
                />
                <div className="grid gap-2 md:grid-cols-3">
                  <Toggle
                    label="Published"
                    checked={activeLegalPage.published}
                    onChange={(value) =>
                      setPages((prev) =>
                        prev.map((page) => (page._id === activeLegalPage._id ? { ...page, published: value } : page))
                      )
                    }
                  />
                  <Toggle
                    label="Header"
                    checked={activeLegalPage.showInHeader}
                    onChange={(value) =>
                      setPages((prev) =>
                        prev.map((page) => (page._id === activeLegalPage._id ? { ...page, showInHeader: value } : page))
                      )
                    }
                  />
                  <Toggle
                    label="Footer"
                    checked={activeLegalPage.showInFooter}
                    onChange={(value) =>
                      setPages((prev) =>
                        prev.map((page) => (page._id === activeLegalPage._id ? { ...page, showInFooter: value } : page))
                      )
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
