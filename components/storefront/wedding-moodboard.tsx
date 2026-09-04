import Image from "next/image";
import Link from "next/link";
import { shopHref } from "@/lib/nav/mega-menu-data";

const IMG = {
  bride:
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80",
  hands:
    "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=500&q=80",
  couple:
    "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=500&q=80",
  flowers:
    "https://images.unsplash.com/photo-1545235617-9465d2a55698?w=500&q=80",
  earrings:
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=500&q=80",
  necklace:
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500&q=80",
  ring: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500&q=80",
  gold: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=500&q=80",
  soft: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&q=80",
  venue:
    "https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=500&q=80",
} as const;

type Polaroid = {
  caption: string;
  image: string;
  rotate: number;
  top: string;
  left: string;
  /** width in px-ish % of board */
  w: number;
  z: number;
};

type Note = {
  label?: string;
  text: string;
  rotate: number;
  top: string;
  left: string;
  w: number;
  z: number;
};

/** Compact polaroids — sized like the Rivaah board */
const POLAROIDS: Polaroid[] = [
  {
    caption: "the whole mood.",
    image: IMG.bride,
    rotate: -6,
    top: "4%",
    left: "3%",
    w: 148,
    z: 5,
  },
  {
    caption: "soft, not loud.",
    image: IMG.flowers,
    rotate: 5,
    top: "2%",
    left: "22%",
    w: 132,
    z: 4,
  },
  {
    caption: "keep this one.",
    image: IMG.hands,
    rotate: -3,
    top: "8%",
    left: "72%",
    w: 140,
    z: 6,
  },
  {
    caption: "just the two of us.",
    image: IMG.couple,
    rotate: 4,
    top: "28%",
    left: "82%",
    w: 128,
    z: 5,
  },
  {
    caption: "her forever set.",
    image: IMG.necklace,
    rotate: -5,
    top: "48%",
    left: "78%",
    w: 136,
    z: 7,
  },
  {
    caption: "quiet sparkle.",
    image: IMG.earrings,
    rotate: 3,
    top: "58%",
    left: "4%",
    w: 124,
    z: 6,
  },
  {
    caption: "for the pheras.",
    image: IMG.gold,
    rotate: -4,
    top: "70%",
    left: "24%",
    w: 130,
    z: 5,
  },
  {
    caption: "a soft yes.",
    image: IMG.ring,
    rotate: 6,
    top: "72%",
    left: "58%",
    w: 118,
    z: 8,
  },
];

const NOTES: Note[] = [
  {
    label: "JEWELLERY",
    text: "Polki for the pheras, diamonds for the reception.",
    rotate: 2,
    top: "20%",
    left: "40%",
    w: 168,
    z: 9,
  },
  {
    label: "VENUE",
    text: "Check the courtyard lighting at 6pm.",
    rotate: -3,
    top: "34%",
    left: "8%",
    w: 150,
    z: 5,
  },
  {
    label: "MUST-DO",
    text: "Photo booth strip — one candid, one kiss.",
    rotate: 3,
    top: "38%",
    left: "52%",
    w: 158,
    z: 10,
  },
  {
    label: "NOTE TO SELF",
    text: "Marigolds & pampas — only if it stays soft.",
    rotate: -2,
    top: "54%",
    left: "36%",
    w: 170,
    z: 9,
  },
  {
    label: "COLOUR STORY",
    text: "Ivory, blush, a little antique gold.",
    rotate: 4,
    top: "78%",
    left: "8%",
    w: 156,
    z: 7,
  },
];

function Tape() {
  return (
    <span
      className="pointer-events-none absolute left-1/2 top-0 z-20 h-[22px] w-[34px] -translate-x-1/2 -translate-y-[42%] rotate-[-2deg]"
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

function Polaroid({ item, href }: { item: Polaroid; href: string }) {
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
          <Image
            src={item.image}
            alt={item.caption}
            fill
            className="object-cover"
            sizes="160px"
          />
        </div>
        <p className="absolute inset-x-1 bottom-[5px] text-center font-[family-name:var(--font-caveat)] text-[15px] leading-none text-[#8b2e2e]">
          {item.caption}
        </p>
      </div>
    </Link>
  );
}

function Note({ note }: { note: Note }) {
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

export function WeddingMoodboard() {
  const href = shopHref({ occasion: "wedding", collection: "Wedding Moodboard" });

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
            Pinned, pressed & kept
          </p>
          <h2 className="mt-3 font-serif text-[1.7rem] tracking-[0.08em] text-[#8b2e2e] uppercase md:text-[2.6rem]">
            VIDYORA Wedding Moodboard
          </h2>
          <p className="mx-auto mt-3 max-w-lg font-serif text-[13px] italic leading-relaxed text-neutral-500 md:text-sm">
            Every little clipping of a wedding being dreamt into being — mandap
            light, marigold gold, the lehenga she keeps coming back to.
          </p>
        </div>

        {/* Mobile: neat mini collage grid */}
        <div className="mt-9 md:hidden">
          <div className="flex flex-wrap justify-center gap-3">
            {POLAROIDS.slice(0, 6).map((item) => (
              <Link
                key={item.caption}
                href={href}
                className="w-[46%]"
                style={{ transform: `rotate(${item.rotate * 0.5}deg)` }}
              >
                <div className="relative bg-white p-[5px] pb-[26px] shadow-[0_8px_20px_rgba(55,35,20,0.12)]">
                  <Tape />
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.caption}
                      fill
                      className="object-cover"
                      sizes="160px"
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
            {NOTES.map((note) => (
              <div
                key={note.label}
                className="border border-[#e8dccb] bg-[#fffaf3] px-2.5 py-2 shadow-sm"
              >
                <p className="text-[8px] tracking-[0.14em] text-neutral-400 uppercase">
                  {note.label}
                </p>
                <p className="mt-1 font-[family-name:var(--font-caveat)] text-[1.15rem] leading-tight text-[#8b2e2e]">
                  {note.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop board — compact, Rivaah-like */}
        <div className="relative mx-auto mt-10 hidden h-[560px] w-full max-w-[920px] md:block lg:h-[600px]">
          {/* Open diary */}
          <div
            className="pointer-events-none absolute left-1/2 top-[12%] z-[1] h-[70%] w-[56%] -translate-x-1/2 rotate-[2deg]"
            aria-hidden
          >
            {/* Soft ground shadow under book */}
            <div className="absolute -bottom-3 left-[8%] right-[8%] h-6 rounded-[100%] bg-black/10 blur-md" />

            {/* Book cover / board peeking behind pages */}
            <div className="absolute inset-x-[-1.5%] inset-y-[-2%] rounded-[3px] bg-[#c9b497] shadow-[0_18px_40px_rgba(60,40,20,0.16)]" />
            <div className="absolute inset-x-[-0.5%] inset-y-[-0.8%] rounded-[2px] bg-[#ddc9a8]" />

            {/* Left page */}
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
              {/* page curl / gutter shade */}
              <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[rgba(90,60,30,0.12)] to-transparent" />
            </div>

            {/* Right page */}
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

            {/* Center spine / binding */}
            <div className="absolute inset-y-[1%] left-1/2 z-[2] w-[10px] -translate-x-1/2 rounded-sm bg-gradient-to-r from-[#cbb691] via-[#e8d8b8] to-[#cbb691] shadow-[0_0_10px_rgba(70,45,20,0.18)]" />
            <div className="absolute inset-y-[6%] left-1/2 z-[3] w-[2px] -translate-x-1/2 bg-[#b79d78]/70" />
          </div>

          {/* Soft script accents */}
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

          {POLAROIDS.map((item) => (
            <Polaroid key={item.caption} item={item} href={href} />
          ))}
          {NOTES.map((note) => (
            <Note key={note.label} note={note} />
          ))}
        </div>

        <div className="mt-8 text-center md:mt-4">
          <Link
            href={href}
            className="inline-flex items-center rounded-full border border-[#8b2e2e]/25 bg-[#8b2e2e] px-6 py-2.5 text-[11px] tracking-[0.18em] text-white uppercase transition hover:bg-[#7a2727]"
          >
            Explore wedding jewellery
          </Link>
        </div>
      </div>
    </section>
  );
}
