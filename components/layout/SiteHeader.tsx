"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ShieldCheck, Menu, X } from "lucide-react";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#sample", label: "Sample Report" },
  { href: "#pricing", label: "Pricing" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-lg shadow-sm relative">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-10">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-wide text-slate-900">
          <ShieldCheck className="h-6 w-6 text-brand-600" />
          AutoCheck
        </Link>

        <nav className="hidden items-center gap-4 md:flex" aria-label="Primary">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-brand-600/10 text-brand-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900"
            >
              Log in
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-xl shadow-brand-500/30"
            >
              Check Vehicle
            </Link>
          </div>
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 md:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden">
          <div className="absolute inset-x-4 top-full z-40 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl">
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">Menu</span>

            <div className="mt-4 flex flex-col gap-2">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold",
                    pathname === href ? "bg-brand-50 text-brand-600" : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Log in
              </Link>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Check Vehicle
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
