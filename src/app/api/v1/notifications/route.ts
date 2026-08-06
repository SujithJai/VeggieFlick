import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { handle, ok, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return handle(async () => {
    const session = await requireUser();
    const rows = await db
      .select()
      .from(notifications)
      .where(eq(notifications.profileId, session.id))
      .orderBy(desc(notifications.createdAt))
      .limit(30);
    return ok({ items: rows, unread: rows.filter((row) => !row.isRead).length });
  });
}

const readSchema = z.object({ id: z.string().uuid().optional(), all: z.boolean().optional() });

export async function PATCH(request: Request) {
  return handle(async () => {
    const session = await requireUser();
    const { id, all } = await parseBody(request, readSchema);

    if (all || !id) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.profileId, session.id));
      return ok({ updated: "all" });
    }

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.profileId, session.id)));
    return ok({ updated: id });
  });
}
