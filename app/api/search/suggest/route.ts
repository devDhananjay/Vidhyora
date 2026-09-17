import { NextRequest, NextResponse } from "next/server";
import { productSearch } from "@/lib/search/product-search";
import { formatCurrency } from "@/lib/utils";
import { imageUrlsForProduct } from "@/lib/products/product-card-data";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) {
      return NextResponse.json({ items: [] });
    }

    const limitRaw = Number(request.nextUrl.searchParams.get("limit") || "8");
    const limit = Number.isFinite(limitRaw)
      ? Math.min(Math.max(Math.trunc(limitRaw), 1), 12)
      : 8;

    const results = await productSearch.suggest(q, limit);

    const items = results.map((product) => {
      const images = imageUrlsForProduct({
        thumbnail: product.thumbnail,
        images: product.images,
      });
      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        brand: product.brand,
        priceLabel: formatCurrency(product.basePrice),
        image: images[0] ?? null,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Search suggest API error:", error);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
