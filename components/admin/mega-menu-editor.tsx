"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
} from "lucide-react";
import {
  resetMegaMenuConfig,
  saveMegaMenuConfig,
} from "@/actions/admin/manage-mega-menu";
import { ImageUrlField } from "@/components/admin/image-url-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { MegaMenuConfigData } from "@/lib/validations/mega-menu";
import { cn } from "@/lib/utils";

type MegaMenuEditorProps = {
  initialData: MegaMenuConfigData;
  updatedAt: string | null;
  source: "database" | "default";
};

export function MegaMenuEditor({
  initialData,
  updatedAt,
  source,
}: MegaMenuEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<MegaMenuConfigData>(initialData);
  const [selectedId, setSelectedId] = useState(initialData.items[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(initialData, null, 2),
  );

  const selected = useMemo(
    () => data.items.find((item) => item.id === selectedId) ?? null,
    [data.items, selectedId],
  );

  function updateSelected(
    patch: Partial<MegaMenuConfigData["items"][number]>,
  ) {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === selectedId ? { ...item, ...patch } : item,
      ),
    }));
  }

  function moveTab(id: string, direction: -1 | 1) {
    setData((prev) => {
      const index = prev.items.findIndex((item) => item.id === id);
      const next = index + direction;
      if (index < 0 || next < 0 || next >= prev.items.length) return prev;
      const items = [...prev.items];
      const [removed] = items.splice(index, 1);
      items.splice(next, 0, removed);
      return { ...prev, items };
    });
  }

  function updateLink(
    linkIndex: number,
    patch: Partial<MegaMenuConfigData["items"][number]["links"][number]>,
  ) {
    if (!selected) return;
    const links = selected.links.map((link, index) =>
      index === linkIndex ? { ...link, ...patch } : link,
    );
    updateSelected({ links });
  }

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveMegaMenuConfig(data);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage("Mega menu saved. Storefront will use the new config.");
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
      const result = await saveMegaMenuConfig(parsed);
      if (!result.success) {
        setError(result.error);
        return;
      }
      // Reload shape into editor
      const normalized =
        parsed && typeof parsed === "object" && "items" in (parsed as object)
          ? (parsed as MegaMenuConfigData)
          : ({ version: 1, items: parsed } as MegaMenuConfigData);
      setData(normalized);
      setSelectedId(normalized.items[0]?.id ?? "");
      setMessage("Saved from JSON.");
      router.refresh();
    });
  }

  function reset() {
    if (
      !confirm(
        "Reset mega menu to the built-in default? Unsaved custom edits will be lost.",
      )
    ) {
      return;
    }
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await resetMegaMenuConfig();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setData(result.data.data);
      setJsonText(JSON.stringify(result.data.data, null, 2));
      setSelectedId(result.data.data.items[0]?.id ?? "");
      setMessage("Reset to default mega menu.");
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
            Icons stay mapped by tab id (gold, diamond…). Images: upload from
            laptop or paste a URL — current Unsplash links keep the look until
            you replace them.
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
            {isPending ? "Saving..." : "Save mega menu"}
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

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top tabs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.items.map((item, index) => {
              const active = item.id === selectedId;
              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border p-2",
                    active ? "border-[#8b2e2e] bg-[#8b2e2e]/5" : "border-border",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{item.label}</span>
                      {item.isActive === false ? (
                        <EyeOff className="size-3.5 text-muted-foreground" />
                      ) : (
                        <Eye className="size-3.5 text-emerald-600" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      id: {item.id}
                    </p>
                  </button>
                  <div className="mt-2 flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={index === 0}
                      onClick={() => moveTab(item.id, -1)}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={index === data.items.length - 1}
                      onClick={() => moveTab(item.id, 1)}
                    >
                      <ArrowDown className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {selected ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Edit tab · {selected.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={selected.label}
                    onChange={(e) => updateSelected({ label: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tab id (icon key)</Label>
                  <Input value={selected.id} disabled />
                  <p className="text-xs text-muted-foreground">
                    Keep id stable so the matching jewellery icon stays the same.
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Href</Label>
                  <Input
                    value={selected.href}
                    onChange={(e) => updateSelected({ href: e.target.value })}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Sidebar sections (comma separated)</Label>
                  <Input
                    value={selected.sidebar.join(", ")}
                    onChange={(e) =>
                      updateSelected({
                        sidebar: e.target.value
                          .split(",")
                          .map((part) => part.trim())
                          .filter(Boolean),
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2 sm:col-span-2">
                  <div>
                    <p className="text-sm font-medium">Show on storefront</p>
                    <p className="text-xs text-muted-foreground">
                      Inactive tabs are hidden from mega menu
                    </p>
                  </div>
                  <Switch
                    checked={selected.isActive !== false}
                    onCheckedChange={(checked) =>
                      updateSelected({ isActive: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Banner</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Title</Label>
                  <Input
                    value={selected.banner.title}
                    onChange={(e) =>
                      updateSelected({
                        banner: { ...selected.banner, title: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Subtitle</Label>
                  <Input
                    value={selected.banner.subtitle}
                    onChange={(e) =>
                      updateSelected({
                        banner: {
                          ...selected.banner,
                          subtitle: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Banner href</Label>
                  <Input
                    value={selected.banner.href}
                    onChange={(e) =>
                      updateSelected({
                        banner: { ...selected.banner, href: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-3 sm:col-span-2">
                  <Label>Banner thumbnails</Label>
                  {selected.banner.thumbs.map((thumb, thumbIndex) => (
                    <ImageUrlField
                      key={`thumb-${thumbIndex}`}
                      label={`Thumb ${thumbIndex + 1}`}
                      value={thumb}
                      previewClassName="h-16 w-16 sm:w-16"
                      onChange={(url) => {
                        const thumbs = [...selected.banner.thumbs];
                        thumbs[thumbIndex] = url;
                        updateSelected({
                          banner: { ...selected.banner, thumbs },
                        });
                      }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Promo card</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <ImageUrlField
                  className="sm:col-span-2"
                  label="Promo image"
                  value={selected.promo.image}
                  onChange={(url) =>
                    updateSelected({
                      promo: { ...selected.promo, image: url },
                    })
                  }
                />
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={selected.promo.title}
                    onChange={(e) =>
                      updateSelected({
                        promo: { ...selected.promo, title: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA</Label>
                  <Input
                    value={selected.promo.cta}
                    onChange={(e) =>
                      updateSelected({
                        promo: { ...selected.promo, cta: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Promo href</Label>
                  <Input
                    value={selected.promo.href}
                    onChange={(e) =>
                      updateSelected({
                        promo: { ...selected.promo, href: e.target.value },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Category links ({selected.links.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selected.links.map((link, index) => (
                  <div
                    key={`${selected.id}-link-${index}`}
                    className="space-y-3 rounded-lg border p-3"
                  >
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Label</Label>
                        <Input
                          value={link.label}
                          onChange={(e) =>
                            updateLink(index, { label: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Href</Label>
                        <Input
                          value={link.href}
                          onChange={(e) =>
                            updateLink(index, { href: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <ImageUrlField
                      label="Image"
                      value={link.image}
                      previewClassName="h-20 w-20 sm:w-20"
                      onChange={(url) => updateLink(index, { image: url })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        ) : null}
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
            <p className="text-xs text-muted-foreground">
              Panels (Price, Metal, Gender…) are editable here. Form UI covers
              tabs, banner, promo, and main category links.
            </p>
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
