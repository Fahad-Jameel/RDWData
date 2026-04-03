import { cookies } from "next/headers";
import { SESSION_COOKIE, verifyAdminSession } from "./auth";

export function getAdminSessionFromCookies() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifyAdminSession(token);
}

