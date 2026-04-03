import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectMongo } from "@/lib/db/mongodb";
import { AdminUserModel } from "@/models/AdminUser";
import {
  hashPassword,
  signAdminSession,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  verifyAdminSession
} from "@/lib/admin/auth";

export const runtime = "nodejs";

type Body = { email?: string; password?: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password || password.length < 8) {
      return NextResponse.json({ error: "Valid email and password (min 8 chars) required." }, { status: 400 });
    }

    await connectMongo();
    const adminCount = await AdminUserModel.countDocuments();
    if (adminCount > 0) {
      const session = verifyAdminSession(cookies().get(SESSION_COOKIE)?.value);
      if (!session) {
        return NextResponse.json({ error: "Admin signup is closed. Login required." }, { status: 403 });
      }
    }

    const existing = await AdminUserModel.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ error: "Admin already exists for this email." }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const created = await AdminUserModel.create({ email, passwordHash });
    const token = signAdminSession({ sub: created._id.toString(), email });

    const response = NextResponse.json({ ok: true, email });
    response.cookies.set({
      name: SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: SESSION_TTL_SECONDS,
      path: "/"
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sign up admin.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
