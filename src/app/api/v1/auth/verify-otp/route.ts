import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications, otpCodes, profiles, wallets } from "@/db/schema";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { hashOtp, issueSession, readGuestToken } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/services/cart";
import { verifyOtpSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

export async function POST(request: Request) {
  return handle(async () => {
    const { phone, code, fullName, rememberMe } = await parseBody(request, verifyOtpSchema);

    const [record] = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.phone, phone), eq(otpCodes.consumed, false)))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (!record) throw new ApiError("Request a new OTP to continue", 400, "OTP_NOT_FOUND");
    if (record.expiresAt.getTime() < Date.now())
      throw new ApiError("This OTP has expired. Request a new one.", 400, "OTP_EXPIRED");
    if (record.attempts >= MAX_ATTEMPTS)
      throw new ApiError("Too many incorrect attempts. Request a new OTP.", 429, "OTP_ATTEMPTS");

    if (record.codeHash !== hashOtp(phone, code)) {
      await db
        .update(otpCodes)
        .set({ attempts: record.attempts + 1 })
        .where(eq(otpCodes.id, record.id));
      throw new ApiError("Incorrect OTP. Please try again.", 400, "OTP_INVALID");
    }

    await db.update(otpCodes).set({ consumed: true }).where(eq(otpCodes.id, record.id));

    let [profile] = await db.select().from(profiles).where(eq(profiles.phone, phone)).limit(1);
    let isNewCustomer = false;

    if (!profile) {
      isNewCustomer = true;
      [profile] = await db
        .insert(profiles)
        .values({
          fullName: fullName?.trim() || `Customer ${phone.slice(-4)}`,
          phone,
          role: "customer",
          referralCode: `VF${phone.slice(-4)}${Math.floor(10 + Math.random() * 89)}`,
          lastLoginAt: new Date(),
        })
        .returning();

      await db.insert(wallets).values({ profileId: profile.id, balance: "0" });
      await db.insert(notifications).values({
        profileId: profile.id,
        title: "Welcome to VeggieFlick",
        message: "Use WELCOME100 to get ₹100 off your first order above ₹699.",
        notificationType: "promotion",
      });
    } else {
      if (profile.status !== "active")
        throw new ApiError("This account is not active. Contact support.", 403, "ACCOUNT_INACTIVE");
      await db
        .update(profiles)
        .set({ lastLoginAt: new Date(), ...(fullName ? { fullName } : {}) })
        .where(eq(profiles.id, profile.id));
    }

    const guestToken = await readGuestToken();
    await mergeGuestCart(profile.id, guestToken);

    await issueSession(
      {
        id: profile.id,
        name: profile.fullName,
        phone: profile.phone,
        email: profile.email,
        role: profile.role,
      },
      rememberMe,
    );

    return ok({
      isNewCustomer,
      user: {
        id: profile.id,
        fullName: profile.fullName,
        phone: profile.phone,
        email: profile.email,
        role: profile.role,
        loyaltyTier: profile.loyaltyTier,
      },
    });
  });
}
