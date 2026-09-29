import type { Product, ProductVariant, Category } from "@prisma/client";
import { sellableStock } from "@/lib/products/product-card-data";
import { getSiteUrl } from "@/lib/site-url";

type ProductWithRelations = Product & {
  category: Category;
  variants: ProductVariant[];
};

type AggregateRatingInput = {
  averageRating: number;
  totalReviews: number;
};

type ReviewInput = {
  rating: number;
  title?: string | null;
  comment?: string | null;
  authorName?: string | null;
  datePublished?: Date | string | null;
};

function absoluteUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const base = getSiteUrl();
  return `${base}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

function toIsoDate(value: Date | string | null | undefined): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

export function generateProductStructuredData(
  product: ProductWithRelations,
  options?: {
    aggregateRating?: AggregateRatingInput;
    reviews?: ReviewInput[];
  },
) {
  const siteUrl = getSiteUrl();
  const basePrice = Number(product.basePrice);

  const lowestPrice =
    product.variants.length > 0
      ? Math.min(...product.variants.map((v) => Number(v.price)))
      : basePrice;

  const highestPrice =
    product.variants.length > 0
      ? Math.max(...product.variants.map((v) => Number(v.price)))
      : basePrice;

  const inStock = product.variants.some((v) => sellableStock(v) > 0);
  const productUrl = `${siteUrl}/products/${product.slug}`;
  const image = absoluteUrl(product.thumbnail);

  const priceValidUntil = new Date();
  priceValidUntil.setFullYear(priceValidUntil.getFullYear() + 1);

  const structuredData: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(image ? { image: [image] } : {}),
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    category: product.category.name,
    sku: product.id,
    url: productUrl,
    offers: {
      "@type": product.variants.length > 1 ? "AggregateOffer" : "Offer",
      url: productUrl,
      priceCurrency: "INR",
      ...(product.variants.length > 1
        ? {
            lowPrice: lowestPrice,
            highPrice: highestPrice,
            offerCount: product.variants.length,
          }
        : {
            price: basePrice,
          }),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      priceValidUntil: priceValidUntil.toISOString().slice(0, 10),
      seller: {
        "@type": "Organization",
        name: "VIDYORA",
      },
    },
  };

  const rating = options?.aggregateRating;
  if (rating && rating.totalReviews > 0 && rating.averageRating > 0) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(rating.averageRating.toFixed(1)),
      reviewCount: rating.totalReviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const reviews = (options?.reviews ?? [])
    .filter((review) => review.rating >= 1 && review.rating <= 5)
    .slice(0, 10)
    .map((review) => {
      const datePublished = toIsoDate(review.datePublished);
      return {
        "@type": "Review",
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.rating,
          bestRating: 5,
          worstRating: 1,
        },
        author: {
          "@type": "Person",
          name: review.authorName?.trim() || "VIDYORA Customer",
        },
        ...(review.title?.trim() ? { name: review.title.trim() } : {}),
        ...(review.comment?.trim()
          ? { reviewBody: review.comment.trim() }
          : {}),
        ...(datePublished ? { datePublished } : {}),
      };
    });

  if (reviews.length > 0) {
    structuredData.review = reviews;
  }

  return structuredData;
}

export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url) || item.url,
    })),
  };
}

export function generateOrganizationStructuredData(options: {
  name: string;
  alternateName?: string;
  url: string;
  email?: string;
  phone?: string;
  logo?: string;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: options.name,
    ...(options.alternateName ? { alternateName: options.alternateName } : {}),
    url: options.url,
    ...(options.logo ? { logo: absoluteUrl(options.logo) || options.logo } : {}),
    ...(options.sameAs?.length ? { sameAs: options.sameAs } : {}),
    ...(options.email || options.phone
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            ...(options.email ? { email: options.email } : {}),
            ...(options.phone ? { telephone: options.phone } : {}),
            areaServed: "IN",
            availableLanguage: ["English", "Hindi"],
          },
        }
      : {}),
  };
}

export function generateWebSiteStructuredData(options: {
  name: string;
  alternateName?: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: options.name,
    ...(options.alternateName ? { alternateName: options.alternateName } : {}),
    url: options.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${options.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function generateArticleStructuredData(options: {
  title: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}) {
  const siteUrl = getSiteUrl();
  const image = absoluteUrl(options.image);
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: options.title,
    description: options.description,
    url: options.url,
    ...(image ? { image: [image] } : {}),
    ...(options.datePublished ? { datePublished: options.datePublished } : {}),
    ...(options.dateModified
      ? { dateModified: options.dateModified }
      : options.datePublished
        ? { dateModified: options.datePublished }
        : {}),
    author: {
      "@type": "Organization",
      name: "VIDYORA",
    },
    publisher: {
      "@type": "Organization",
      name: "VIDYORA",
      url: siteUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": options.url,
    },
  };
}

export function generateFaqStructuredData(
  faqs: Array<{ question: string; answer: string }>,
) {
  if (faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateLocalBusinessStructuredData(
  stores: Array<{
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode?: string | null;
    phone: string;
    email?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    mapUrl?: string | null;
    hours?: string | null;
  }>,
) {
  const siteUrl = getSiteUrl();
  if (stores.length === 0) return null;

  const businesses = stores.map((store) => {
    const hasGeo =
      typeof store.latitude === "number" &&
      typeof store.longitude === "number" &&
      Number.isFinite(store.latitude) &&
      Number.isFinite(store.longitude);

    return {
      "@type": "JewelryStore",
      name: store.name,
      image: absoluteUrl("/brand/vidyora-logo.png"),
      url: `${siteUrl}/store-locator`,
      telephone: store.phone,
      ...(store.email ? { email: store.email } : {}),
      address: {
        "@type": "PostalAddress",
        streetAddress: store.address,
        addressLocality: store.city,
        addressRegion: store.state,
        ...(store.postalCode ? { postalCode: store.postalCode } : {}),
        addressCountry: "IN",
      },
      ...(hasGeo
        ? {
            geo: {
              "@type": "GeoCoordinates",
              latitude: store.latitude,
              longitude: store.longitude,
            },
          }
        : {}),
      ...(store.mapUrl ? { hasMap: store.mapUrl } : {}),
      ...(store.hours
        ? {
            openingHours: store.hours,
          }
        : {}),
      priceRange: "₹₹₹",
    };
  });

  if (businesses.length === 1) {
    return {
      "@context": "https://schema.org",
      ...businesses[0],
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: businesses.map((biz, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: biz,
    })),
  };
}

/** Strip trailing "| VIDYORA" so the root title template does not double the brand. */
export function seoPageTitle(title: string) {
  return title.replace(/\s*\|\s*VIDYORA(\s+Blog)?\s*$/i, "").trim();
}

export function generateItemListStructuredData(options: {
  name: string;
  description?: string;
  url: string;
  items: Array<{ name: string; url: string; image?: string | null }>;
}) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: options.name,
    ...(options.description ? { description: options.description } : {}),
    url: absoluteUrl(options.url) || options.url,
    numberOfItems: options.items.length,
    itemListElement: options.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(item.url) || `${siteUrl}${item.url.startsWith("/") ? item.url : `/${item.url}`}`,
      name: item.name,
      ...(absoluteUrl(item.image || undefined)
        ? { image: absoluteUrl(item.image || undefined) }
        : {}),
    })),
  };
}

export function generateCollectionPageStructuredData(options: {
  name: string;
  description: string;
  url: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: options.name,
    description: options.description,
    url: absoluteUrl(options.url) || options.url,
    ...(absoluteUrl(options.image)
      ? { image: absoluteUrl(options.image) }
      : {}),
    isPartOf: {
      "@type": "WebSite",
      name: "VIDYORA",
      url: getSiteUrl(),
    },
  };
}
