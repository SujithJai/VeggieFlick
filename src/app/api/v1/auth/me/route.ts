import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles, wallets } from "@/db/schema";
import { handle, ok } from "@/lib/api";
import { ROLE_PERMISSIONS, clearSession, getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const session = await getSession();
    if (!session) return ok({ authenticated: false, user: null });

    const [profile] = await db.select().from(profiles).where(eq(profiles.id, session.id)).limit(1);
    if (!profile) return ok({ authenticated: false, user: null });

    const [wallet] = await db.select().from(wallets).where(eq(wallets.profileId, profile.id)).limit(1);

    return ok({
      authenticated: true,
      user: {
        id: profile.id,
        fullName: profile.fullName,
        phone: profile.phone,
        email: profile.email,
        role: profile.role,
        loyaltyTier: profile.loyaltyTier,
        loyaltyPoints: profile.loyaltyPoints,
        referralCode: profile.referralCode,
        walletBalance: wallet?.balance ?? "0.00",
      },
      permissions: ROLE_PERMISSIONS[profile.role],
    });
  });
}

export async function DELETE() {
  return handle(async () => {
    await clearSession();
    return ok({ loggedOut: true });
  });
}
