import { handle, notFound, ok } from "@/lib/api";
import { getProductBySlug, getRelatedProducts } from "@/lib/services/catalog";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ slug: string }> }) {
  return handle(async () => {
    const { slug } = await context.params;
    const product = await getProductBySlug(slug);
    if (!product) return notFound("Product not found");
    const related = await getRelatedProducts(product.categorySlug, product.id, 6);
    return ok({ product, related });
  });
}
