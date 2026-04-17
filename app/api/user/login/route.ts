import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db/mongodb";
import { UserAccountModel } from "@/models/UserAccount";
import { verifyUserPassword, signUserSession, USER_SESSION_COOKIE, USER_SESSION_TTL_SECONDS } from "@/lib/user/auth";

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
    const user = await UserAccountModel.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }
    const ok = await verifyUserPassword(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

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
    const message = error instanceof Error ? error.message : "Unable to login.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
