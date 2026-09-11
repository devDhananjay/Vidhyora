"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createCategoryAttribute,
  deleteCategoryAttribute,
  updateCategoryAttribute,
} from "@/actions/admin/manage-category-attributes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { NativeSelect } from "@/components/ui/native-select";
import { slugify } from "@/lib/utils";
import type { CategoryAttributeInput } from "@/lib/validations/category";

type AttributeRow = {
  id: string;
  name: string;
  slug: string;
  type: string;
  options: unknown;
  isRequired: boolean;
  isFilterable: boolean;
  sortOrder: number;
};

type CategoryAttributesFormProps = {
  categoryId: string;
  attributes: AttributeRow[];
};

const EMPTY: CategoryAttributeInput = {
  name: "",
  slug: "",
  type: "text",
  options: [],
  isRequired: false,
  isFilterable: true,
  sortOrder: 0,
};

function optionsToString(options: unknown): string {
  if (!Array.isArray(options)) return "";
  return options.map(String).join(", ");
}

export function CategoryAttributesForm({
  categoryId,
  attributes,
}: CategoryAttributesFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryAttributeInput>(EMPTY);
  const [optionsText, setOptionsText] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY);
    setOptionsText("");
    setError(null);
  };

  const startEdit = (attr: AttributeRow) => {
    setEditingId(attr.id);
    setForm({
      name: attr.name,
      slug: attr.slug,
      type: (attr.type as CategoryAttributeInput["type"]) || "text",
      options: Array.isArray(attr.options)
        ? attr.options.map(String)
        : undefined,
      isRequired: attr.isRequired,
      isFilterable: attr.isFilterable,
      sortOrder: attr.sortOrder,
    });
    setOptionsText(optionsToString(attr.options));
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);
    const payload: CategoryAttributeInput = {
      ...form,
      slug: form.slug || slugify(form.name),
      options:
        form.type === "select"
          ? optionsText
              .split(",")
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
    };

    startTransition(async () => {
      const result = editingId
        ? await updateCategoryAttribute(editingId, payload)
        : await createCategoryAttribute(categoryId, payload);

      if (result.success) {
        resetForm();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-2xl">Category attributes</CardTitle>
        <p className="text-sm text-muted-foreground">
          Specs sellers fill when listing products in this category (e.g. metal,
          purity, carat).
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {attributes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No attributes yet.</p>
        ) : (
          <ul className="space-y-3">
            {attributes.map((attr) => (
              <li
                key={attr.id}
                className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-neutral-100 bg-[#faf8f6] p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-neutral-900">
                      {attr.name}
                    </span>
                    <Badge variant="outline">{attr.type}</Badge>
                    {attr.isRequired ? (
                      <Badge className="bg-[#8b2e2e]">Required</Badge>
                    ) : null}
                    {attr.isFilterable ? (
                      <Badge variant="secondary">Filterable</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    slug: {attr.slug}
                    {attr.type === "select" && optionsToString(attr.options)
                      ? ` · ${optionsToString(attr.options)}`
                      : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(attr)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteCategoryAttribute(attr.id);
                        if (editingId === attr.id) resetForm();
                        router.refresh();
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="space-y-4 rounded-2xl border border-neutral-200 p-4">
          <h3 className="font-medium text-neutral-900">
            {editingId ? "Edit attribute" : "Add attribute"}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="attr-name">Name</Label>
              <Input
                id="attr-name"
                className="rounded-full"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f,
                    name,
                    slug: editingId ? f.slug : slugify(name),
                  }));
                }}
                placeholder="Metal purity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attr-slug">Slug</Label>
              <Input
                id="attr-slug"
                className="rounded-full"
                value={form.slug || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, slug: e.target.value }))
                }
                placeholder="metal-purity"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attr-type">Type</Label>
              <NativeSelect
                id="attr-type"
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as CategoryAttributeInput["type"],
                  }))
                }
              >
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="select">Select</option>
                <option value="boolean">Boolean</option>
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="attr-sort">Sort order</Label>
              <Input
                id="attr-sort"
                type="number"
                className="rounded-full"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    sortOrder: Number(e.target.value) || 0,
                  }))
                }
              />
            </div>
          </div>

          {form.type === "select" ? (
            <div className="space-y-2">
              <Label htmlFor="attr-options">Options (comma-separated)</Label>
              <Input
                id="attr-options"
                className="rounded-full"
                value={optionsText}
                onChange={(e) => setOptionsText(e.target.value)}
                placeholder="18K, 22K, Platinum"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.isRequired}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isRequired: checked }))
                }
              />
              Required
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={form.isFilterable}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isFilterable: checked }))
                }
              />
              Filterable
            </label>
          </div>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="rounded-full bg-[#8b2e2e] hover:bg-[#6f2424]"
              disabled={isPending || !form.name.trim()}
              onClick={handleSubmit}
            >
              <Plus className="mr-2 size-4" />
              {isPending
                ? "Saving..."
                : editingId
                  ? "Update attribute"
                  : "Add attribute"}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={resetForm}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
