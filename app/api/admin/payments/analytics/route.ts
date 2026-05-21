import { NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin/session";
import { connectMongo } from "@/lib/db/mongodb";
import { PlatePaymentModel } from "@/models/PlatePayment";
import { PaymentOrderModel } from "@/models/PaymentOrder";

export const runtime = "nodejs";

type RangeKey = "7d" | "30d" | "all";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const page = parsePositiveInt(url.searchParams.get("page"), 1, 1000);
  const limit = parsePositiveInt(url.searchParams.get("limit"), 20, 100);

  await connectMongo();

  const [totalOrders, completedOrders, paymentsRaw, paymentsTotal, topPromoCodes, revenueRaw, discountedCount] = await Promise.all([
    PaymentOrderModel.countDocuments(matchDate),
    PlatePaymentModel.countDocuments({ ...matchDate, status: "COMPLETED", provider: "paypal" }),
    PlatePaymentModel.find({ ...matchDate, status: "COMPLETED", provider: "paypal" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PlatePaymentModel.countDocuments({ ...matchDate, status: "COMPLETED", provider: "paypal" }),
    PlatePaymentModel.aggregate([
      { $match: { ...matchDate, status: "COMPLETED", provider: "paypal", promoCode: { $exists: true, $ne: "" } } },
      { $group: { _id: "$promoCode", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    PlatePaymentModel.aggregate([
      { $match: { ...matchDate, status: "COMPLETED", provider: "paypal" } },
      { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
    ]),
    PlatePaymentModel.countDocuments({
      ...matchDate,
      status: "COMPLETED",
      provider: "paypal",
      discountType: { $exists: true, $ne: null }
    })
  ]);

  const totalRevenue = Number((revenueRaw as Array<{ total: number }>)[0]?.total ?? 0);
  const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  return NextResponse.json({
    range: safeRange,
    summary: {
      totalOrders,
      completedOrders,
      conversionRate: Number(conversionRate.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      discountedCount
    },
    topPromoCodes: (topPromoCodes as Array<{ _id: string; count: number }>).map((row) => ({
      code: row._id,
      count: row.count
    })),
    transactions: paymentsRaw.map((row) => ({
      id: String(row._id),
      plate: row.plate,
      email: row.email ?? null,
      amount: row.amount,
      currency: row.currency,
      promoCode: row.promoCode ?? null,
      discountType: row.discountType ?? null,
      discountValue: row.discountValue ?? null,
      createdAt: row.createdAt
    })),
    pagination: {
      page,
      limit,
      total: paymentsTotal,
      hasMore: page * limit < paymentsTotal
    }
  });
}

