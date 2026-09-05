"use client";

import {
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Save } from "lucide-react";
import {
  resetHomepageConfig,
  saveHomepageConfig,
} from "@/actions/admin/manage-homepage";
import { MediaUrlField } from "@/components/admin/media-url-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { HomepageConfigData } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

type SectionId =
  | "hero"
  | "collections"
  | "categories"
  | "trending"
  | "world"
  | "weddingMoodboard"
  | "exploreTraditions"
  | "featured"
  | "chooseYourLook"
  | "styleStories"
  | "assurance"
  | "exchange";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "hero", label: "Hero Banners (auto-scroll)" },
  { id: "collections", label: "Collections" },
  { id: "categories", label: "Categories" },
  { id: "trending", label: "Trending" },
  { id: "world", label: "World" },
  { id: "weddingMoodboard", label: "Wedding Moodboard" },
  { id: "exploreTraditions", label: "Explore Traditions" },
  { id: "featured", label: "Featured" },
  { id: "chooseYourLook", label: "Choose Your Look" },
  { id: "styleStories", label: "Style Stories (3 cards)" },
  { id: "assurance", label: "Assurance" },
  { id: "exchange", label: "Exchange" },
];

type HomepageEditorProps = {
  initialData: HomepageConfigData;
  updatedAt: string | null;
  source: "database" | "default";
};

export function HomepageEditor({
  initialData,
  updatedAt,
  source,
}: HomepageEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<HomepageConfigData>(initialData);
  const [section, setSection] = useState<SectionId>("hero");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(initialData, null, 2),
  );

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveHomepageConfig(data);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage("Homepage saved. Storefront will use the new config.");
      setJsonText(JSON.stringify(data, null, 2));
      router.refresh();
    });
  }

  function saveFromJson() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        setError("Invalid JSON");
        return;
      }
      const result = await saveHomepageConfig(parsed);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setData(parsed as HomepageConfigData);
      setMessage("Saved from JSON.");
      router.refresh();
    });
  }

  function reset() {
    if (
      !confirm(
        "Reset homepage to the built-in default? Unsaved custom edits will be lost.",
      )
    ) {
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await resetHomepageConfig();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setData(result.data.data);
      setJsonText(JSON.stringify(result.data.data, null, 2));
      setMessage("Reset to default homepage.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Source:{" "}
            <span className="font-medium text-foreground">
              {source === "database" ? "Database" : "Built-in default"}
            </span>
            {updatedAt ? (
              <>
                {" "}
                · Last saved {new Date(updatedAt).toLocaleString("en-IN")}
              </>
            ) : null}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit copy, links, and media. Any image slot accepts a video (and
            vice versa). Assurance/Exchange icons stay fixed by index.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={reset}
            disabled={isPending}
            className="gap-2"
          >
            <RotateCcw className="size-4" />
            Reset default
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={isPending}
            className="gap-2"
          >
            <Save className="size-4" />
            {isPending ? "Saving..." : "Save homepage"}
          </Button>
        </div>
      </div>

      {message ? (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={cn(
                  "w-full rounded-lg border px-3 py-2 text-left text-sm transition",
                  section === item.id
                    ? "border-[#8b2e2e] bg-[#8b2e2e]/5 font-medium"
                    : "border-transparent hover:border-border hover:bg-muted/40",
                )}
              >
                {item.label}
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="min-w-0 space-y-4">
          {section === "hero" ? (
            <HeroForm data={data} setData={setData} />
          ) : null}
          {section === "collections" ? (
            <CollectionsForm data={data} setData={setData} />
          ) : null}
          {section === "categories" ? (
            <CategoriesForm data={data} setData={setData} />
          ) : null}
          {section === "trending" ? (
            <TrendingForm data={data} setData={setData} />
          ) : null}
          {section === "world" ? (
            <WorldForm data={data} setData={setData} />
          ) : null}
          {section === "weddingMoodboard" ? (
            <WeddingMoodboardForm data={data} setData={setData} />
          ) : null}
          {section === "exploreTraditions" ? (
            <ExploreTraditionsForm data={data} setData={setData} />
          ) : null}
          {section === "featured" ? (
            <FeaturedForm data={data} setData={setData} />
          ) : null}
          {section === "chooseYourLook" ? (
            <ChooseLookForm data={data} setData={setData} />
          ) : null}
          {section === "styleStories" ? (
            <StyleStoriesForm data={data} setData={setData} />
          ) : null}
          {section === "assurance" ? (
            <AssuranceForm data={data} setData={setData} />
          ) : null}
          {section === "exchange" ? (
            <ExchangeForm data={data} setData={setData} />
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Advanced JSON</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setShowJson((v) => !v);
              setJsonText(JSON.stringify(data, null, 2));
            }}
          >
            {showJson ? "Hide" : "Show"} JSON
          </Button>
        </CardHeader>
        {showJson ? (
          <CardContent className="space-y-3">
            <Textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="min-h-[320px] font-mono text-xs"
            />
            <Button
              type="button"
              onClick={saveFromJson}
              disabled={isPending}
              className="gap-2"
            >
              <Save className="size-4" />
              Save JSON
            </Button>
          </CardContent>
        ) : null}
      </Card>
    </div>
  );
}

type FormProps = {
  data: HomepageConfigData;
  setData: Dispatch<SetStateAction<HomepageConfigData>>;
};

function Field({
  label,
  value,
  onChange,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function CollectionsForm({ data, setData }: FormProps) {
  const section = data.collections;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Collections mosaic</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Title"
            value={section.title}
            onChange={(title) =>
              setData((prev) => ({
                ...prev,
                collections: { ...prev.collections, title },
              }))
            }
          />
          <Field
            label="Subtitle"
            value={section.subtitle}
            onChange={(subtitle) =>
              setData((prev) => ({
                ...prev,
                collections: { ...prev.collections, subtitle },
              }))
            }
          />
        </div>
        {section.cards.map((card, index) => (
          <div key={card.id} className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">
              Card · {card.id}
              {card.span === "tall" ? " (tall)" : ""}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Title"
                value={card.title}
                onChange={(title) =>
                  setData((prev) => ({
                    ...prev,
                    collections: {
                      ...prev.collections,
                      cards: prev.collections.cards.map((c, i) =>
                        i === index ? { ...c, title } : c,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Subtitle"
                value={card.subtitle ?? ""}
                onChange={(subtitle) =>
                  setData((prev) => ({
                    ...prev,
                    collections: {
                      ...prev.collections,
                      cards: prev.collections.cards.map((c, i) =>
                        i === index
                          ? { ...c, subtitle: subtitle || undefined }
                          : c,
                      ),
                    },
                  }))
                }
              />
              <Field
                className="sm:col-span-2"
                label="Href"
                value={card.href}
                onChange={(href) =>
                  setData((prev) => ({
                    ...prev,
                    collections: {
                      ...prev.collections,
                      cards: prev.collections.cards.map((c, i) =>
                        i === index ? { ...c, href } : c,
                      ),
                    },
                  }))
                }
              />
              <MediaUrlField
                className="sm:col-span-2"
                label="Media (image or video)"
                value={card.image}
                onChange={(image) =>
                  setData((prev) => ({
                    ...prev,
                    collections: {
                      ...prev.collections,
                      cards: prev.collections.cards.map((c, i) =>
                        i === index ? { ...c, image } : c,
                      ),
                    },
                  }))
                }
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function CategoriesForm({ data, setData }: FormProps) {
  const section = data.categories;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Shop by categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Title"
            value={section.title}
            onChange={(title) =>
              setData((prev) => ({
                ...prev,
                categories: { ...prev.categories, title },
              }))
            }
          />
          <Field
            label="Subtitle"
            value={section.subtitle}
            onChange={(subtitle) =>
              setData((prev) => ({
                ...prev,
                categories: { ...prev.categories, subtitle },
              }))
            }
          />
        </div>
        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
          <Field
            label="View all count"
            value={section.viewAll.countLabel}
            onChange={(countLabel) =>
              setData((prev) => ({
                ...prev,
                categories: {
                  ...prev.categories,
                  viewAll: { ...prev.categories.viewAll, countLabel },
                },
              }))
            }
          />
          <Field
            label="View all caption"
            value={section.viewAll.caption}
            onChange={(caption) =>
              setData((prev) => ({
                ...prev,
                categories: {
                  ...prev.categories,
                  viewAll: { ...prev.categories.viewAll, caption },
                },
              }))
            }
          />
          <Field
            label="View all href"
            value={section.viewAll.href}
            onChange={(href) =>
              setData((prev) => ({
                ...prev,
                categories: {
                  ...prev.categories,
                  viewAll: { ...prev.categories.viewAll, href },
                },
              }))
            }
          />
        </div>
        {section.items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="space-y-3 rounded-lg border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Name"
                value={item.name}
                onChange={(name) =>
                  setData((prev) => ({
                    ...prev,
                    categories: {
                      ...prev.categories,
                      items: prev.categories.items.map((c, i) =>
                        i === index ? { ...c, name } : c,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Href"
                value={item.href}
                onChange={(href) =>
                  setData((prev) => ({
                    ...prev,
                    categories: {
                      ...prev.categories,
                      items: prev.categories.items.map((c, i) =>
                        i === index ? { ...c, href } : c,
                      ),
                    },
                  }))
                }
              />
              <MediaUrlField
                className="sm:col-span-2"
                label="Media (image or video)"
                value={item.image}
                previewClassName="h-20 w-20 sm:w-20"
                onChange={(image) =>
                  setData((prev) => ({
                    ...prev,
                    categories: {
                      ...prev.categories,
                      items: prev.categories.items.map((c, i) =>
                        i === index ? { ...c, image } : c,
                      ),
                    },
                  }))
                }
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function TrendingForm({ data, setData }: FormProps) {
  const section = data.trending;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Trending</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Title"
            value={section.title}
            onChange={(title) =>
              setData((prev) => ({
                ...prev,
                trending: { ...prev.trending, title },
              }))
            }
          />
          <Field
            label="Subtitle"
            value={section.subtitle}
            onChange={(subtitle) =>
              setData((prev) => ({
                ...prev,
                trending: { ...prev.trending, subtitle },
              }))
            }
          />
        </div>
        {section.items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="space-y-3 rounded-lg border p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Title"
                value={item.title}
                onChange={(title) =>
                  setData((prev) => ({
                    ...prev,
                    trending: {
                      ...prev.trending,
                      items: prev.trending.items.map((t, i) =>
                        i === index ? { ...t, title } : t,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Href"
                value={item.href}
                onChange={(href) =>
                  setData((prev) => ({
                    ...prev,
                    trending: {
                      ...prev.trending,
                      items: prev.trending.items.map((t, i) =>
                        i === index ? { ...t, href } : t,
                      ),
                    },
                  }))
                }
              />
              <MediaUrlField
                className="sm:col-span-2"
                label="Media (image or video)"
                value={item.image}
                onChange={(image) =>
                  setData((prev) => ({
                    ...prev,
                    trending: {
                      ...prev.trending,
                      items: prev.trending.items.map((t, i) =>
                        i === index ? { ...t, image } : t,
                      ),
                    },
                  }))
                }
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WorldForm({ data, setData }: FormProps) {
  const section = data.world;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">VIDYORA World</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Title"
            value={section.title}
            onChange={(title) =>
              setData((prev) => ({
                ...prev,
                world: { ...prev.world, title },
              }))
            }
          />
          <Field
            label="Subtitle"
            value={section.subtitle}
            onChange={(subtitle) =>
              setData((prev) => ({
                ...prev,
                world: { ...prev.world, subtitle },
              }))
            }
          />
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Wedding</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Title"
              value={section.wedding.title}
              onChange={(title) =>
                setData((prev) => ({
                  ...prev,
                  world: {
                    ...prev.world,
                    wedding: { ...prev.world.wedding, title },
                  },
                }))
              }
            />
            <Field
              label="Href"
              value={section.wedding.href}
              onChange={(href) =>
                setData((prev) => ({
                  ...prev,
                  world: {
                    ...prev.world,
                    wedding: { ...prev.world.wedding, href },
                  },
                }))
              }
            />
            <Field
              className="sm:col-span-2"
              label="Subtitle"
              value={section.wedding.subtitle}
              onChange={(subtitle) =>
                setData((prev) => ({
                  ...prev,
                  world: {
                    ...prev.world,
                    wedding: { ...prev.world.wedding, subtitle },
                  },
                }))
              }
            />
            <MediaUrlField
              className="sm:col-span-2"
              label="Media (image or video)"
              value={section.wedding.image}
              onChange={(image) =>
                setData((prev) => ({
                  ...prev,
                  world: {
                    ...prev.world,
                    wedding: { ...prev.world.wedding, image },
                  },
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Diamond</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Title"
              value={section.diamond.title}
              onChange={(title) =>
                setData((prev) => ({
                  ...prev,
                  world: {
                    ...prev.world,
                    diamond: { ...prev.world.diamond, title },
                  },
                }))
              }
            />
            <Field
              label="Href"
              value={section.diamond.href}
              onChange={(href) =>
                setData((prev) => ({
                  ...prev,
                  world: {
                    ...prev.world,
                    diamond: { ...prev.world.diamond, href },
                  },
                }))
              }
            />
            <MediaUrlField
              className="sm:col-span-2"
              label="Media (image or video)"
              value={section.diamond.videoSrc}
              onChange={(videoSrc) =>
                setData((prev) => ({
                  ...prev,
                  world: {
                    ...prev.world,
                    diamond: { ...prev.world.diamond, videoSrc },
                  },
                }))
              }
            />
          </div>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Gold</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Title"
              value={section.gold.title}
              onChange={(title) =>
                setData((prev) => ({
                  ...prev,
                  world: {
                    ...prev.world,
                    gold: { ...prev.world.gold, title },
                  },
                }))
              }
            />
            <Field
              label="Href"
              value={section.gold.href}
              onChange={(href) =>
                setData((prev) => ({
                  ...prev,
                  world: {
                    ...prev.world,
                    gold: { ...prev.world.gold, href },
                  },
                }))
              }
            />
            <MediaUrlField
              className="sm:col-span-2"
              label="Media (image or video)"
              value={section.gold.image}
              onChange={(image) =>
                setData((prev) => ({
                  ...prev,
                  world: {
                    ...prev.world,
                    gold: { ...prev.world.gold, image },
                  },
                }))
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeaturedForm({ data, setData }: FormProps) {
  const section = data.featured;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Featured products</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Title"
          value={section.title}
          onChange={(title) =>
            setData((prev) => ({
              ...prev,
              featured: { ...prev.featured, title },
            }))
          }
        />
        <Field
          label="Subtitle"
          value={section.subtitle}
          onChange={(subtitle) =>
            setData((prev) => ({
              ...prev,
              featured: { ...prev.featured, subtitle },
            }))
          }
        />
        <Field
          className="sm:col-span-2"
          label="View all href"
          value={section.viewAllHref}
          onChange={(viewAllHref) =>
            setData((prev) => ({
              ...prev,
              featured: { ...prev.featured, viewAllHref },
            }))
          }
        />
      </CardContent>
    </Card>
  );
}

function AssuranceForm({ data, setData }: FormProps) {
  const section = data.assurance;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Assurance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Title prefix"
            value={section.titlePrefix}
            onChange={(titlePrefix) =>
              setData((prev) => ({
                ...prev,
                assurance: { ...prev.assurance, titlePrefix },
              }))
            }
          />
          <Field
            label="Title accent"
            value={section.titleAccent}
            onChange={(titleAccent) =>
              setData((prev) => ({
                ...prev,
                assurance: { ...prev.assurance, titleAccent },
              }))
            }
          />
          <Field
            className="sm:col-span-2"
            label="Subtitle"
            value={section.subtitle}
            onChange={(subtitle) =>
              setData((prev) => ({
                ...prev,
                assurance: { ...prev.assurance, subtitle },
              }))
            }
          />
        </div>
        {section.items.map((item, index) => (
          <Field
            key={index}
            label={`Label ${index + 1} (icon fixed by index)`}
            value={item.label}
            onChange={(label) =>
              setData((prev) => ({
                ...prev,
                assurance: {
                  ...prev.assurance,
                  items: prev.assurance.items.map((a, i) =>
                    i === index ? { label } : a,
                  ) as HomepageConfigData["assurance"]["items"],
                },
              }))
            }
          />
        ))}
      </CardContent>
    </Card>
  );
}

function ExchangeForm({ data, setData }: FormProps) {
  const section = data.exchange;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exchange program</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Title"
            value={section.title}
            onChange={(title) =>
              setData((prev) => ({
                ...prev,
                exchange: { ...prev.exchange, title },
              }))
            }
          />
          <Field
            label="Subtitle"
            value={section.subtitle}
            onChange={(subtitle) =>
              setData((prev) => ({
                ...prev,
                exchange: { ...prev.exchange, subtitle },
              }))
            }
          />
        </div>
        {section.items.map((item, index) => (
          <Field
            key={index}
            label={`Label ${index + 1} (icon fixed by index)`}
            value={item.label}
            onChange={(label) =>
              setData((prev) => ({
                ...prev,
                exchange: {
                  ...prev.exchange,
                  items: prev.exchange.items.map((a, i) =>
                    i === index ? { label } : a,
                  ) as HomepageConfigData["exchange"]["items"],
                },
              }))
            }
          />
        ))}
      </CardContent>
    </Card>
  );
}

function HeroForm({ data, setData }: FormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Hero banners (auto-scrolling)
        </CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          These are the top homepage banners. Each slide media can be an image
          or video (videos autoplay muted).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {data.hero.slides.map((slide, index) => (
          <div key={slide.id} className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Slide · {slide.id}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Alt"
                value={slide.alt}
                onChange={(alt) =>
                  setData((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      slides: prev.hero.slides.map((s, i) =>
                        i === index ? { ...s, alt } : s,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Eyebrow"
                value={slide.eyebrow ?? ""}
                onChange={(eyebrow) =>
                  setData((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      slides: prev.hero.slides.map((s, i) =>
                        i === index
                          ? { ...s, eyebrow: eyebrow || undefined }
                          : s,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Title mode"
                value={slide.titleMode}
                onChange={(titleMode) =>
                  setData((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      slides: prev.hero.slides.map((s, i) =>
                        i === index
                          ? {
                              ...s,
                              titleMode: titleMode as typeof s.titleMode,
                            }
                          : s,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Title lines ( | separated)"
                value={slide.titleLines.join(" | ")}
                onChange={(raw) =>
                  setData((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      slides: prev.hero.slides.map((s, i) =>
                        i === index
                          ? {
                              ...s,
                              titleLines: raw
                                .split("|")
                                .map((part) => part.trim())
                                .filter(Boolean),
                            }
                          : s,
                      ),
                    },
                  }))
                }
              />
              <Field
                className="sm:col-span-2"
                label="Subtitle"
                value={slide.subtitle}
                onChange={(subtitle) =>
                  setData((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      slides: prev.hero.slides.map((s, i) =>
                        i === index ? { ...s, subtitle } : s,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="CTA"
                value={slide.cta}
                onChange={(cta) =>
                  setData((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      slides: prev.hero.slides.map((s, i) =>
                        i === index ? { ...s, cta } : s,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="CTA href"
                value={slide.ctaHref}
                onChange={(ctaHref) =>
                  setData((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      slides: prev.hero.slides.map((s, i) =>
                        i === index ? { ...s, ctaHref } : s,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Panel color"
                value={slide.panelColor}
                onChange={(panelColor) =>
                  setData((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      slides: prev.hero.slides.map((s, i) =>
                        i === index ? { ...s, panelColor } : s,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Panel className"
                value={slide.panelClassName}
                onChange={(panelClassName) =>
                  setData((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      slides: prev.hero.slides.map((s, i) =>
                        i === index ? { ...s, panelClassName } : s,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Content align"
                value={slide.contentAlign}
                onChange={(contentAlign) =>
                  setData((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      slides: prev.hero.slides.map((s, i) =>
                        i === index
                          ? {
                              ...s,
                              contentAlign:
                                contentAlign as typeof s.contentAlign,
                            }
                          : s,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="CTA className"
                value={slide.ctaClassName}
                onChange={(ctaClassName) =>
                  setData((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      slides: prev.hero.slides.map((s, i) =>
                        i === index ? { ...s, ctaClassName } : s,
                      ),
                    },
                  }))
                }
              />
              <MediaUrlField
                className="sm:col-span-2"
                label="Media (image or video)"
                value={slide.image}
                onChange={(image) =>
                  setData((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      slides: prev.hero.slides.map((s, i) =>
                        i === index ? { ...s, image } : s,
                      ),
                    },
                  }))
                }
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ChooseLookForm({ data, setData }: FormProps) {
  const section = data.chooseYourLook;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Choose Your Look</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Field
          label="Title"
          value={section.title}
          onChange={(title) =>
            setData((prev) => ({
              ...prev,
              chooseYourLook: { ...prev.chooseYourLook, title },
            }))
          }
        />
        {section.looks.map((look, index) => (
          <div key={look.id} className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Look · {look.id}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Title"
                value={look.title}
                onChange={(title) =>
                  setData((prev) => ({
                    ...prev,
                    chooseYourLook: {
                      ...prev.chooseYourLook,
                      looks: prev.chooseYourLook.looks.map((l, i) =>
                        i === index ? { ...l, title } : l,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Href"
                value={look.href}
                onChange={(href) =>
                  setData((prev) => ({
                    ...prev,
                    chooseYourLook: {
                      ...prev.chooseYourLook,
                      looks: prev.chooseYourLook.looks.map((l, i) =>
                        i === index ? { ...l, href } : l,
                      ),
                    },
                  }))
                }
              />
              <MediaUrlField
                className="sm:col-span-2"
                label="Media (image or video)"
                value={look.image}
                onChange={(image) =>
                  setData((prev) => ({
                    ...prev,
                    chooseYourLook: {
                      ...prev.chooseYourLook,
                      looks: prev.chooseYourLook.looks.map((l, i) =>
                        i === index ? { ...l, image } : l,
                      ),
                    },
                  }))
                }
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StyleStoriesForm({ data, setData }: FormProps) {
  const section = data.styleStories;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Style Stories</CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          Edit each card separately (title, poster, media, link). Videos
          autoplay when the card is active.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Eyebrow"
            value={section.eyebrow}
            onChange={(eyebrow) =>
              setData((prev) => ({
                ...prev,
                styleStories: { ...prev.styleStories, eyebrow },
              }))
            }
          />
          <Field
            label="Title"
            value={section.title}
            onChange={(title) =>
              setData((prev) => ({
                ...prev,
                styleStories: { ...prev.styleStories, title },
              }))
            }
          />
          <Field
            className="sm:col-span-2"
            label="Subtitle"
            value={section.subtitle}
            onChange={(subtitle) =>
              setData((prev) => ({
                ...prev,
                styleStories: { ...prev.styleStories, subtitle },
              }))
            }
          />
        </div>

        {section.stories.map((story, index) => (
          <div key={story.id} className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">
              Card {index + 1} · {story.id}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Title"
                value={story.title}
                onChange={(title) =>
                  setData((prev) => ({
                    ...prev,
                    styleStories: {
                      ...prev.styleStories,
                      stories: prev.styleStories.stories.map((s, i) =>
                        i === index ? { ...s, title } : s,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Href"
                value={story.href}
                onChange={(href) =>
                  setData((prev) => ({
                    ...prev,
                    styleStories: {
                      ...prev.styleStories,
                      stories: prev.styleStories.stories.map((s, i) =>
                        i === index ? { ...s, href } : s,
                      ),
                    },
                  }))
                }
              />
              <Field
                className="sm:col-span-2"
                label="Subtitle"
                value={story.subtitle}
                onChange={(subtitle) =>
                  setData((prev) => ({
                    ...prev,
                    styleStories: {
                      ...prev.styleStories,
                      stories: prev.styleStories.stories.map((s, i) =>
                        i === index ? { ...s, subtitle } : s,
                      ),
                    },
                  }))
                }
              />
              <MediaUrlField
                className="sm:col-span-2"
                label="Poster image"
                value={story.poster}
                onChange={(poster) =>
                  setData((prev) => ({
                    ...prev,
                    styleStories: {
                      ...prev.styleStories,
                      stories: prev.styleStories.stories.map((s, i) =>
                        i === index ? { ...s, poster } : s,
                      ),
                    },
                  }))
                }
                hint="Cover shown behind / when inactive. Prefer an image."
              />
              <MediaUrlField
                className="sm:col-span-2"
                label="Main media (image or video)"
                value={story.media}
                onChange={(media) =>
                  setData((prev) => ({
                    ...prev,
                    styleStories: {
                      ...prev.styleStories,
                      stories: prev.styleStories.stories.map((s, i) =>
                        i === index ? { ...s, media } : s,
                      ),
                    },
                  }))
                }
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ExploreTraditionsForm({ data, setData }: FormProps) {
  const section = data.exploreTraditions;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Explore the Traditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Field
          label="Section title"
          value={section.title}
          onChange={(title) =>
            setData((prev) => ({
              ...prev,
              exploreTraditions: { ...prev.exploreTraditions, title },
            }))
          }
        />
        {section.items.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">
              Tradition {index + 1} · {item.id}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Title"
                value={item.title}
                onChange={(title) =>
                  setData((prev) => ({
                    ...prev,
                    exploreTraditions: {
                      ...prev.exploreTraditions,
                      items: prev.exploreTraditions.items.map((t, i) =>
                        i === index ? { ...t, title } : t,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Href"
                value={item.href}
                onChange={(href) =>
                  setData((prev) => ({
                    ...prev,
                    exploreTraditions: {
                      ...prev.exploreTraditions,
                      items: prev.exploreTraditions.items.map((t, i) =>
                        i === index ? { ...t, href } : t,
                      ),
                    },
                  }))
                }
              />
              <Field
                className="sm:col-span-2"
                label="Subtitle"
                value={item.subtitle}
                onChange={(subtitle) =>
                  setData((prev) => ({
                    ...prev,
                    exploreTraditions: {
                      ...prev.exploreTraditions,
                      items: prev.exploreTraditions.items.map((t, i) =>
                        i === index ? { ...t, subtitle } : t,
                      ),
                    },
                  }))
                }
              />
              <MediaUrlField
                className="sm:col-span-2"
                label="Main media (image or video)"
                value={item.image}
                onChange={(image) =>
                  setData((prev) => ({
                    ...prev,
                    exploreTraditions: {
                      ...prev.exploreTraditions,
                      items: prev.exploreTraditions.items.map((t, i) =>
                        i === index ? { ...t, image } : t,
                      ),
                    },
                  }))
                }
              />
            </div>
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Moment pins
              </p>
              {item.moments.map((moment, mIndex) => (
                <div
                  key={`${moment.label}-${mIndex}`}
                  className="grid gap-3 rounded-md bg-muted/30 p-3 sm:grid-cols-2"
                >
                  <Field
                    label="Label"
                    value={moment.label}
                    onChange={(label) =>
                      setData((prev) => ({
                        ...prev,
                        exploreTraditions: {
                          ...prev.exploreTraditions,
                          items: prev.exploreTraditions.items.map((t, i) =>
                            i === index
                              ? {
                                  ...t,
                                  moments: t.moments.map((m, mi) =>
                                    mi === mIndex ? { ...m, label } : m,
                                  ),
                                }
                              : t,
                          ),
                        },
                      }))
                    }
                  />
                  <MediaUrlField
                    label="Media"
                    value={moment.image}
                    onChange={(image) =>
                      setData((prev) => ({
                        ...prev,
                        exploreTraditions: {
                          ...prev.exploreTraditions,
                          items: prev.exploreTraditions.items.map((t, i) =>
                            i === index
                              ? {
                                  ...t,
                                  moments: t.moments.map((m, mi) =>
                                    mi === mIndex ? { ...m, image } : m,
                                  ),
                                }
                              : t,
                          ),
                        },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function WeddingMoodboardForm({ data, setData }: FormProps) {
  const section = data.weddingMoodboard;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Wedding Moodboard</CardTitle>
        <p className="text-sm font-normal text-muted-foreground">
          Edit copy, CTA, polaroid photos (image or video), and sticky notes.
          Layout positions stay as designed.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Eyebrow"
            value={section.eyebrow}
            onChange={(eyebrow) =>
              setData((prev) => ({
                ...prev,
                weddingMoodboard: { ...prev.weddingMoodboard, eyebrow },
              }))
            }
          />
          <Field
            label="CTA label"
            value={section.ctaLabel}
            onChange={(ctaLabel) =>
              setData((prev) => ({
                ...prev,
                weddingMoodboard: { ...prev.weddingMoodboard, ctaLabel },
              }))
            }
          />
          <Field
            className="sm:col-span-2"
            label="Title"
            value={section.title}
            onChange={(title) =>
              setData((prev) => ({
                ...prev,
                weddingMoodboard: { ...prev.weddingMoodboard, title },
              }))
            }
          />
          <Field
            className="sm:col-span-2"
            label="Subtitle"
            value={section.subtitle}
            onChange={(subtitle) =>
              setData((prev) => ({
                ...prev,
                weddingMoodboard: { ...prev.weddingMoodboard, subtitle },
              }))
            }
          />
          <Field
            className="sm:col-span-2"
            label="CTA href"
            value={section.href}
            onChange={(href) =>
              setData((prev) => ({
                ...prev,
                weddingMoodboard: { ...prev.weddingMoodboard, href },
              }))
            }
          />
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium">Polaroids</p>
          {section.polaroids.map((item, index) => (
            <div key={`${item.caption}-${index}`} className="space-y-3 rounded-lg border p-4">
              <p className="text-sm font-medium">Polaroid {index + 1}</p>
              <Field
                label="Caption"
                value={item.caption}
                onChange={(caption) =>
                  setData((prev) => ({
                    ...prev,
                    weddingMoodboard: {
                      ...prev.weddingMoodboard,
                      polaroids: prev.weddingMoodboard.polaroids.map((p, i) =>
                        i === index ? { ...p, caption } : p,
                      ),
                    },
                  }))
                }
              />
              <MediaUrlField
                label="Media (image or video)"
                value={item.image}
                onChange={(image) =>
                  setData((prev) => ({
                    ...prev,
                    weddingMoodboard: {
                      ...prev.weddingMoodboard,
                      polaroids: prev.weddingMoodboard.polaroids.map((p, i) =>
                        i === index ? { ...p, image } : p,
                      ),
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium">Notes</p>
          {section.notes.map((note, index) => (
            <div key={`${note.label}-${index}`} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2">
              <Field
                label="Label"
                value={note.label ?? ""}
                onChange={(label) =>
                  setData((prev) => ({
                    ...prev,
                    weddingMoodboard: {
                      ...prev.weddingMoodboard,
                      notes: prev.weddingMoodboard.notes.map((n, i) =>
                        i === index
                          ? { ...n, label: label || undefined }
                          : n,
                      ),
                    },
                  }))
                }
              />
              <Field
                label="Text"
                value={note.text}
                onChange={(text) =>
                  setData((prev) => ({
                    ...prev,
                    weddingMoodboard: {
                      ...prev.weddingMoodboard,
                      notes: prev.weddingMoodboard.notes.map((n, i) =>
                        i === index ? { ...n, text } : n,
                      ),
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
