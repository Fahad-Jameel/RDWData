import { NextResponse } from "next/server";
import { USER_SESSION_COOKIE } from "@/lib/user/auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: USER_SESSION_COOKIE,
    value: "",
    maxAge: 0,
    path: "/"
  });
  return response;
}
