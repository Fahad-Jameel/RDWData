import { NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin/session";
import { getSiteSettings, upsertSiteSettings } from "@/lib/site-settings/service";
import type { PublicSiteSettings } from "@/lib/site-settings/defaults";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  const session = getAdminSessionFromCookies();
  if (!session) return unauthorized();

  const settings = await getSiteSettings();
  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const session = getAdminSessionFromCookies();
  if (!session) return unauthorized();

  try {
    const body = (await request.json()) as Partial<PublicSiteSettings>;
    const updated = await upsertSiteSettings(body);
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

