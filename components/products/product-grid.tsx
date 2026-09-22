import { getWishlistProductIds } from "@/actions/wishlist/manage-wishlist";
import { getCartLinesForPlp } from "@/actions/cart/get-cart";
import { ProductInfiniteGrid } from "@/components/products/product-infinite-grid";
import { PAGINATION } from "@/lib/constants";
import {
  fetchProductListPage,
  productListFilterKey,
} from "@/lib/products/list-products-page";
import type { ProductListParams } from "@/lib/products/product-query";

export async function ProductGrid({
  searchParams,
}: {
  searchParams: Promise<ProductListParams>;
}) {
  const params = await searchParams;
  const pageSize = PAGINATION.DEFAULT_PAGE_SIZE;
  // Infinite scroll always starts from page 1; ignore stale ?page=
  const listParams: ProductListParams = { ...params, page: undefined };

  const [result, wishlistIds, cartLines] = await Promise.all([
    fetchProductListPage(listParams, 1, pageSize),
    getWishlistProductIds(),
    getCartLinesForPlp(),
  ]);

  return (
    <ProductInfiniteGrid
      key={productListFilterKey(listParams)}
      initialItems={result.items}
      total={result.total}
      pageSize={pageSize}
      listParams={listParams}
      wishlistIds={wishlistIds}
      cartLines={cartLines}
    />
  );
}
