"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

function detectSection(pathname: string): string {
  if (pathname === "/") return "landing";
  if (pathname.startsWith("/search/")) {
    if (pathname.endsWith("/risk-overview")) return "risk-overview";
    if (pathname.endsWith("/market-analysis")) return "market-analysis";
    if (pathname.endsWith("/vehicle-comparison")) return "vehicle-comparison";
    if (pathname.endsWith("/damage-history")) return "damage-history";
    if (pathname.endsWith("/technical-specs")) return "technical-specs";
    if (pathname.endsWith("/inspection-timeline")) return "inspection-timeline";
    if (pathname.endsWith("/ownership-history")) return "ownership-history";
    if (pathname.endsWith("/mileage-history")) return "mileage-history";
    if (pathname.endsWith("/negotiation-copilot")) return "negotiation-copilot";
    if (pathname.endsWith("/apk-failure-intelligence")) return "apk-failure-intelligence";
    if (pathname.endsWith("/post-purchase-watch")) return "post-purchase-watch";
    return "search-overview";
  }
  if (pathname.startsWith("/pricing")) return "pricing";
  if (pathname.startsWith("/account")) return "account";
  if (pathname.startsWith("/p/")) return "cms-page";
  if (pathname.startsWith("/privacy-policy")) return "privacy-policy";
  if (pathname.startsWith("/terms-and-conditions")) return "terms-and-conditions";
  return pathname.replace(/^\//, "") || "other";
}

async function pushActivity(path: string, section: string, durationMs: number) {
  if (!path || durationMs < 500) return;
  const payload = JSON.stringify({ path, section, durationMs });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/analytics/section-time", blob);
      return;
    }
  } catch {
    // Fall back to fetch.
  }
  void fetch("/api/analytics/section-time", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true
  });
}

export function ActivityTracker() {
  const pathname = usePathname();
  const currentPathRef = useRef(pathname);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const previousPath = currentPathRef.current;
    const now = Date.now();
    if (previousPath && previousPath !== pathname) {
      const durationMs = now - startedAtRef.current;
      void pushActivity(previousPath, detectSection(previousPath), durationMs);
    }
    currentPathRef.current = pathname;
    startedAtRef.current = now;
  }, [pathname]);

  useEffect(() => {
    const onHidden = () => {
      if (document.visibilityState !== "hidden") return;
      const path = currentPathRef.current;
      if (!path || path.startsWith("/admin")) return;
      const durationMs = Date.now() - startedAtRef.current;
      void pushActivity(path, detectSection(path), durationMs);
      startedAtRef.current = Date.now();
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => document.removeEventListener("visibilitychange", onHidden);
  }, []);

  return null;
}
