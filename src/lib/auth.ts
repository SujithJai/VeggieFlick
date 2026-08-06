import { cookies } from "next/headers";
import { randomBytes, randomInt, scryptSync, timingSafeEqual, createHmac } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ApiError } from "@/lib/api";

export const SESSION_COOKIE = "vf_session";
export const GUEST_CART_COOKIE = "vf_cart";
const SESSION_MINUTES = 60;
const REMEMBER_DAYS = 30;

export type AppRole =
  | "customer"
  | "delivery_partner"
  | "warehouse_staff"
  | "manager"
  | "admin"
  | "super_admin";

export type SessionUser = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: AppRole;
};

export const ROLE_PERMISSIONS: Record<AppRole, string[]> = {
  super_admin: ["*"],
  admin: [
    "products.*",
    "orders.*",
    "customers.read",
    "analytics.read",
    "coupons.*",
    "blogs.*",
    "recipes.*",
    "inventory.*",
  ],
  manager: ["orders.read", "orders.update", "inventory.read", "inventory.update", "analytics.read"],
  warehouse_staff: ["inventory.read", "inventory.update", "packing.update"],
  delivery_partner: ["assigned_orders.read", "delivery_status.update", "location.update"],
  customer: [
    "profile.read",
    "profile.update",
    "cart.*",
    "wishlist.*",
    "orders.create",
    "orders.read",
    "reviews.create",
  ],
};

export const BACK_OFFICE_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "manager",
  "warehouse_staff",
];

export function hasPermission(role: AppRole, permission: string): boolean {
  const granted = ROLE_PERMISSIONS[role] ?? [];
  return granted.some((entry) => {
    if (entry === "*") return true;
    if (entry === permission) return true;
    if (entry.endsWith(".*")) return permission.startsWith(entry.slice(0, -1));
    return false;
  });
}

function secretKey(): Uint8Array {
  const secret =
    process.env.SESSION_SECRET ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "veggieflick-local-development-session-secret-key";
  return new TextEncoder().encode(secret.padEnd(32, "0"));
}

export async function issueSession(user: SessionUser, remember = false): Promise<void> {
  const maxAge = remember ? REMEMBER_DAYS * 24 * 60 * 60 : SESSION_MINUTES * 60;
  const token = await new SignJWT({
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setIssuer("veggieflick")
    .setExpirationTime(`${maxAge}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: "veggieflick" });
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      name: String(payload.name ?? "Customer"),
      phone: String(payload.phone ?? ""),
      email: (payload.email as string | null) ?? null,
      role: (payload.role as AppRole) ?? "customer",
    };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new ApiError("Authentication required", 401, "UNAUTHORIZED");
  return session;
}

export async function requireRole(roles: AppRole[]): Promise<SessionUser> {
  const session = await requireUser();
  if (!roles.includes(session.role)) {
    throw new ApiError("You do not have access to this resource", 403, "FORBIDDEN");
  }
  return session;
}

export async function requirePermission(permission: string): Promise<SessionUser> {
  const session = await requireUser();
  if (!hasPermission(session.role, permission)) {
    throw new ApiError(`Missing permission: ${permission}`, 403, "FORBIDDEN");
  }
  return session;
}

/** Stable guest cart token — created lazily for anonymous shoppers. */
export async function getOrCreateGuestToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(GUEST_CART_COOKIE)?.value;
  if (existing) return existing;
  const token = randomBytes(24).toString("hex");
  store.set(GUEST_CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
  return token;
}

export async function readGuestToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(GUEST_CART_COOKIE)?.value ?? null;
}

/* ----------------------------- credentials ----------------------------- */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string | null): boolean {
  if (!stored || !stored.includes(":")) return false;
  const [salt, digest] = stored.split(":");
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

export function generateOtp(length = 6): string {
  let code = "";
  for (let i = 0; i < length; i += 1) code += randomInt(0, 10).toString();
  return code;
}

export function hashOtp(phone: string, code: string): string {
  return createHmac("sha256", secretKey()).update(`${phone}:${code}`).digest("hex");
}

export async function loadProfile(profileId: string) {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId)).limit(1);
  return profile ?? null;
}
