"use server";

import { PAGINATION } from "@/lib/constants";
import {
  fetchProductListPage,
  type ProductListPageResult,
} from "@/lib/products/list-products-page";
import type { ProductListParams } from "@/lib/products/product-query";
import { actionError, actionSuccess, type ActionResult } from "@/lib/utils";

export async function loadMoreStorefrontProducts(input: {
  params: ProductListParams;
  page: number;
  pageSize?: number;
}): Promise<ActionResult<ProductListPageResult>> {
  try {
    const page = Math.max(1, Number(input.page) || 1);
    const pageSize = Math.min(
      Math.max(1, Number(input.pageSize) || PAGINATION.DEFAULT_PAGE_SIZE),
      PAGINATION.MAX_PAGE_SIZE,
    );
    const result = await fetchProductListPage(
      input.params,
      page,
      pageSize,
    );
    return actionSuccess(result);
  } catch (error) {
    console.error("loadMoreStorefrontProducts error:", error);
    return actionError("Could not load more products");
  }
}
