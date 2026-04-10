import { NextResponse } from "next/server";
import { getVehicleProfile } from "@/lib/rdw/service";
import { parsePlateOrThrow } from "@/lib/api/plate";
import { errorResponse } from "@/lib/api/errors";
import { localizeVehicleProfile } from "@/lib/i18n/vehicle";
import type { Locale } from "@/lib/i18n/messages";
import { buildFallbackVehicleAiReport, generateVehicleAiReport } from "@/lib/api/claude";

type Params = { params: { plate: string } };

function parseLocale(input: string | null): Locale {
  return input === "en" ? "en" : "nl";
}

export async function GET(request: Request, { params }: Params) {
  try {
    const url = new URL(request.url);
    const plate = parsePlateOrThrow(params.plate);
    const locale = parseLocale(url.searchParams.get("lang"));
    const includeAi = url.searchParams.get("include_ai") === "1";
    const profile = await getVehicleProfile(plate);
    const localized = localizeVehicleProfile(profile, locale) as Record<string, unknown>;

    if (!includeAi) {
      return NextResponse.json(localized);
    }

    try {
      const aiReport = await generateVehicleAiReport({
        plate,
        locale,
        vehicleData: localized
      });
      return NextResponse.json({
        ...localized,
        aiInsights: aiReport.insights,
        aiValuation: aiReport.valuation
      });
    } catch {
      const fallback = buildFallbackVehicleAiReport({ locale, vehicleData: localized });
      return NextResponse.json({
        ...localized,
        aiInsights: fallback.insights,
        aiValuation: fallback.valuation
      });
    }
  } catch (error) {
    return errorResponse(error, "Unknown lookup error.");
  }
}
