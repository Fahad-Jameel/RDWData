import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectMongo } from "@/lib/db/mongodb";
import { USER_SESSION_COOKIE, verifyUserSession } from "@/lib/user/auth";
import { PlateWatchModel } from "@/models/PlateWatch";
import { parsePlateOrThrow } from "@/lib/api/plate";
import { getVehicleProfile } from "@/lib/rdw/service";

export const runtime = "nodejs";

function requireUser() {
  const token = cookies().get(USER_SESSION_COOKIE)?.value;
  const session = verifyUserSession(token);
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

function normalizeScore(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? Number(num.toFixed(1)) : null;
}

function buildSnapshot(profile: Awaited<ReturnType<typeof getVehicleProfile>>) {
  return {
    hasOpenRecall: Boolean(profile.vehicle.hasOpenRecall),
    apkExpiryDate: profile.vehicle.apkExpiryDate ?? null,
    maintenanceRiskScore: normalizeScore(profile.enriched?.maintenanceRiskScore ?? null)
  };
}

export async function GET(request: Request) {
  try {
    const session = requireUser();
    await connectMongo();
    const url = new URL(request.url);
    const plate = url.searchParams.get("plate");
    if (plate) {
      const normalizedPlate = parsePlateOrThrow(plate);
      const item = await PlateWatchModel.findOne({ userId: session.sub, plate: normalizedPlate }).lean();
      return NextResponse.json({ item });
    }
    const items = await PlateWatchModel.find({ userId: session.sub }).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Unable to load watch mode data." }, { status: 500 });
  }
}

type Body = {
  plate?: string;
  title?: string;
  action?: "follow" | "unfollow" | "check";
};

export async function POST(request: Request) {
  try {
    const session = requireUser();
    const body = (await request.json()) as Body;
    const action = body.action ?? "follow";
    const plate = parsePlateOrThrow(String(body.plate ?? ""));
    await connectMongo();

    if (action === "unfollow") {
      await PlateWatchModel.deleteOne({ userId: session.sub, plate });
      return NextResponse.json({ ok: true, action });
    }

    const profile = await getVehicleProfile(plate);
    const snapshot = buildSnapshot(profile);
    const currentRisk = snapshot.maintenanceRiskScore ?? 0;

    if (action === "follow") {
      await PlateWatchModel.updateOne(
        { userId: session.sub, plate },
        {
          $set: {
            title: body.title ? String(body.title) : undefined,
            snapshot,
            lastCheckedAt: new Date()
          },
          $setOnInsert: {
            userId: session.sub,
            plate,
            alerts: []
          }
        },
        { upsert: true }
      );
      return NextResponse.json({ ok: true, action, snapshot });
    }

    const existing = await PlateWatchModel.findOne({ userId: session.sub, plate });
    if (!existing) {
      return NextResponse.json({ error: "Plate is not followed yet." }, { status: 404 });
    }

    const previous = existing.snapshot;
    const alerts: Array<{ type: "RECALL_CHANGED" | "APK_CHANGED" | "RISK_CHANGED"; message: string; createdAt: Date }> = [];

    if (previous.hasOpenRecall !== snapshot.hasOpenRecall) {
      alerts.push({
        type: "RECALL_CHANGED",
        message: snapshot.hasOpenRecall
          ? "Recall status changed: open recall detected."
          : "Recall status changed: no open recall now.",
        createdAt: new Date()
      });
    }
    if ((previous.apkExpiryDate ?? null) !== (snapshot.apkExpiryDate ?? null)) {
      alerts.push({
        type: "APK_CHANGED",
        message: `APK status changed: ${previous.apkExpiryDate ?? "unknown"} -> ${snapshot.apkExpiryDate ?? "unknown"}.`,
        createdAt: new Date()
      });
    }
    const prevRisk = normalizeScore(previous.maintenanceRiskScore);
    if (prevRisk !== null && Math.abs(currentRisk - prevRisk) >= 0.5) {
      alerts.push({
        type: "RISK_CHANGED",
        message: `Maintenance risk shifted from ${prevRisk.toFixed(1)} to ${currentRisk.toFixed(1)}.`,
        createdAt: new Date()
      });
    }

    existing.snapshot = snapshot;
    existing.lastCheckedAt = new Date();
    if (alerts.length > 0) {
      existing.alerts = [...alerts, ...existing.alerts].slice(0, 100);
    }
    await existing.save();

    return NextResponse.json({ ok: true, action, snapshot, alerts });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Unable to update watch mode." }, { status: 500 });
  }
}
