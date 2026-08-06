import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, profiles } from "@/db/schema";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { BACK_OFFICE_ROLES, issueSession, verifyPassword } from "@/lib/auth";
import { adminLoginSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handle(async () => {
    const { email, password, totp } = await parseBody(request, adminLoginSchema);

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email.toLowerCase()))
      .limit(1);

    if (!profile || !verifyPassword(password, profile.passwordHash)) {
      throw new ApiError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    if (!BACK_OFFICE_ROLES.includes(profile.role)) {
      throw new ApiError("This portal is restricted to VeggieFlick staff", 403, "FORBIDDEN");
    }
    if (profile.status !== "active") {
      throw new ApiError("This account has been disabled", 403, "ACCOUNT_INACTIVE");
    }

    // Second factor is enforced whenever an authenticator code is provisioned.
    const requiredTotp = process.env.ADMIN_TOTP_CODE;
    if (requiredTotp && totp !== requiredTotp) {
      throw new ApiError("Invalid two-factor authentication code", 401, "INVALID_2FA");
    }

    await db.update(profiles).set({ lastLoginAt: new Date() }).where(eq(profiles.id, profile.id));
    await db.insert(auditLogs).values({
      actorId: profile.id,
      action: "admin.login",
      entity: "profile",
      entityId: profile.id,
      metadata: { role: profile.role },
    });

    await issueSession(
      {
        id: profile.id,
        name: profile.fullName,
        phone: profile.phone,
        email: profile.email,
        role: profile.role,
      },
      false,
    );

    return ok({
      user: {
        id: profile.id,
        fullName: profile.fullName,
        email: profile.email,
        role: profile.role,
      },
    });
  });
}
