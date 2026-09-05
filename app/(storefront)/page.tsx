import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  Gem,
  Hammer,
  HeartHandshake,
  RefreshCcw,
  Shield,
  Sparkles,
} from "lucide-react";
import prisma from "@/lib/prisma";
import { ProductCard } from "@/components/products/product-card";
import { ROUTES } from "@/lib/constants";
import { shopHref } from "@/lib/nav/mega-menu-data";
import {
  imageUrlsForProduct,
  isBestSellerFlag,
} from "@/lib/products/product-card-data";
import { StyleStories } from "@/components/storefront/style-stories";
import { ChooseYourLook } from "@/components/storefront/choose-your-look";
import { WeddingMoodboard } from "@/components/storefront/wedding-moodboard";
import { ExploreTraditions } from "@/components/storefront/explore-traditions";
import { HeroBannerSlider } from "@/components/storefront/hero-banner-slider";
import { WorldBannerVideo } from "@/components/storefront/world-banner-video";

const CATEGORIES = [
  {
    name: "Earrings",
    href: shopHref({ item: "earrings", collection: "Earrings" }),
    image:
      "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80",
  },
  {
    name: "Finger Rings",
    href: shopHref({ item: "rings", collection: "Finger Rings" }),
    image:
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80",
  },
  {
    name: "Pendants",
    href: shopHref({ item: "pendants", collection: "Pendants" }),
    image:
      "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=800&q=80",
  },
  {
    name: "Necklaces",
    href: shopHref({ item: "necklaces", collection: "Necklaces" }),
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80",
  },
  {
    name: "Bracelets",
    href: shopHref({ item: "bracelets", collection: "Bracelets" }),
    image:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80",
  },
  {
    name: "Bangles",
    href: shopHref({ item: "bangles", collection: "Bangles" }),
    image:
      "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80",
  },
  {
    name: "Chains",
    href: shopHref({ item: "chains", collection: "Chains" }),
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80",
  },
];

const TRENDING = [
  {
    title: "Auspicious Occasion",
    href: shopHref({ occasion: "festive", collection: "Auspicious Occasion" }),
    image:
      "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=900&q=80",
  },
  {
    title: "Gifting Jewellery",
    href: shopHref({ occasion: "festive", collection: "Gifting" }),
    image:
      "https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=900&q=80",
  },
  {
    title: "Everyday Diamonds",
    href: shopHref({
      type: "diamond",
      occasion: "daily",
      collection: "Everyday Diamonds",
    }),
    image:
      "https://images.unsplash.com/photo-1603561596112-0a132b757442?w=900&q=80",
  },
];

async function getFeaturedProducts() {
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      approvalStatus: "APPROVED",
    },
    include: {
      variants: {
        where: { isActive: true },
        take: 1,
      },
      images: {
        select: { url: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    brand: p.brand,
    basePrice: Number(p.basePrice),
    compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
    thumbnail: p.thumbnail,
    images: imageUrlsForProduct(p),
    isBestSeller: isBestSellerFlag(p.attributes),
  }));
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-10 text-center">
      <h2 className="font-serif text-3xl text-primary md:text-5xl">{title}</h2>
      <span className="mx-auto mt-4 block h-px w-12 bg-primary/35" />
      <p className="mt-3 text-sm text-neutral-500 md:text-base">{subtitle}</p>
    </div>
  );
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="bg-white text-[#2b1a16]">
      <HeroBannerSlider />

      {/* Collections mosaic */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <SectionHeading
          title="VIDYORA Collections"
          subtitle="Explore our newly launched collection"
        />
        <div className="grid gap-4 md:grid-cols-2 md:grid-rows-2">
          <Link
            href={shopHref({ maxPrice: "50000", collection: "Under 50K" })}
            className="group relative min-h-[280px] overflow-hidden rounded-2xl md:row-span-2 md:min-h-[540px]"
          >
            <Image
              src="https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=1200&q=80"
              alt="Under 50k collection"
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-4 text-white sm:bottom-8 sm:left-8">
              <p className="font-serif text-3xl sm:text-4xl md:text-5xl">Under 50k</p>
              <p className="mt-2 text-sm text-white/80">Everyday diamond edit</p>
            </div>
          </Link>
          <Link
            href={shopHref({ item: "earrings", collection: "Earrings" })}
            className="group relative min-h-[240px] overflow-hidden rounded-2xl"
          >
            <Image
              src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000&q=80"
              alt="Earrings collection"
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <p className="absolute bottom-6 left-6 font-serif text-2xl text-white">
              Stunning in every Ear
            </p>
          </Link>
          <Link
            href={shopHref({ type: "gold", occasion: "daily", collection: "Gold Daily Wear" })}
            className="group relative min-h-[240px] overflow-hidden rounded-2xl"
          >
            <Image
              src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1000&q=80"
              alt="Gold collection"
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <p className="absolute bottom-6 left-6 font-serif text-2xl text-white">
              Gold Coins & Daily Wear
            </p>
          </Link>
        </div>
      </section>

      {/* Shop by categories */}
      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <SectionHeading
          title="Find Your Perfect Match"
          subtitle="Shop by Categories"
        />
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {CATEGORIES.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group text-center"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#dce8e6]">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
              <p className="mt-3 text-xs font-medium tracking-[0.18em] text-neutral-700 uppercase">
                {category.name}
              </p>
            </Link>
          ))}
          <Link
            href={ROUTES.products}
            className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white p-6 text-center"
          >
            <p className="font-serif text-2xl text-[#8b2e2e]">10+</p>
            <p className="mt-1 text-sm text-neutral-700">
              Categories to choose from
            </p>
            <span className="mt-6 text-xs tracking-[0.2em] text-[#8b2e2e] uppercase">
              View All
            </span>
          </Link>
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          title="Trending Now"
          subtitle="Jewellery pieces everyone's eyeing right now"
        />
        <div className="grid gap-6 md:grid-cols-3">
          {TRENDING.map((item) => (
            <Link key={item.title} href={item.href} className="group">
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <p className="mt-4 text-center text-sm tracking-wide text-neutral-700">
                {item.title}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Bridal world */}
      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <SectionHeading
          title="VIDYORA World"
          subtitle="A companion for every occasion"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href={shopHref({ occasion: "wedding", collection: "Wedding Jewellery" })}
            className="group relative overflow-hidden rounded-2xl"
          >
            <Image
              src="/images/bridal-rivaah.jpg"
              alt="Bridal jewellery"
              width={1200}
              height={800}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-8">
              <p className="font-serif text-3xl text-white md:text-4xl">Wedding</p>
              <p className="mt-1 text-sm text-white/80">
                Unforgettable jewels for the most memorable moment
              </p>
            </div>
          </Link>
          <div className="grid gap-4">
            <div className="group relative min-h-[240px] overflow-hidden rounded-2xl bg-[#faf6f0]">
              <WorldBannerVideo
                src="/videos/vidyora-world-diamond.mp4?v=4"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <Link
                href={shopHref({ type: "diamond", collection: "Diamond" })}
                className="absolute inset-0 z-10"
                aria-label="Shop Diamond jewellery"
              >
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent p-6">
                  <span className="font-serif text-2xl text-white drop-shadow-sm">
                    Diamond
                  </span>
                </span>
              </Link>
            </div>
            <Link
              href={shopHref({ type: "gold", collection: "Gold" })}
              className="group relative min-h-[240px] overflow-hidden rounded-2xl"
            >
              <Image
                src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1000&q=80"
                alt="Gold jewellery"
                fill
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-6">
                <p className="font-serif text-2xl text-white">Gold</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <WeddingMoodboard />
      <ExploreTraditions />

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          title="The Everyday Diamond Edit"
          subtitle="Handpicked pieces for every celebration"
        />
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
        <div className="mt-12 text-center">
          <Link
            href={ROUTES.products}
            className="inline-flex items-center border border-[#2b1a16] px-8 py-3 text-xs tracking-[0.2em] uppercase transition hover:bg-[#2b1a16] hover:text-white"
          >
            View All
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </div>
      </section>

      {/* Choose Your Look + Styling 101 (kept together, above Assurance) */}
      <ChooseYourLook />
      <StyleStories />

      {/* Assurance */}
      <section className="border-y border-neutral-100 bg-[#faf8f6] py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl">
              VIDYORA <span className="text-[#8b2e2e]">Assurance</span>
            </h2>
            <p className="mt-4 text-neutral-500">
              Crafted by experts, cherished by you.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3 sm:gap-6">
            <div>
              <Hammer className="mx-auto size-10 text-[#b08d57]" strokeWidth={1.25} />
              <p className="mt-3 text-xs tracking-wide text-neutral-700">
                Quality Craftsmanship
              </p>
            </div>
            <div>
              <HeartHandshake className="mx-auto size-10 text-[#b08d57]" strokeWidth={1.25} />
              <p className="mt-3 text-xs tracking-wide text-neutral-700">
                Ethically Sourced
              </p>
            </div>
            <div>
              <Gem className="mx-auto size-10 text-[#b08d57]" strokeWidth={1.25} />
              <p className="mt-3 text-xs tracking-wide text-neutral-700">
                100% Transparency
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-14">
        <div className="mx-auto mb-10 max-w-3xl px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl">Exchange Program</h2>
          <p className="mt-2 text-sm text-neutral-500">
            Trusted by families across India.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 md:grid-cols-4">
          {[
            { icon: RefreshCcw, label: "VIDYORA Exchange" },
            { icon: Shield, label: "The Purity Guarantee" },
            { icon: Sparkles, label: "Complete Transparency" },
            { icon: Award, label: "Lifetime Maintenance" },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-[#d4b484]">
                <item.icon className="size-7 text-[#b08d57]" strokeWidth={1.25} />
              </div>
              <p className="mt-3 text-xs tracking-wide text-neutral-700">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
