import { db } from "@/db";
import { profiles } from "@/db/schema";
import { handle, ok, parseBody } from "@/lib/api";
import { issueSession, readGuestToken } from "@/lib/auth";
import { mergeGuestCart } from "@/lib/services/cart";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dynamic = "force-dynamic";

const emailLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  fullName: z.string().optional(),
});

export async function POST(request: Request) {
  return handle(async () => {
    const { email, fullName } = await parseBody(request, emailLoginSchema);

    let profile: any = null;
    let isNewCustomer = false;

    try {
      const [existingProfile] = await db.select().from(profiles).where(eq(profiles.email, email.toLowerCase())).limit(1);
      if (existingProfile) {
        profile = existingProfile;
      } else {
        isNewCustomer = true;
        const [newProfile] = await db
          .insert(profiles)
          .values({
            fullName: fullName?.trim() || email.split("@")[0],
            email: email.toLowerCase(),
            phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
            role: "customer",
            referralCode: `VF${Math.floor(1000 + Math.random() * 8999)}`,
            lastLoginAt: new Date(),
          })
          .returning();
        profile = newProfile;
      }
    } catch (err) {
      console.warn("emailLogin db warning:", err);
    }

    const sessionUser = {
      id: profile?.id ?? `usr-${email.replace(/[^a-zA-Z0-9]/g, "")}`,
      name: profile?.fullName ?? fullName?.trim() ?? email.split("@")[0],
      phone: profile?.phone ?? "9876543210",
      email: email.toLowerCase(),
      role: (profile?.role as any) ?? "customer",
    };

    const guestToken = await readGuestToken().catch(() => null);
    if (profile?.id) {
      await mergeGuestCart(profile.id, guestToken).catch(() => undefined);
    }

    await issueSession(sessionUser, true);

    return ok({
      isNewCustomer,
      user: sessionUser,
    });
  });
}
