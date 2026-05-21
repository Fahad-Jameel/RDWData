import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import { getAdminSessionFromCookies } from "@/lib/admin/session";
import { SearchLogModel } from "@/models/SearchLog";
import { SectionActivityModel } from "@/models/SectionActivity";

export const runtime = "nodejs";

type RangeKey = "7d" | "30d" | "all";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getRangeStart(range: RangeKey): Date | null {
  if (range === "all") return null;
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (range === "7d" ? 6 : 29));
  return start;
}

function parsePositiveInt(raw: string | null, fallback: number, max: number): number {
  const value = Number(raw ?? "");
  if (!Number.isFinite(value) || value < 1) return fallback;
  return Math.min(Math.floor(value), max);
}

export async function GET(request: Request) {
  const session = getAdminSessionFromCookies();
  if (!session) return unauthorized();

  const url = new URL(request.url);
  const range = (url.searchParams.get("range") ?? "7d") as RangeKey;
  const safeRange: RangeKey = range === "30d" || range === "all" ? range : "7d";
  const start = getRangeStart(safeRange);
  const matchDate = start ? { createdAt: { $gte: start } } : {};

  const topPage = parsePositiveInt(url.searchParams.get("topPage"), 1, 1000);
  const topLimit = parsePositiveInt(url.searchParams.get("topLimit"), 20, 100);
  const recentPage = parsePositiveInt(url.searchParams.get("recentPage"), 1, 10000);
  const recentLimit = parsePositiveInt(url.searchParams.get("recentLimit"), 30, 100);
  const sectionPage = parsePositiveInt(url.searchParams.get("sectionPage"), 1, 1000);
  const sectionLimit = parsePositiveInt(url.searchParams.get("sectionLimit"), 20, 100);
  const heatmapPage = parsePositiveInt(url.searchParams.get("heatmapPage"), 1, 10000);
  const heatmapLimit = parsePositiveInt(url.searchParams.get("heatmapLimit"), 40, 150);

  await connectMongo();

  const chartDays = safeRange === "all" ? 30 : safeRange === "30d" ? 30 : 7;
  const chartStart = new Date();
  chartStart.setDate(chartStart.getDate() - (chartDays - 1));

  const [searchesByDayRaw, topPlatesRaw, topCountRaw, recentRaw, recentCount, sectionTotalsRaw, sectionCountRaw, heatmapRaw, heatmapCountRaw] = await Promise.all([
    SearchLogModel.aggregate([
      { $match: { createdAt: { $gte: chartStart } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    SearchLogModel.aggregate([
      { $match: matchDate },
      { $group: { _id: "$plate", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $skip: (topPage - 1) * topLimit },
      { $limit: topLimit }
    ]),
    SearchLogModel.aggregate([
      { $match: matchDate },
      { $group: { _id: "$plate" } },
      { $count: "total" }
    ]),
    SearchLogModel.find(matchDate, { plate: 1, userId: 1, resultFrom: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .skip((recentPage - 1) * recentLimit)
      .limit(recentLimit)
      .lean(),
    SearchLogModel.countDocuments(matchDate),
    SectionActivityModel.aggregate([
      { $match: matchDate },
      { $group: { _id: "$section", totalMs: { $sum: "$durationMs" }, views: { $sum: 1 } } },
      { $sort: { totalMs: -1 } },
      { $skip: (sectionPage - 1) * sectionLimit },
      { $limit: sectionLimit }
    ]),
    SectionActivityModel.aggregate([
      { $match: matchDate },
      { $group: { _id: "$section" } },
      { $count: "total" }
    ]),
    SectionActivityModel.aggregate([
      { $match: matchDate },
      {
        $group: {
          _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, section: "$section" },
          totalMs: { $sum: "$durationMs" },
          views: { $sum: 1 }
        }
      },
      { $sort: { "_id.day": -1, totalMs: -1 } },
      { $skip: (heatmapPage - 1) * heatmapLimit },
      { $limit: heatmapLimit }
    ]),
    SectionActivityModel.aggregate([
      { $match: matchDate },
      { $group: { _id: { day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, section: "$section" } } },
      { $count: "total" }
    ])
  ]);

  const dayKeys: string[] = [];
  for (let i = chartDays - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dayKeys.push(toDayKey(d));
  }
  const searchesMap = new Map<string, number>(
    (searchesByDayRaw as Array<{ _id: string; count: number }>).map((x) => [x._id, x.count])
  );
  const searchesByDay = dayKeys.map((day) => ({ day, count: searchesMap.get(day) ?? 0 }));

  const topTotal = Number((topCountRaw as Array<{ total: number }>)[0]?.total ?? 0);
  const sectionTotal = Number((sectionCountRaw as Array<{ total: number }>)[0]?.total ?? 0);
  const heatmapTotal = Number((heatmapCountRaw as Array<{ total: number }>)[0]?.total ?? 0);

  return NextResponse.json({
    range: safeRange,
    searchesByDay,
    topPlates: (topPlatesRaw as Array<{ _id: string; count: number }>).map((row) => ({ plate: row._id, count: row.count })),
    recentSearches: recentRaw.map((row) => ({
      plate: row.plate,
      userId: row.userId ?? null,
      resultFrom: row.resultFrom,
      createdAt: row.createdAt
    })),
    sectionTotals: (sectionTotalsRaw as Array<{ _id: string; totalMs: number; views: number }>).map((row) => ({
      section: row._id,
      totalMs: row.totalMs,
      views: row.views
    })),
    sectionHeatmap: (heatmapRaw as Array<{ _id: { day: string; section: string }; totalMs: number; views: number }>).map((row) => ({
      day: row._id.day,
      section: row._id.section,
      totalMs: row.totalMs,
      views: row.views
    })),
    pagination: {
      top: { page: topPage, limit: topLimit, total: topTotal, hasMore: topPage * topLimit < topTotal },
      recent: { page: recentPage, limit: recentLimit, total: recentCount, hasMore: recentPage * recentLimit < recentCount },
      section: { page: sectionPage, limit: sectionLimit, total: sectionTotal, hasMore: sectionPage * sectionLimit < sectionTotal },
      heatmap: { page: heatmapPage, limit: heatmapLimit, total: heatmapTotal, hasMore: heatmapPage * heatmapLimit < heatmapTotal }
    }
  });
}
