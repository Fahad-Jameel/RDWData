import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { headers, cookies } from "next/headers";
import { connectMongo } from "@/lib/db/mongodb";
import { SectionActivityModel } from "@/models/SectionActivity";
import { USER_SESSION_COOKIE, verifyUserSession } from "@/lib/user/auth";

export const runtime = "nodejs";

type Body = {
  path?: string;
  section?: string;
  durationMs?: number;
};

function getIpHash(): string {
  const forwarded = headers().get("x-forwarded-for") ?? "";
  const ip = forwarded.split(",")[0]?.trim() || headers().get("x-real-ip") || "unknown";
  return crypto.createHash("sha256").update(ip).digest("hex");
}

function normalizeSection(pathname: string): string {
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

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Body;
    const path = String(body.path ?? "").trim();
    const durationMs = Number(body.durationMs ?? 0);
    if (!path || !Number.isFinite(durationMs) || durationMs <= 0) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const clampedDurationMs = Math.max(500, Math.min(Math.round(durationMs), 30 * 60 * 1000));
    const token = cookies().get(USER_SESSION_COOKIE)?.value;
    const session = verifyUserSession(token);

    await connectMongo();
    await SectionActivityModel.create({
      userId: session?.sub,
      path,
      section: String(body.section ?? normalizeSection(path)),
      durationMs: clampedDurationMs,
      ipHash: getIpHash()
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to track section activity.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
