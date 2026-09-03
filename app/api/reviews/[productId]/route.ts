import { NextRequest, NextResponse } from "next/server";
import { getProductReviews } from "@/actions/reviews/get-reviews";
import type { ReviewFilters } from "@/types/review";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const searchParams = request.nextUrl.searchParams;

    const filters: ReviewFilters = {
      rating: searchParams.get("rating")
        ? parseInt(searchParams.get("rating")!)
        : undefined,
      verified: searchParams.get("verified") === "true" ? true : undefined,
      withImages: searchParams.get("withImages") === "true",
      sortBy: (searchParams.get("sortBy") as ReviewFilters["sortBy"]) || "recent",
    };

    const { reviews, stats } = await getProductReviews(productId, filters);

    return NextResponse.json({ reviews, stats });
  } catch (error) {
    console.error("Get reviews API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 },
    );
  }
}
