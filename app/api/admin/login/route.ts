import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import { AdminUserModel } from "@/models/AdminUser";
import { verifyPassword, signAdminSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from "@/lib/admin/auth";

export const runtime = "nodejs";

type Body = { email?: string; password?: string };

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required." }, { status: 400 });
    }

    await connectMongo();
    const admin = await AdminUserModel.findOne({ email }).lean();
    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const ok = await verifyPassword(password, admin.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = signAdminSession({ sub: admin._id.toString(), email });
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
    const message = error instanceof Error ? error.message : "Failed to login admin.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

