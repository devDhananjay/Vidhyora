import Link from "next/link";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/content/homepage-defaults";
import type {
  HomepageMoodboardNote,
  HomepageMoodboardPolaroid,
} from "@/lib/validations/homepage";
import { MediaFill } from "@/components/storefront/media-fill";

type WeddingMoodboardProps = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  href?: string;
  polaroids?: HomepageMoodboardPolaroid[];
  notes?: HomepageMoodboardNote[];
};

function Tape() {
  return (
    <span
      className="pointer-events-none absolute top-0 left-1/2 z-20 h-[22px] w-[34px] -translate-x-1/2 -translate-y-[42%] rotate-[-2deg]"
      style={{
        background:
          "linear-gradient(120deg, rgba(232,210,170,0.45) 0%, rgba(210,185,140,0.62) 45%, rgba(232,210,170,0.4) 100%)",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.35), 0 1px 2px rgba(70,45,20,0.1)",
        clipPath: "polygon(4% 0, 96% 0, 100% 14%, 96% 100%, 4% 100%, 0 12%)",
      }}
      aria-hidden
    />
  );
}

function Polaroid({
  item,
  href,
}: {
  item: HomepageMoodboardPolaroid;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group absolute"
      style={{
        top: item.top,
        left: item.left,
        width: item.w,
        zIndex: item.z,
        transform: `rotate(${item.rotate}deg)`,
      }}
    >
      <div className="relative bg-white p-[5px] pb-[28px] shadow-[0_8px_22px_rgba(55,35,20,0.14)] transition duration-400 group-hover:-translate-y-0.5 group-hover:shadow-[0_14px_28px_rgba(55,35,20,0.18)]">
        <Tape />
        <div className="relative aspect-square overflow-hidden bg-[#efe6dc]">
          <MediaFill
            src={item.image}
            alt={item.caption}
            className="object-cover"
            sizes="160px"
            play
          />
        </div>
        <p className="absolute inset-x-1 bottom-[5px] text-center font-[family-name:var(--font-caveat)] text-[15px] leading-none text-[#8b2e2e]">
          {item.caption}
        </p>
      </div>
    </Link>
  );
}

function Note({ note }: { note: HomepageMoodboardNote }) {
  return (
    <div
      className="absolute"
      style={{
        top: note.top,
        left: note.left,
        width: note.w,
        zIndex: note.z,
        transform: `rotate(${note.rotate}deg)`,
      }}
    >
      <div className="border border-[#e8dccb] bg-[#fffaf3] px-3 py-2.5 shadow-[0_8px_18px_rgba(55,35,20,0.1)]">
        {note.label ? (
          <p className="text-[9px] tracking-[0.18em] text-neutral-400 uppercase">
            {note.label}
          </p>
        ) : null}
        <p
          className={`font-[family-name:var(--font-caveat)] leading-[1.15] text-[#8b2e2e] ${
            note.label ? "mt-1 text-[1.2rem] md:text-[1.35rem]" : "text-lg"
          }`}
        >
          {note.text}
        </p>
      </div>
    </div>
  );
}

export function WeddingMoodboard({
  eyebrow = DEFAULT_HOMEPAGE_CONFIG.weddingMoodboard.eyebrow,
  title = DEFAULT_HOMEPAGE_CONFIG.weddingMoodboard.title,
  subtitle = DEFAULT_HOMEPAGE_CONFIG.weddingMoodboard.subtitle,
  ctaLabel = DEFAULT_HOMEPAGE_CONFIG.weddingMoodboard.ctaLabel,
  href = DEFAULT_HOMEPAGE_CONFIG.weddingMoodboard.href,
  polaroids = DEFAULT_HOMEPAGE_CONFIG.weddingMoodboard.polaroids,
  notes = DEFAULT_HOMEPAGE_CONFIG.weddingMoodboard.notes,
}: WeddingMoodboardProps) {
  const boardPolaroids =
    polaroids.length > 0
      ? polaroids
      : DEFAULT_HOMEPAGE_CONFIG.weddingMoodboard.polaroids;
  const boardNotes =
    notes.length > 0 ? notes : DEFAULT_HOMEPAGE_CONFIG.weddingMoodboard.notes;

  return (
    <section className="relative overflow-hidden py-14 md:py-16">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "#f3eee6",
          backgroundImage: `
            radial-gradient(rgba(110,80,50,0.05) 0.65px, transparent 0.65px),
            radial-gradient(rgba(90,60,40,0.03) 1px, transparent 1px),
            linear-gradient(180deg, #f7f2ea 0%, #f1ebe1 100%)
          `,
          backgroundSize: "15px 15px, 38px 38px, 100% 100%",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.11]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-serif text-[11px] tracking-[0.28em] text-[#c4a484] uppercase">
            {eyebrow}
          </p>
          <h2 className="mt-3 font-serif text-[1.7rem] tracking-[0.08em] text-[#8b2e2e] uppercase md:text-[2.6rem]">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-lg font-serif text-[13px] leading-relaxed text-neutral-500 italic md:text-sm">
            {subtitle}
          </p>
        </div>

        <div className="mt-9 md:hidden">
          <div className="flex flex-wrap justify-center gap-3">
            {boardPolaroids.slice(0, 6).map((item) => (
              <Link
                key={`${item.caption}-${item.left}`}
                href={href}
                className="w-[46%]"
                style={{ transform: `rotate(${item.rotate * 0.5}deg)` }}
              >
                <div className="relative bg-white p-[5px] pb-[26px] shadow-[0_8px_20px_rgba(55,35,20,0.12)]">
                  <Tape />
                  <div className="relative aspect-square overflow-hidden">
                    <MediaFill
                      src={item.image}
                      alt={item.caption}
                      className="object-cover"
                      sizes="160px"
                      play
                    />
                  </div>
                  <p className="absolute inset-x-1 bottom-[4px] text-center font-[family-name:var(--font-caveat)] text-[14px] leading-none text-[#8b2e2e]">
                    {item.caption}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {boardNotes.map((note) => (
              <div
                key={note.label ?? note.text}
                className="border border-[#e8dccb] bg-[#fffaf3] px-2.5 py-2 shadow-sm"
              >
                {note.label ? (
                  <p className="text-[8px] tracking-[0.14em] text-neutral-400 uppercase">
                    {note.label}
                  </p>
                ) : null}
                <p className="mt-1 font-[family-name:var(--font-caveat)] text-[1.15rem] leading-tight text-[#8b2e2e]">
                  {note.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative mx-auto mt-10 hidden h-[560px] w-full max-w-[920px] md:block lg:h-[600px]">
          <div
            className="pointer-events-none absolute top-[12%] left-1/2 z-[1] h-[70%] w-[56%] -translate-x-1/2 rotate-[2deg]"
            aria-hidden
          >
            <div className="absolute -bottom-3 left-[8%] right-[8%] h-6 rounded-[100%] bg-black/10 blur-md" />
            <div className="absolute inset-x-[-1.5%] inset-y-[-2%] rounded-[3px] bg-[#c9b497] shadow-[0_18px_40px_rgba(60,40,20,0.16)]" />
            <div className="absolute inset-x-[-0.5%] inset-y-[-0.8%] rounded-[2px] bg-[#ddc9a8]" />
            <div
              className="absolute inset-y-0 left-0 w-1/2 origin-right overflow-hidden rounded-l-[2px] bg-[#fffcf7]"
              style={{
                transform: "perspective(900px) rotateY(4deg)",
                boxShadow:
                  "inset -18px 0 28px rgba(80,55,30,0.08), inset 0 0 0 1px rgba(220,205,180,0.55)",
              }}
            >
              <div
                className="absolute inset-x-5 top-6 bottom-6 opacity-[0.42]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(transparent, transparent 21px, #d5c8b6 21px, #d5c8b6 22px)",
                }}
              />
              <div className="absolute inset-y-5 left-4 w-px bg-[#e5a8a4]/70" />
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[rgba(90,60,30,0.12)] to-transparent" />
            </div>
            <div
              className="absolute inset-y-0 right-0 w-1/2 origin-left overflow-hidden rounded-r-[2px] bg-[#fffaf3]"
              style={{
                transform: "perspective(900px) rotateY(-4deg)",
                boxShadow:
                  "inset 18px 0 28px rgba(80,55,30,0.08), inset 0 0 0 1px rgba(220,205,180,0.55)",
              }}
            >
              <div
                className="absolute inset-x-5 top-6 bottom-6 opacity-[0.42]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(transparent, transparent 21px, #d5c8b6 21px, #d5c8b6 22px)",
                }}
              />
              <div className="absolute inset-y-5 left-5 w-px bg-[#e5a8a4]/55" />
              <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[rgba(90,60,30,0.12)] to-transparent" />
            </div>
            <div className="absolute inset-y-[1%] left-1/2 z-[2] w-[10px] -translate-x-1/2 rounded-sm bg-gradient-to-r from-[#cbb691] via-[#e8d8b8] to-[#cbb691] shadow-[0_0_10px_rgba(70,45,20,0.18)]" />
            <div className="absolute inset-y-[6%] left-1/2 z-[3] w-[2px] -translate-x-1/2 bg-[#b79d78]/70" />
          </div>

          <p
            className="pointer-events-none absolute z-[2] font-[family-name:var(--font-caveat)] text-2xl text-[#8b2e2e]/70"
            style={{ top: "6%", left: "48%", transform: "rotate(-8deg)" }}
          >
            so soon…
          </p>
          <p
            className="pointer-events-none absolute z-[2] font-[family-name:var(--font-caveat)] text-xl text-[#8b2e2e]/65"
            style={{ top: "86%", left: "70%", transform: "rotate(5deg)" }}
          >
            kept forever
          </p>

          {boardPolaroids.map((item) => (
            <Polaroid
              key={`${item.caption}-${item.left}-${item.top}`}
              item={item}
              href={href}
            />
          ))}
          {boardNotes.map((note) => (
            <Note key={note.label ?? note.text} note={note} />
          ))}
        </div>

        <div className="mt-8 text-center md:mt-4">
          <Link
            href={href}
            className="inline-flex items-center rounded-full border border-[#8b2e2e]/25 bg-[#8b2e2e] px-6 py-2.5 text-[11px] tracking-[0.18em] text-white uppercase transition hover:bg-[#7a2727]"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
