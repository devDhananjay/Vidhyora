import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Breadcrumbs } from "@/components/products/breadcrumbs";
import { VariantSelector } from "@/components/products/variant-selector";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { SellerInfo } from "@/components/products/seller-info";
import { ProductPolicy } from "@/components/products/product-policy";
import { RelatedProducts } from "@/components/products/related-products";
import { JewelleryDetails } from "@/components/products/jewellery-details";
import { ProductTrustPanel } from "@/components/products/product-trust-panel";
import { ProductShareButton } from "@/components/products/product-share-button";
import { DeliveryPincodeChecker } from "@/components/products/delivery-pincode-checker";
import { ProductGallery } from "@/components/products/product-gallery";
import { FloatingAddToCartBar } from "@/components/products/floating-add-to-cart-bar";
import { ProductTrustStrip } from "@/components/products/product-trust-strip";
import { WishlistButton } from "@/components/wishlist/wishlist-button";
import { ReviewStatsCard } from "@/components/reviews/review-stats-card";
import { ReviewsList } from "@/components/reviews/reviews-list";
import { Sparkles, Star } from "lucide-react";
import {
  generateProductStructuredData,
  generateBreadcrumbStructuredData,
} from "@/lib/structured-data";
import { getProductReviews } from "@/actions/reviews/get-reviews";
import { getWishlistProductIds } from "@/actions/wishlist/manage-wishlist";
import { isBestSellerFlag } from "@/lib/products/product-card-data";

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      seller: {
        include: {
          seller: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
      variants: {
        where: { isActive: true },
        orderBy: { price: "asc" },
      },
      images: {
        orderBy: { sortOrder: "asc" },
      },
      policy: true,
    },
  });

  if (
    !product ||
    product.status !== "ACTIVE" ||
    product.approvalStatus !== "APPROVED"
  ) {
    return null;
  }

  return product;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  return {
    title: `${product.name} | VIDYORA`,
    description: product.shortDescription || product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDescription || product.description.slice(0, 160),
      images: product.thumbnail ? [product.thumbnail] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description: product.shortDescription || product.description.slice(0, 160),
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const basePrice = Number(product.basePrice);
  const compareAtPrice = product.compareAtPrice
    ? Number(product.compareAtPrice)
    : null;
  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - basePrice) / compareAtPrice) * 100)
    : 0;

  const defaultVariant = product.variants[0];
  const inStock = defaultVariant ? defaultVariant.stock > 0 : false;
  const wishlistIds = await getWishlistProductIds();
  const isInWishlist = wishlistIds.includes(product.id);
  const reviews = await getProductReviews(product.id);

  const productStructuredData = generateProductStructuredData(product);
  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: "Home", url: process.env.NEXT_PUBLIC_APP_URL || "/" },
    {
      name: product.category.name,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/categories/${product.category.slug}`,
    },
    {
      name: product.name,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productStructuredData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />

      <div className="bg-[radial-gradient(ellipse_at_top,_rgba(246,235,232,0.65),_transparent_55%)]">
        <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              {
                label: product.category.name,
                href: `/categories/${product.category.slug}`,
              },
              { label: product.name, href: "#" },
            ]}
          />

          <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
            <ProductGallery
              name={product.name}
              thumbnail={product.thumbnail}
              images={product.images}
              discount={discount}
            />

            <div className="space-y-5 md:space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs tracking-[0.22em] text-[#8b2e2e] uppercase">
                    {product.brand}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f6ebe8] px-2 py-0.5 text-[10px] font-medium tracking-[0.08em] text-[#8b2e2e] uppercase">
                    <Sparkles className="size-2.5" strokeWidth={2} />
                    Fine jewellery
                  </span>
                </div>
                <h1 className="mt-2 font-serif text-3xl leading-tight text-neutral-900 md:text-[2.5rem]">
                  {product.name}
                </h1>
                {isBestSellerFlag(product.attributes) ? (
                  <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-[#c5a46e] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white">
                    <Star className="size-2.5 fill-white" strokeWidth={0} />
                    BESTSELLER
                  </span>
                ) : null}
                {product.shortDescription ? (
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-500 md:text-[15px]">
                    {product.shortDescription}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-[#ead9c4]/70 bg-gradient-to-br from-white via-[#fffdfa] to-[#faf6f0] px-4 py-4 md:px-5">
                <div className="flex flex-wrap items-end gap-3">
                  <span className="font-serif text-3xl text-neutral-900 md:text-4xl">
                    {formatCurrency(basePrice)}
                  </span>
                  {compareAtPrice ? (
                    <>
                      <span className="pb-1 text-lg text-neutral-400 line-through">
                        {formatCurrency(compareAtPrice)}
                      </span>
                      <span className="mb-1 rounded-full bg-[#8b2e2e] px-2.5 py-0.5 text-xs font-semibold text-white">
                        {discount}% OFF
                      </span>
                    </>
                  ) : null}
                </div>
                <p className="mt-2 text-xs text-neutral-500">
                  Inclusive of all taxes · No hidden making charges at checkout
                </p>
                <div className="mt-3">
                  {inStock ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f5ef] px-3 py-1 text-xs font-medium text-[#2f6b4f]">
                      <span className="size-1.5 rounded-full bg-[#2f6b4f]" />
                      In Stock — ready to ship
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              <ProductTrustStrip />

              {product.variants.length > 0 ? (
                <VariantSelector
                  variants={product.variants}
                  productId={product.id}
                />
              ) : null}

              <div id="product-main-actions" className="flex items-center gap-3">
                <AddToCartButton
                  productId={product.id}
                  variantId={defaultVariant?.id}
                  inStock={inStock}
                  className="flex-1 shadow-[0_10px_28px_rgba(139,46,46,0.28)]"
                />
                <WishlistButton
                  productId={product.id}
                  isInWishlist={isInWishlist}
                />
                <ProductShareButton
                  title={product.name}
                  text={product.shortDescription || undefined}
                />
              </div>

              <DeliveryPincodeChecker />

              <ProductTrustPanel
                productId={product.id}
                productName={product.name}
              />

              <SellerInfo seller={product.seller} />
            </div>
          </div>

          <div className="mt-14 space-y-6">
            <JewelleryDetails
              name={product.name}
              description={product.description}
              thumbnail={product.thumbnail}
              sku={defaultVariant?.sku}
              basePrice={basePrice}
              compareAtPrice={compareAtPrice}
              taxPercent={Number(product.tax) || 3}
              attributes={
                (product.attributes as Record<string, unknown> | null) ?? null
              }
            />

            {product.policy ? <ProductPolicy policy={product.policy} /> : null}
          </div>

          <div className="mt-14">
            <h2 className="mb-6 font-serif text-2xl text-[#8b2e2e] md:text-3xl">
              Customer Reviews
            </h2>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <ReviewStatsCard stats={reviews.stats} />
              </div>
              <div className="lg:col-span-2">
                <ReviewsList
                  initialReviews={reviews.reviews}
                  productId={product.id}
                />
              </div>
            </div>
          </div>

          <div className="mt-14 pb-24 md:pb-28">
            <RelatedProducts
              categoryId={product.categoryId}
              currentProductId={product.id}
            />
          </div>
        </div>
      </div>

      <FloatingAddToCartBar
        productId={product.id}
        variantId={defaultVariant?.id}
        price={
          defaultVariant ? Number(defaultVariant.price) : basePrice
        }
        weightLabel={
          defaultVariant?.weight
            ? `${Number(defaultVariant.weight)} g`
            : typeof (product.attributes as Record<string, unknown> | null)
                ?.weight === "string"
              ? String(
                  (product.attributes as Record<string, unknown>).weight,
                )
              : null
        }
        inStock={inStock}
      />
    </>
  );
}
