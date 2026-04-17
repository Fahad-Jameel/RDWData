import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import { UserAccountModel } from "@/models/UserAccount";
import { hashUserPassword, signUserSession, USER_SESSION_COOKIE, USER_SESSION_TTL_SECONDS } from "@/lib/user/auth";

export const runtime = "nodejs";

type Body = { email?: string; password?: string };

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");

    if (!isValidEmail(email) || password.length < 8) {
      return NextResponse.json({ error: "Valid email and password (min 8 chars) required." }, { status: 400 });
    }

    await connectMongo();
    const existing = await UserAccountModel.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ error: "Account already exists." }, { status: 409 });
    }

    const passwordHash = await hashUserPassword(password);
    const user = await UserAccountModel.create({ email, passwordHash });
    const token = signUserSession({ sub: user._id.toString(), email });
    const response = NextResponse.json({ ok: true, email });
    response.cookies.set({
      name: USER_SESSION_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: USER_SESSION_TTL_SECONDS,
      path: "/"
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
