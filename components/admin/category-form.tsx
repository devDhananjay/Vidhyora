"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import { createCategory, updateCategory } from "@/actions/admin/manage-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUpload } from "@/components/shared/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type CategoryFormProps = {
  category?: any; // Existing category for edit mode
  categories: any[]; // All categories for parent selection
};

export function CategoryForm({ category, categories }: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [images, setImages] = useState<string[]>(category?.image ? [category.image] : []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: category
      ? {
          name: category.name,
          slug: category.slug,
          description: category.description || "",
          image: category.image || "",
          parentId: category.parentId || null,
          isActive: category.isActive,
          sortOrder: category.sortOrder,
          commissionPercentage: category.commissionPercentage ?? null,
        }
      : {
          isActive: true,
          sortOrder: 0,
          commissionPercentage: null,
        },
  });

  // Auto-generate slug from name
  const watchName = watch("name");
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setValue("name", name);
    
    if (!category) {
      // Only auto-generate slug for new categories
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", slug);
    }
  };

  // Handle image upload
  const handleImagesChange = (urls: string[]) => {
    setImages(urls);
    setValue("image", urls[0] || "");
  };

  const onSubmit = async (data: CategoryInput) => {
    startTransition(async () => {
      const result = category
        ? await updateCategory(category.id, data)
        : await createCategory(data);

      if (result.success) {
        router.push("/admin/categories");
        router.refresh();
      } else {
        alert(result.error);
      }
    });
  };

  // Filter out descendants to prevent circular reference
  const availableParents = categories.filter((c) => {
    if (category) {
      // Prevent selecting self or descendants
      return c.id !== category.id && c.parentId !== category.id;
    }
    return true;
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              {...register("name")}
              onChange={handleNameChange}
              placeholder="Electronics"
              className="mt-2"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="electronics"
              className="mt-2"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              URL-friendly version (lowercase, hyphens only)
            </p>
            {errors.slug && (
              <p className="mt-1 text-sm text-destructive">{errors.slug.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Brief description of this category"
              rows={4}
              className="mt-2"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Parent Category */}
          <div>
            <Label htmlFor="parentId">Parent Category (Optional)</Label>
            <Select
              onValueChange={(value) => setValue("parentId", value === "none" ? null : value)}
              defaultValue={category?.parentId || "none"}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Select parent category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Root Category)</SelectItem>
                {availableParents.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-xs text-muted-foreground">
              Make this a subcategory of another category
            </p>
          </div>

          {/* Sort Order */}
          <div>
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              {...register("sortOrder", { valueAsNumber: true })}
              className="mt-2"
              min="0"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Lower numbers appear first
            </p>
          </div>

          <div>
            <Label htmlFor="commissionPercentage">Commission % (optional)</Label>
            <Input
              id="commissionPercentage"
              type="number"
              min={0}
              max={100}
              step="0.1"
              {...register("commissionPercentage")}
              className="mt-2"
              placeholder="Use seller admin rate"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Overrides the seller admin rate for products in this category. Leave
              empty to use the seller rate.
            </p>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label htmlFor="isActive" className="cursor-pointer">
                Active Status
              </Label>
              <p className="text-sm text-muted-foreground">
                {watch("isActive") ? "Category is visible" : "Category is hidden"}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={watch("isActive")}
              onCheckedChange={(checked) => setValue("isActive", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Image</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={images}
            onChange={handleImagesChange}
            maxFiles={1}
            maxSize={2}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? category
              ? "Updating..."
              : "Creating..."
            : category
              ? "Update Category"
              : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
