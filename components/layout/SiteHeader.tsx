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
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <ShieldCheck className="h-5 w-5 text-brand-600" />
          AutoCheck
        </Link>
        <nav className="hidden items-center gap-4 md:flex" aria-label="Main navigation">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-brand-600/10 text-brand-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOpen((prev) => !prev)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 md:hidden"
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden items-center gap-2 md:flex">
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
        </div>
      </div>
      {open && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-20 bg-brand-50/90 backdrop-blur-sm">
            <div className="flex h-20 items-center justify-between border-b border-white/60 px-6">
              <Link href="/" className="flex items-center gap-2 text-xl font-semibold text-slate-900">
                <ShieldCheck className="h-6 w-6 text-brand-600" />
                AutoCheck
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex flex-col gap-3 px-6 py-8">
              {navLinks.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                      active
                        ? "bg-brand-600/10 text-brand-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-white bg-brand-600"
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
