import crypto from "node:crypto";

export const USER_SESSION_COOKIE = "user_session";
const USER_SESSION_SECRET = process.env.USER_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET ?? "change-this-user-session-secret";
const USER_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export { USER_SESSION_TTL_SECONDS };

export async function hashUserPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt);
  return `${salt}:${derived}`;
}

export async function verifyUserPassword(password: string, stored: string): Promise<boolean> {
  const [salt, expected] = stored.split(":");
  if (!salt || !expected) return false;
  const actual = await scrypt(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

type SessionPayload = {
  sub: string;
  email: string;
  exp: number;
};

export function signUserSession(payload: { sub: string; email: string }) {
  const exp = Math.floor(Date.now() / 1000) + USER_SESSION_TTL_SECONDS;
  const body: SessionPayload = { ...payload, exp };
  const encoded = base64Url(JSON.stringify(body));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifyUserSession(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  if (!safeEqual(signature, sign(encoded))) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function base64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(value: string): string {
  return crypto.createHmac("sha256", USER_SESSION_SECRET).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

function scrypt(password: string, salt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(derivedKey.toString("hex"));
    });
  });
}
