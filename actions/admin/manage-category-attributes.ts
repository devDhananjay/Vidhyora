"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import {
  categoryAttributeSchema,
  type CategoryAttributeInput,
} from "@/lib/validations/category";
import { slugify, type ActionResult } from "@/lib/utils";

function revalidateCategory(categoryId: string) {
  revalidatePath("/admin/categories");
  revalidatePath(`/admin/categories/${categoryId}`);
  revalidatePath("/products");
}

export async function createCategoryAttribute(
  categoryId: string,
  data: CategoryAttributeInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const validated = categoryAttributeSchema.parse(data);
    const slug = validated.slug || slugify(validated.name);

    const existing = await prisma.categoryAttribute.findUnique({
      where: { categoryId_slug: { categoryId, slug } },
    });
    if (existing) {
      return { success: false, error: "An attribute with this slug already exists" };
    }

    const attribute = await prisma.categoryAttribute.create({
      data: {
        categoryId,
        name: validated.name,
        slug,
        type: validated.type,
        options: validated.options ?? undefined,
        isRequired: validated.isRequired,
        isFilterable: validated.isFilterable,
        sortOrder: validated.sortOrder,
      },
    });

    revalidateCategory(categoryId);
    return { success: true, data: { id: attribute.id } };
  } catch (error) {
    console.error("Create category attribute error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create attribute",
    };
  }
}

export async function updateCategoryAttribute(
  id: string,
  data: CategoryAttributeInput,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const validated = categoryAttributeSchema.parse(data);
    const slug = validated.slug || slugify(validated.name);

    const current = await prisma.categoryAttribute.findUnique({
      where: { id },
    });
    if (!current) {
      return { success: false, error: "Attribute not found" };
    }

    const clash = await prisma.categoryAttribute.findUnique({
      where: {
        categoryId_slug: { categoryId: current.categoryId, slug },
      },
    });
    if (clash && clash.id !== id) {
      return { success: false, error: "An attribute with this slug already exists" };
    }

    await prisma.categoryAttribute.update({
      where: { id },
      data: {
        name: validated.name,
        slug,
        type: validated.type,
        options: validated.options ?? undefined,
        isRequired: validated.isRequired,
        isFilterable: validated.isFilterable,
        sortOrder: validated.sortOrder,
      },
    });

    revalidateCategory(current.categoryId);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Update category attribute error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update attribute",
    };
  }
}

export async function deleteCategoryAttribute(
  id: string,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();
    const current = await prisma.categoryAttribute.findUnique({
      where: { id },
      select: { categoryId: true },
    });
    if (!current) {
      return { success: false, error: "Attribute not found" };
    }

    await prisma.categoryAttribute.delete({ where: { id } });
    revalidateCategory(current.categoryId);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Delete category attribute error:", error);
    return { success: false, error: "Failed to delete attribute" };
  }
}
