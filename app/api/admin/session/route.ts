import { NextResponse } from "next/server";
import { getAdminSessionFromCookies } from "@/lib/admin/session";

export async function GET() {
  const session = getAdminSessionFromCookies();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    admin: {
      id: session.sub,
      email: session.email
    }
  });
}

