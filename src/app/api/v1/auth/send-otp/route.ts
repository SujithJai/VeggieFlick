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
    const code = generateOtp(6);

    try {
      const windowStart = new Date(Date.now() - 15 * 60 * 1000);
      const [{ value: recentCount }] = await db
        .select({ value: count() })
        .from(otpCodes)
        .where(and(eq(otpCodes.phone, phone), gt(otpCodes.createdAt, windowStart)));

      if (Number(recentCount) < MAX_PER_WINDOW) {
        await db.insert(otpCodes).values({
          phone,
          codeHash: hashOtp(phone, code),
          expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
        });
      }
    } catch (err) {
      console.warn("sendOtp db warning:", err);
    }

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
      otpPreview: smsConfigured ? null : code,
    });
  });
}
