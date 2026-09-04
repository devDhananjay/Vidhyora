import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/products/breadcrumbs";
import { VariantSelector } from "@/components/products/variant-selector";
import { AddToCartButton } from "@/components/products/add-to-cart-button";
import { ProductSpecs } from "@/components/products/product-specs";
import { SellerInfo } from "@/components/products/seller-info";
import { ProductPolicy } from "@/components/products/product-policy";
import { RelatedProducts } from "@/components/products/related-products";
import { ReviewStatsCard } from "@/components/reviews/review-stats-card";
import { ReviewsList } from "@/components/reviews/reviews-list";
import { Heart, Share2, Shield, Star, TruckIcon } from "lucide-react";
import { generateProductStructuredData, generateBreadcrumbStructuredData } from "@/lib/structured-data";
import { getProductReviews } from "@/actions/reviews/get-reviews";
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

  if (!product || product.status !== "ACTIVE" || product.approvalStatus !== "APPROVED") {
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

  const price = Number(product.basePrice);
  const comparePrice = product.compareAtPrice
    ? Number(product.compareAtPrice)
    : null;

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

  // Generate structured data for SEO
  const productStructuredData = generateProductStructuredData(product);
  const breadcrumbStructuredData = generateBreadcrumbStructuredData([
    { name: "Home", url: process.env.NEXT_PUBLIC_APP_URL || "/" },
    { name: product.category.name, url: `${process.env.NEXT_PUBLIC_APP_URL}/categories/${product.category.slug}` },
    { name: product.name, url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}` },
  ]);

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />

      <div className="container mx-auto px-4 py-6">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: product.category.name, href: `/categories/${product.category.slug}` },
          { label: product.name, href: "#" },
        ]}
      />

      {/* Main Product Section */}
      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
            {product.thumbnail && !product.thumbnail.includes("placeholder") ? (
              <Image
                src={product.thumbnail}
                alt={product.name}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100/40">
                <span className="font-serif text-2xl text-amber-700">VIDYORA</span>
              </div>
            )}
            {discount > 0 && (
              <Badge className="absolute right-4 top-4 bg-destructive text-white">
                {discount}% OFF
              </Badge>
            )}
          </div>

          {/* Thumbnail Grid */}
          {product.images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map((image) => (
                <div
                  key={image.id}
                  className="relative aspect-square cursor-pointer overflow-hidden rounded border hover:border-primary"
                >
                  <Image
                    src={image.url}
                    alt={image.altText || product.name}
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Brand & Title */}
          <div>
            <div className="mb-2 text-sm text-muted-foreground">
              {product.brand}
            </div>
            <h1 className="font-serif text-4xl text-neutral-900">{product.name}</h1>
            {isBestSellerFlag(product.attributes) ? (
              <span className="mt-3 inline-flex items-center gap-1 rounded-md bg-[#c5a46e] px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-white">
                <Star className="size-2.5 fill-white" strokeWidth={0} />
                BESTSELLER
              </span>
            ) : null}
            {product.shortDescription && (
              <p className="mt-2 text-muted-foreground">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-4xl text-neutral-900">{formatCurrency(basePrice)}</span>
            {compareAtPrice && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  {formatCurrency(compareAtPrice)}
                </span>
                <Badge variant="destructive">{discount}% OFF</Badge>
              </>
            )}
          </div>

          {/* Stock Status */}
          <div>
            {inStock ? (
              <Badge variant="default" className="bg-green-600">
                In Stock
              </Badge>
            ) : (
              <Badge variant="destructive">Out of Stock</Badge>
            )}
          </div>

          {/* Variant Selector */}
          {product.variants.length > 0 && (
            <VariantSelector variants={product.variants} productId={product.id} />
          )}

          {/* Add to Cart */}
          <div className="flex gap-3">
            <AddToCartButton
              productId={product.id}
              variantId={defaultVariant?.id}
              inStock={inStock}
              className="flex-1"
            />
            <Button variant="outline" size="icon">
              <Heart className="size-5" />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="size-5" />
            </Button>
          </div>

          {/* Delivery Info */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <TruckIcon className="size-5 text-primary" />
              <div>
                <div className="font-medium">Free Delivery</div>
                <div className="text-sm text-muted-foreground">
                  On orders above ₹500
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="size-5 text-primary" />
              <div>
                <div className="font-medium">Secure Transaction</div>
                <div className="text-sm text-muted-foreground">
                  100% payment protection
                </div>
              </div>
            </div>
          </div>

          {/* Seller Info */}
          <SellerInfo seller={product.seller} />
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="mt-12 space-y-8">
        {/* Description */}
        <div className="rounded-lg border p-6">
          <h2 className="mb-4 text-xl font-bold">Product Description</h2>
          <div className="prose max-w-none text-muted-foreground">
            {product.description}
          </div>
        </div>

        {/* Specifications */}
        {product.attributes && (
          <ProductSpecs attributes={product.attributes as Record<string, string>} />
        )}

        {/* Return Policy */}
        {product.policy && <ProductPolicy policy={product.policy} />}
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h2 className="mb-6 text-2xl font-bold">Customer Reviews</h2>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Review Stats */}
          <div className="lg:col-span-1">
            <ReviewStatsCard stats={await getProductReviews(product.id).then(r => r.stats)} />
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2">
            <ReviewsList 
              initialReviews={await getProductReviews(product.id).then(r => r.reviews)} 
              productId={product.id}
            />
          </div>
        </div>
      </div>

      {/* Related Products */}
      <div className="mt-12">
        <RelatedProducts
          categoryId={product.categoryId}
          currentProductId={product.id}
        />
      </div>
    </div>
    </>
  );
}
