import Link from "next/link";
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
import {
  imageUrlsForProduct,
  isBestSellerFlag,
} from "@/lib/products/product-card-data";
import { getHomepageConfig } from "@/lib/content/get-homepage";
import { StyleStories } from "@/components/storefront/style-stories";
import { ChooseYourLook } from "@/components/storefront/choose-your-look";
import { WeddingMoodboard } from "@/components/storefront/wedding-moodboard";
import { ExploreTraditions } from "@/components/storefront/explore-traditions";
import { HeroBannerSlider } from "@/components/storefront/hero-banner-slider";
import { MediaFill } from "@/components/storefront/media-fill";

const ASSURANCE_ICONS = [Hammer, HeartHandshake, Gem] as const;
const EXCHANGE_ICONS = [RefreshCcw, Shield, Sparkles, Award] as const;

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
  const [featuredProducts, homepage] = await Promise.all([
    getFeaturedProducts(),
    getHomepageConfig(),
  ]);

  const {
    collections,
    categories,
    trending,
    world,
    featured,
    assurance,
    exchange,
    hero,
    chooseYourLook,
    styleStories,
    exploreTraditions,
    weddingMoodboard,
  } = homepage;

  return (
    <div className="bg-white text-[#2b1a16]">
      <HeroBannerSlider slides={hero.slides} />

      {/* Collections mosaic */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <SectionHeading
          title={collections.title}
          subtitle={collections.subtitle}
        />
        <div className="grid gap-4 md:grid-cols-2 md:grid-rows-2">
          {collections.cards.map((card) => {
            const isTall = card.span === "tall";
            return (
              <Link
                key={card.id}
                href={card.href}
                className={
                  isTall
                    ? "group relative min-h-[280px] overflow-hidden rounded-2xl md:row-span-2 md:min-h-[540px]"
                    : "group relative min-h-[240px] overflow-hidden rounded-2xl"
                }
              >
                <MediaFill
                  src={card.image}
                  alt={card.title}
                  className="object-cover transition duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div
                  className={
                    isTall
                      ? "absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                      : "absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"
                  }
                />
                {isTall ? (
                  <div className="absolute bottom-6 left-4 text-white sm:bottom-8 sm:left-8">
                    <p className="font-serif text-3xl sm:text-4xl md:text-5xl">
                      {card.title}
                    </p>
                    {card.subtitle ? (
                      <p className="mt-2 text-sm text-white/80">
                        {card.subtitle}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="absolute bottom-6 left-6 font-serif text-2xl text-white">
                    {card.title}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Shop by categories */}
      <section className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <SectionHeading
          title={categories.title}
          subtitle={categories.subtitle}
        />
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
          {categories.items.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="group text-center"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#dce8e6]">
                <MediaFill
                  src={category.image}
                  alt={category.name}
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
            href={categories.viewAll.href}
            className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-neutral-200 bg-white p-6 text-center"
          >
            <p className="font-serif text-2xl text-[#8b2e2e]">
              {categories.viewAll.countLabel}
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              {categories.viewAll.caption}
            </p>
            <span className="mt-6 text-xs tracking-[0.2em] text-[#8b2e2e] uppercase">
              View All
            </span>
          </Link>
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading title={trending.title} subtitle={trending.subtitle} />
        <div className="grid gap-6 md:grid-cols-3">
          {trending.items.map((item) => (
            <Link key={item.title} href={item.href} className="group">
              <div className="relative aspect-square overflow-hidden rounded-2xl">
                <MediaFill
                  src={item.image}
                  alt={item.title}
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
        <SectionHeading title={world.title} subtitle={world.subtitle} />
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href={world.wedding.href}
            className="group relative min-h-[280px] overflow-hidden rounded-2xl md:min-h-full"
          >
            <MediaFill
              src={world.wedding.image}
              alt={world.wedding.title}
              className="object-cover transition duration-700 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-8">
              <p className="font-serif text-3xl text-white md:text-4xl">
                {world.wedding.title}
              </p>
              <p className="mt-1 text-sm text-white/80">
                {world.wedding.subtitle}
              </p>
            </div>
          </Link>
          <div className="grid gap-4">
            <div className="group relative min-h-[240px] overflow-hidden rounded-2xl bg-[#faf6f0]">
              <MediaFill
                src={world.diamond.videoSrc}
                alt={world.diamond.title}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <Link
                href={world.diamond.href}
                className="absolute inset-0 z-10"
                aria-label={`Shop ${world.diamond.title} jewellery`}
              >
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent p-6">
                  <span className="font-serif text-2xl text-white drop-shadow-sm">
                    {world.diamond.title}
                  </span>
                </span>
              </Link>
            </div>
            <Link
              href={world.gold.href}
              className="group relative min-h-[240px] overflow-hidden rounded-2xl"
            >
              <MediaFill
                src={world.gold.image}
                alt={`${world.gold.title} jewellery`}
                className="object-cover transition duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-6">
                <p className="font-serif text-2xl text-white">
                  {world.gold.title}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <WeddingMoodboard
        eyebrow={weddingMoodboard.eyebrow}
        title={weddingMoodboard.title}
        subtitle={weddingMoodboard.subtitle}
        ctaLabel={weddingMoodboard.ctaLabel}
        href={weddingMoodboard.href}
        polaroids={weddingMoodboard.polaroids}
        notes={weddingMoodboard.notes}
      />
      <ExploreTraditions
        title={exploreTraditions.title}
        items={exploreTraditions.items}
      />

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading title={featured.title} subtitle={featured.subtitle} />
        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
        <div className="mt-12 text-center">
          <Link
            href={featured.viewAllHref}
            className="inline-flex items-center border border-[#2b1a16] px-8 py-3 text-xs tracking-[0.2em] uppercase transition hover:bg-[#2b1a16] hover:text-white"
          >
            View All
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </div>
      </section>

      {/* Choose Your Look + Styling 101 (kept together, above Assurance) */}
      <ChooseYourLook
        title={chooseYourLook.title}
        looks={chooseYourLook.looks}
      />
      <StyleStories
        eyebrow={styleStories.eyebrow}
        title={styleStories.title}
        subtitle={styleStories.subtitle}
        stories={styleStories.stories}
      />

      {/* Assurance */}
      <section className="border-y border-neutral-100 bg-[#faf8f6] py-16">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 md:grid-cols-2">
          <div>
            <h2 className="font-serif text-4xl md:text-5xl">
              {assurance.titlePrefix}{" "}
              <span className="text-[#8b2e2e]">{assurance.titleAccent}</span>
            </h2>
            <p className="mt-4 text-neutral-500">{assurance.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3 sm:gap-6">
            {assurance.items.map((item, index) => {
              const Icon = ASSURANCE_ICONS[index] ?? Gem;
              return (
                <div key={item.label}>
                  <Icon
                    className="mx-auto size-10 text-[#b08d57]"
                    strokeWidth={1.25}
                  />
                  <p className="mt-3 text-xs tracking-wide text-neutral-700">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-14">
        <div className="mx-auto mb-10 max-w-3xl px-4 text-center">
          <h2 className="font-serif text-3xl md:text-4xl">{exchange.title}</h2>
          <p className="mt-2 text-sm text-neutral-500">{exchange.subtitle}</p>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-4 md:grid-cols-4">
          {exchange.items.map((item, index) => {
            const Icon = EXCHANGE_ICONS[index] ?? Award;
            return (
              <div key={item.label} className="text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-[#d4b484]">
                  <Icon
                    className="size-7 text-[#b08d57]"
                    strokeWidth={1.25}
                  />
                </div>
                <p className="mt-3 text-xs tracking-wide text-neutral-700">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
