"use server";

import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { categorySchema, type CategoryInput } from "@/lib/validations/category";
import type { ActionResult } from "@/lib/utils";

export async function createCategory(
  data: CategoryInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();

    const validated = categorySchema.parse(data);

    // Check if slug already exists
    const existing = await prisma.category.findUnique({
      where: { slug: validated.slug },
    });

    if (existing) {
      return {
        success: false,
        error: "A category with this slug already exists",
      };
    }

    const category = await prisma.category.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        image: validated.image,
        parentId: validated.parentId,
        isActive: validated.isActive,
        sortOrder: validated.sortOrder,
        commissionPercentage: validated.commissionPercentage ?? null,
      },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/products");

    return {
      success: true,
      data: { id: category.id },
    };
  } catch (error) {
    console.error("Create category error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

export async function updateCategory(
  id: string,
  data: CategoryInput,
): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    const validated = categorySchema.parse(data);

    // Check if slug is taken by another category
    const existing = await prisma.category.findUnique({
      where: { slug: validated.slug },
    });

    if (existing && existing.id !== id) {
      return {
        success: false,
        error: "A category with this slug already exists",
      };
    }

    await prisma.category.update({
      where: { id },
      data: {
        name: validated.name,
        slug: validated.slug,
        description: validated.description,
        image: validated.image,
        parentId: validated.parentId,
        isActive: validated.isActive,
        sortOrder: validated.sortOrder,
        commissionPercentage: validated.commissionPercentage ?? null,
      },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/products");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Update category error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update category",
    };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    // Check if category has products
    const productCount = await prisma.product.count({
      where: { categoryId: id },
    });

    if (productCount > 0) {
      return {
        success: false,
        error: `Cannot delete category with ${productCount} products. Move or delete products first.`,
      };
    }

    // Check if category has children
    const childrenCount = await prisma.category.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      return {
        success: false,
        error: `Cannot delete category with ${childrenCount} subcategories. Delete subcategories first.`,
      };
    }

    await prisma.category.delete({
      where: { id },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/products");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Delete category error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}

export async function getAllCategories() {
  try {
    await requireAdmin();

    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return categories;
  } catch (error) {
    console.error("Get categories error:", error);
    return [];
  }
}

export async function getCategoryById(id: string) {
  try {
    await requireAdmin();

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        attributes: {
          orderBy: { sortOrder: "asc" },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return category;
  } catch (error) {
    console.error("Get category error:", error);
    return null;
  }
}

export async function toggleCategoryStatus(id: string): Promise<ActionResult<void>> {
  try {
    await requireAdmin();

    const category = await prisma.category.findUnique({
      where: { id },
      select: { isActive: true },
    });

    if (!category) {
      return {
        success: false,
        error: "Category not found",
      };
    }

    await prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/products");

    return {
      success: true,
      data: undefined,
    };
  } catch (error) {
    console.error("Toggle category status error:", error);
    return {
      success: false,
      error: "Failed to toggle category status",
    };
  }
}
