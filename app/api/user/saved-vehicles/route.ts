import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectMongo } from "@/lib/db/mongodb";
import { USER_SESSION_COOKIE, verifyUserSession } from "@/lib/user/auth";
import { SavedVehicleModel } from "@/models/SavedVehicle";

export const runtime = "nodejs";

function requireSession() {
  const token = cookies().get(USER_SESSION_COOKIE)?.value;
  const session = verifyUserSession(token);
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function GET() {
  try {
    const session = requireSession();
    await connectMongo();
    const items = await SavedVehicleModel.find({ userId: session.sub }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ items });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Unable to load saved vehicles." }, { status: 500 });
  }
}

type Body = { plate?: string; title?: string; mileageInput?: number | null };

export async function POST(request: Request) {
  try {
    const session = requireSession();
    const body = (await request.json()) as Body;
    const plate = String(body.plate ?? "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
    if (!plate) {
      return NextResponse.json({ error: "Plate required." }, { status: 400 });
    }
    await connectMongo();
    await SavedVehicleModel.updateOne(
      { userId: session.sub, plate },
      {
        $set: {
          title: body.title ? String(body.title) : undefined,
          mileageInput: typeof body.mileageInput === "number" && Number.isFinite(body.mileageInput) ? Math.round(body.mileageInput) : undefined
        },
        $setOnInsert: { createdAt: new Date(), userId: session.sub, plate }
      },
      { upsert: true }
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Unable to save vehicle." }, { status: 500 });
  }
}
