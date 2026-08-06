import { z } from "zod";
import { handle, ok, parseQuery } from "@/lib/api";
import { searchSuggestions } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

const schema = z.object({
  q: z.string().trim().max(120).default(""),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

export async function GET(request: Request) {
  return handle(async () => {
    const { q, limit } = parseQuery(request, schema);
    const suggestions = await searchSuggestions(q, limit);
    return ok(suggestions);
  });
}
