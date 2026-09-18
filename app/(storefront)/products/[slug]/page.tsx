import type { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { getCommerceSettings } from "@/lib/content/commerce-settings";
import { getSiteSettings } from "@/lib/content/get-site-settings";
import { Breadcrumbs } from "@/components/products/breadcrumbs";
import { ProductBackNav } from "@/components/products/product-back-nav";
import { SellerInfo } from "@/components/products/seller-info";
import { ProductPolicy } from "@/components/products/product-policy";
import { RelatedProducts } from "@/components/products/related-products";
import { JewelleryDetails } from "@/components/products/jewellery-details";
import { ProductTrustPanel } from "@/components/products/product-trust-panel";
import { DeliveryPincodeChecker } from "@/components/products/delivery-pincode-checker";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductTrustStrip } from "@/components/products/product-trust-strip";
import { ProductPurchasePanel } from "@/components/products/product-purchase-panel";
import { HowItSitsAid } from "@/components/products/how-it-sits-aid";
import {
  RecentlyViewedRail,
  RecentlyViewedTracker,
} from "@/components/products/recently-viewed";
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
    title: product.metaTitle?.trim() || `${product.name} | VIDYORA`,
    description:
      product.metaDescription?.trim() ||
      product.shortDescription ||
      product.description.slice(0, 160),
    alternates: {
      canonical: `/products/${slug}`,
    },
    openGraph: {
      title: product.metaTitle?.trim() || product.name,
      description:
        product.metaDescription?.trim() ||
        product.shortDescription ||
        product.description.slice(0, 160),
      url: `/products/${slug}`,
      images: product.thumbnail ? [product.thumbnail] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.metaTitle?.trim() || product.name,
      description:
        product.metaDescription?.trim() ||
        product.shortDescription ||
        product.description.slice(0, 160),
      images: product.thumbnail ? [product.thumbnail] : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
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
  const inStock = product.variants.some((v) => v.stock > 0);
  const jewelleryKind = (() => {
    const hay = `${product.name} ${product.category.name}`.toLowerCase();
    if (/ring|band/.test(hay)) return "ring" as const;
    if (/bangle|bracelet|kada/.test(hay)) return "bangle" as const;
    if (/earring|jhumka|stud|hoop/.test(hay)) return "earring" as const;
    if (/necklace|chain|pendant|haar/.test(hay)) return "necklace" as const;
    if (/nose|nath/.test(hay)) return "nose" as const;
    return "jewellery" as const;
  })();
  const onModelImages = product.images
    .filter(
      (image) =>
        image.role === "ON_MODEL" &&
        image.kind?.toUpperCase() !== "VIDEO",
    )
    .map((image) => ({
      id: image.id,
      url: image.url,
      altText: image.altText,
    }));
  const tryOnImageUrl =
    product.images.find(
      (image) =>
        image.kind?.toUpperCase() !== "VIDEO" &&
        (image.role === "PRODUCT" || !image.role),
    )?.url ||
    product.thumbnail ||
    product.images[0]?.url ||
    null;
  const [wishlistIds, reviews, commerce, siteSettings] = await Promise.all([
    getWishlistProductIds(),
    getProductReviews(product.id),
    getCommerceSettings(),
    getSiteSettings(),
  ]);
  const isInWishlist = wishlistIds.includes(product.id);
  const whatsappNumber = siteSettings.contact.whatsappNumber || undefined;

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

      <div className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
          <ProductBackNav
            from={from}
            categoryHref={`/categories/${product.category.slug}`}
            categoryLabel={product.category.name}
          />
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
              videoUrl={product.videoUrl}
              discount={discount}
              jewelleryKind={jewelleryKind}
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

              <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 md:px-5">
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

              <ProductTrustStrip
                returnWindowDays={commerce.returnWindowDays}
                freeShippingThreshold={commerce.freeShippingThreshold}
              />

              <ProductPurchasePanel
                productId={product.id}
                variants={product.variants}
                basePrice={basePrice}
                productName={product.name}
                productText={product.shortDescription || undefined}
                isInWishlist={isInWishlist}
                whatsappNumber={whatsappNumber}
                weightFallback={
                  typeof (product.attributes as Record<string, unknown> | null)
                    ?.weight === "string"
                    ? String(
                        (product.attributes as Record<string, unknown>).weight,
                      )
                    : typeof (product.attributes as Record<string, unknown> | null)
                          ?.grossWeight === "string"
                      ? String(
                          (product.attributes as Record<string, unknown>)
                            .grossWeight,
                        )
                      : null
                }
              />

              <DeliveryPincodeChecker
                processingDays={product.seller?.processingDays}
                freeShippingThreshold={commerce.freeShippingThreshold}
              />

              <ProductTrustPanel
                productId={product.id}
                productName={product.name}
                inStock={inStock}
                baselinePrice={basePrice}
                variantId={defaultVariant?.id}
              />

              <SellerInfo seller={product.seller} />
            </div>
          </div>

          <div className="mt-14 space-y-6">
            <HowItSitsAid
              productName={product.name}
              categoryName={product.category.name}
              onModelImages={onModelImages}
              tryOnImageUrl={tryOnImageUrl}
            />

            <JewelleryDetails
              name={product.name}
              description={product.description}
              thumbnail={product.thumbnail}
              sku={defaultVariant?.sku}
              certificateNumber={product.certificateNumber}
              certificateUrl={product.certificateUrl}
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

          <div className="mt-14 pb-8 md:pb-10">
            <RelatedProducts
              categoryId={product.categoryId}
              currentProductId={product.id}
            />
          </div>

          <RecentlyViewedRail excludeId={product.id} />
          <div className="pb-24 md:pb-28" />
        </div>
      </div>

      <RecentlyViewedTracker
        productId={product.id}
        slug={product.slug}
        name={product.name}
        thumbnail={product.thumbnail}
        price={defaultVariant ? Number(defaultVariant.price) : basePrice}
      />
    </>
  );
}
