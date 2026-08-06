import { and, desc, eq, gt, count } from "drizzle-orm";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { ApiError, handle, ok, parseBody } from "@/lib/api";
import { generateOtp, hashOtp } from "@/lib/auth";
import { sendOtpSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

const OTP_TTL_SECONDS = 120;
const RESEND_AFTER_SECONDS = 30;
const MAX_PER_WINDOW = 5;

export async function POST(request: Request) {
  return handle(async () => {
    const { phone } = await parseBody(request, sendOtpSchema);

    const windowStart = new Date(Date.now() - 15 * 60 * 1000);
    const [{ value: recentCount }] = await db
      .select({ value: count() })
      .from(otpCodes)
      .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, windowStart)));

    if (Number(recentCount) >= MAX_PER_WINDOW) {
      throw new ApiError(
        "Too many OTP requests. Please try again after 15 minutes.",
        429,
        "RATE_LIMITED",
      );
    }

    const [latest] = await db
      .select()
      .from(otpCodes)
      .where(eq(otpCodes.phone, phone))
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);

    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_AFTER_SECONDS * 1000) {
      const wait = Math.ceil(
        (RESEND_AFTER_SECONDS * 1000 - (Date.now() - latest.createdAt.getTime())) / 1000,
      );
      throw new ApiError(`Please wait ${wait}s before requesting a new OTP`, 429, "RESEND_TOO_SOON");
    }

    const code = generateOtp(6);
    await db.insert(otpCodes).values({
      phone,
      codeHash: hashOtp(phone, code),
      expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
    });

    // Transactional SMS is delivered through MSG91 when credentials are configured.
    const smsConfigured = Boolean(process.env.MSG91_API_KEY);
    if (smsConfigured) {
      await fetch("https://control.msg91.com/api/v5/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", authkey: process.env.MSG91_API_KEY as string },
        body: JSON.stringify({
          template_id: process.env.MSG91_TEMPLATE_ID ?? "veggieflick_otp",
          mobile: `91${phone}`,
          otp: code,
        }),
      }).catch(() => undefined);
    }

    return ok({
      phone,
      expiresIn: OTP_TTL_SECONDS,
      resendAfter: RESEND_AFTER_SECONDS,
      channel: smsConfigured ? "sms" : "preview",
      // Without an SMS gateway configured the code is surfaced so the flow stays testable.
      otpPreview: smsConfigured ? null : code,
    });
  });
}
