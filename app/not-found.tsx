"use client";

import Link from "next/link";
import { Search, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function NotFoundPlate() {
  const { t } = useI18n();
  return (
    <span
      className="relative inline-flex items-center overflow-hidden rounded-lg border-2 border-slate-700 animate-float font-display font-extrabold uppercase tracking-[0.18em] text-slate-900 shadow-lg"
      style={{ background: "#fbbf24", padding: "0.4rem 1rem 0.4rem 2.8rem", fontSize: "1.25rem" }}
    >
      <span
        className="absolute left-0 top-0 flex h-full w-9 flex-col items-center justify-center gap-0.5 bg-blue-700 text-white"
        aria-hidden="true"
        style={{ width: "2.2rem" }}
      >
        <span className="text-yellow-300" style={{ fontSize: "8px", lineHeight: 1 }}>★</span>
        <span className="font-black" style={{ fontSize: "9px", lineHeight: 1 }}>NL</span>
      </span>
      {t("notFound.plate")}
    </span>
  );
}

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-white px-6 text-center">
      <div className="relative mb-8 select-none">
        <p className="font-display text-[9rem] font-black leading-none tracking-tighter text-slate-100">
          404
        </p>
        <div className="absolute inset-0 flex items-center justify-center">
          <NotFoundPlate />
        </div>
      </div>

      <h1 className="font-display text-2xl font-bold text-slate-900 md:text-3xl">{t("notFound.title")}</h1>
      <p className="mx-auto mt-3 max-w-sm text-slate-500">
        {t("notFound.desc")}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-brand-sm transition hover:bg-brand-700"
        >
          <Search className="h-4 w-4" />
          {t("notFound.search")}
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          <Home className="h-4 w-4" />
          {t("notFound.home")}
        </Link>
      </div>
    </div>
  );
}
