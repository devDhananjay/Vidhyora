import type { Product, ProductVariant, Category } from "@prisma/client";

type ProductWithRelations = Product & {
  category: Category;
  variants: ProductVariant[];
};

export function generateProductStructuredData(product: ProductWithRelations) {
  const basePrice = Number(product.basePrice);

  const lowestPrice = product.variants.length > 0
    ? Math.min(...product.variants.map((v) => Number(v.price)))
    : basePrice;

  const highestPrice = product.variants.length > 0
    ? Math.max(...product.variants.map((v) => Number(v.price)))
    : basePrice;

  const inStock = product.variants.some((v) => v.stock > 0);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.thumbnail || undefined,
    brand: {
      "@type": "Brand",
      name: product.brand,
    },
    category: product.category.name,
    sku: product.id,
    offers: {
      "@type": product.variants.length > 1 ? "AggregateOffer" : "Offer",
      url: `${process.env.NEXT_PUBLIC_APP_URL}/products/${product.slug}`,
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
    },
  };

  return structuredData;
}

export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateOrganizationStructuredData(options: {
  name: string;
  url: string;
  email?: string;
  phone?: string;
  logo?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: options.name,
    url: options.url,
    ...(options.logo ? { logo: options.logo } : {}),
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
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: options.name,
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
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: options.title,
    description: options.description,
    url: options.url,
    ...(options.image ? { image: [options.image] } : {}),
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
      url: process.env.NEXT_PUBLIC_APP_URL || "https://vidyora.co.in",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": options.url,
    },
  };
}
