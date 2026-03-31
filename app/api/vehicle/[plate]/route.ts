import { NextResponse } from "next/server";
import { getVehicleProfile } from "@/lib/rdw/service";
import { parsePlateOrThrow } from "@/lib/api/plate";
import { errorResponse } from "@/lib/api/errors";
import { localizeVehicleProfile } from "@/lib/i18n/vehicle";
import type { Locale } from "@/lib/i18n/messages";

type Params = { params: { plate: string } };

function parseLocale(input: string | null): Locale {
  return input === "en" ? "en" : "nl";
}

export async function GET(request: Request, { params }: Params) {
  try {
    const plate = parsePlateOrThrow(params.plate);
    const locale = parseLocale(new URL(request.url).searchParams.get("lang"));
    const profile = await getVehicleProfile(plate);
    return NextResponse.json(localizeVehicleProfile(profile, locale));
  } catch (error) {
    return errorResponse(error, "Unknown lookup error.");
  }
}
