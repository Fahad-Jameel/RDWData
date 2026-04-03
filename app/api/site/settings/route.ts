import { NextResponse } from "next/server";
import { getSiteSettings } from "@/lib/site-settings/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load site settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

