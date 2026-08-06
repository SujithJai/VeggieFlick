import { handle, ok } from "@/lib/api";
import { clearSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST() {
  return handle(async () => {
    await clearSession();
    return ok({ loggedOut: true });
  });
}
