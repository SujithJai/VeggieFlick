import { z } from "zod";
import { handle, ok, parseQuery } from "@/lib/api";
import { listCategories, listSubCategories } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

const schema = z.object({ category: z.string().trim().optional() });

export async function GET(request: Request) {
  return handle(async () => {
    const { category } = parseQuery(request, schema);
    const [categories, subCategories] = await Promise.all([
      listCategories(),
      listSubCategories(category),
    ]);
    return ok({ categories, subCategories });
  });
}
