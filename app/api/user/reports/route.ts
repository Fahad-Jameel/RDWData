import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectMongo } from "@/lib/db/mongodb";
import { USER_SESSION_COOKIE, verifyUserSession } from "@/lib/user/auth";
import { ReportDownloadModel } from "@/models/ReportDownload";

export const runtime = "nodejs";

export async function GET() {
  const token = cookies().get(USER_SESSION_COOKIE)?.value;
  const session = verifyUserSession(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectMongo();
  const items = await ReportDownloadModel.find({ userId: session.sub }).sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ items });
}
