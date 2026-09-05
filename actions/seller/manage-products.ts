"use server";

import prisma from "@/lib/prisma";
import { getActingSeller } from "@/lib/seller-context";
import { revalidatePath } from "next/cache";
import { createProductSchema, type CreateProductInput } from "@/lib/validations/product";
import type { ActionResult } from "@/lib/utils";

export async function createProduct(
  data: CreateProductInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return {
        success: false,
        error: "Seller profile not found. Please complete your seller registration.",
      };
    }

    // Validate input
    const validated = createProductSchema.parse(data);

    // Check if slug already exists
    const existingProduct = await prisma.product.findUnique({
      where: { slug: validated.slug },
    });

    if (existingProduct) {
      return {
        success: false,
        error: "A product with this slug already exists. Please choose a different name.",
      };
    }

    // Create product with variants and policy
    const product = await prisma.product.create({
      data: {
        name: validated.name,
        slug: validated.slug,
        brand: validated.brand,
        categoryId: validated.categoryId,
        sellerId: acting.sellerUserId,
        shortDescription: validated.shortDescription,
        description: validated.description,
        thumbnail: validated.thumbnail,
        basePrice: validated.basePrice,
        compareAtPrice: validated.compareAtPrice,
        tax: validated.tax,
        status: "DRAFT",
        approvalStatus: "PENDING_APPROVAL",
        
        // Create images
        images: {
          create: validated.images.map((img) => ({
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder,
          })),
        },
        
        // Create variants
        variants: {
          create: validated.variants.map((variant) => ({
            sku: variant.sku,
            attributes: variant.attributes,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            stock: variant.stock,
            reservedStock: 0,
            weight: variant.weight,
            dimensions: variant.dimensions,
            isActive: variant.isActive,
          })),
        },
        
        // Create policy
        policy: {
          create: {
            returnAllowed: validated.policy.returnAllowed,
            returnWindowDays: validated.policy.returnWindowDays || 0,
            replacementAllowed: validated.policy.replacementAllowed,
            replacementWindowDays: validated.policy.replacementWindowDays || 0,
            warrantyAvailable: validated.policy.warrantyAvailable,
            warrantyMonths: validated.policy.warrantyMonths || 0,
            policyDescription: validated.policy.policyDescription,
          },
        },
      },
    });

    revalidatePath("/seller/products");
    revalidatePath("/admin/products");

    return {
      success: true,
      data: { id: product.id, slug: product.slug },
    };
  } catch (error) {
    console.error("Create product error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function updateProduct(
  id: string,
  data: CreateProductInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return {
        success: false,
        error: "Seller profile not found",
      };
    }

    // Validate input
    const validated = createProductSchema.parse(data);

    // Check if product belongs to seller
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: { seller: true },
    });

    if (!existingProduct) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    if (existingProduct.seller.sellerId !== acting.sellerUserId) {
      return {
        success: false,
        error: "You don't have permission to edit this product",
      };
    }

    // Check if slug is taken by another product
    if (validated.slug !== existingProduct.slug) {
      const slugTaken = await prisma.product.findUnique({
        where: { slug: validated.slug },
      });

      if (slugTaken) {
        return {
          success: false,
          error: "A product with this slug already exists",
        };
      }
    }

    // Update product (transaction to handle relations)
    const product = await prisma.$transaction(async (tx) => {
      // Delete existing images and variants
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productVariant.deleteMany({ where: { productId: id } });

      // Update product with new data
      return await tx.product.update({
        where: { id },
        data: {
          name: validated.name,
          slug: validated.slug,
          brand: validated.brand,
          categoryId: validated.categoryId,
          shortDescription: validated.shortDescription,
          description: validated.description,
          thumbnail: validated.thumbnail,
          basePrice: validated.basePrice,
          compareAtPrice: validated.compareAtPrice,
          tax: validated.tax,
          approvalStatus: "PENDING_APPROVAL", // Re-submit for approval
          
          images: {
            create: validated.images.map((img) => ({
              url: img.url,
              altText: img.altText,
              sortOrder: img.sortOrder,
            })),
          },
          
          variants: {
            create: validated.variants.map((variant) => ({
              sku: variant.sku,
              attributes: variant.attributes,
              price: variant.price,
              compareAtPrice: variant.compareAtPrice,
              stock: variant.stock,
              reservedStock: 0,
              weight: variant.weight,
              dimensions: variant.dimensions,
              isActive: variant.isActive,
            })),
          },
          
          policy: {
            update: {
              returnAllowed: validated.policy.returnAllowed,
              returnWindowDays: validated.policy.returnWindowDays || 0,
              replacementAllowed: validated.policy.replacementAllowed,
              replacementWindowDays: validated.policy.replacementWindowDays || 0,
              warrantyAvailable: validated.policy.warrantyAvailable,
              warrantyMonths: validated.policy.warrantyMonths || 0,
              policyDescription: validated.policy.policyDescription,
            },
          },
        },
      });
    });

    revalidatePath("/seller/products");
    revalidatePath(`/seller/products/${id}`);
    revalidatePath("/admin/products");

    return {
      success: true,
      data: { id: product.id, slug: product.slug },
    };
  } catch (error) {
    console.error("Update product error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

export async function getSellerProduct(id: string) {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return null;
    }

    const product = await prisma.product.findFirst({
      where: {
        id,
        seller: {
          sellerId: acting.sellerUserId,
        },
      },
      include: {
        category: true,
        images: {
          orderBy: { sortOrder: "asc" },
        },
        variants: true,
        policy: true,
      },
    });

    return product;
  } catch (error) {
    console.error("Get seller product error:", error);
    return null;
  }
}

type DraftProductInput = {
  name?: string;
  slug?: string;
  brand?: string;
  categoryId?: string;
  shortDescription?: string;
  description?: string;
  thumbnail?: string;
  images?: Array<{ url?: string; altText?: string; sortOrder?: number }>;
  variants?: Array<{
    sku?: string;
    attributes?: Record<string, string>;
    price?: number;
    compareAtPrice?: number;
    stock?: number;
    weight?: number;
    isActive?: boolean;
  }>;
  policy?: {
    returnAllowed?: boolean;
    returnWindowDays?: number;
    replacementAllowed?: boolean;
    replacementWindowDays?: number;
    warrantyAvailable?: boolean;
    warrantyMonths?: number;
    policyDescription?: string;
  };
  basePrice?: number;
  compareAtPrice?: number;
  tax?: number;
};

function isPersistableImageUrl(value?: string) {
  if (!value) return false;
  return (
    /^https?:\/\//i.test(value) ||
    value.startsWith("/uploads/") ||
    value.startsWith("data:image/")
  );
}

export async function saveProductDraft(
  productId: string | undefined,
  data: DraftProductInput,
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return {
        success: false,
        error: "Seller profile not found. Please complete your seller registration.",
      };
    }

    if (!data.categoryId) {
      return {
        success: false,
        error: "Select a category in Basic Info to save this draft.",
      };
    }

    const name = data.name?.trim() || "Untitled product";
    const slugBase =
      data.slug?.trim() ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") ||
      "draft-product";
    const slug = `${slugBase}-${Date.now().toString(36)}`.slice(0, 180);
    const description =
      data.description?.trim() ||
      data.shortDescription?.trim() ||
      "Draft product. Complete all steps before submitting for approval.";
    const images = (data.images ?? []).filter((image) =>
      isPersistableImageUrl(image.url),
    );    const variants = (data.variants ?? []).map((variant, index) => ({
      sku:
        variant.sku?.trim() ||
        `DRAFT-${Date.now().toString(36).toUpperCase()}-${index + 1}`,
      attributes: variant.attributes ?? {},
      price: Number(variant.price) || Number(data.basePrice) || 0,
      compareAtPrice: variant.compareAtPrice || undefined,
      stock: Number(variant.stock) || 0,
      weight: variant.weight || undefined,
      isActive: variant.isActive ?? true,
    }));
    const variantPayload =
      variants.length > 0
        ? variants
        : [
            {
              sku: `DRAFT-${Date.now().toString(36).toUpperCase()}`,
              attributes: {},
              price: Number(data.basePrice) || 0,
              compareAtPrice: undefined,
              stock: 0,
              weight: undefined,
              isActive: true,
            },
          ];

    const policy = {
      returnAllowed: data.policy?.returnAllowed ?? false,
      returnWindowDays: data.policy?.returnWindowDays || 0,
      replacementAllowed: data.policy?.replacementAllowed ?? false,
      replacementWindowDays: data.policy?.replacementWindowDays || 0,
      warrantyAvailable: data.policy?.warrantyAvailable ?? false,
      warrantyMonths: data.policy?.warrantyMonths || 0,
      policyDescription: data.policy?.policyDescription,
    };

    const productData = {
      name,
      brand: data.brand?.trim() || "VIDYORA",
      categoryId: data.categoryId,
      shortDescription: data.shortDescription?.trim() || description.slice(0, 200),
      description,
      thumbnail: isPersistableImageUrl(data.thumbnail)
        ? data.thumbnail
        : images[0]?.url,      basePrice: Number(data.basePrice) || variantPayload[0].price || 0,
      compareAtPrice: data.compareAtPrice || undefined,
      tax: Number(data.tax) || 0,
      status: "DRAFT" as const,
      approvalStatus: "DRAFT" as const,
    };

    if (productId) {
      const existing = await prisma.product.findFirst({
        where: {
          id: productId,
          seller: { sellerId: acting.sellerUserId },
        },
      });

      if (!existing) {
        return { success: false, error: "Draft product not found" };
      }

      const product = await prisma.$transaction(async (tx) => {
        await tx.productImage.deleteMany({ where: { productId } });
        await tx.productVariant.deleteMany({ where: { productId } });

        return tx.product.update({
          where: { id: productId },
          data: {
            ...productData,
            slug: existing.slug,
            images: {
              create: images.map((image, index) => ({
                url: image.url as string,
                altText: image.altText,
                sortOrder: image.sortOrder ?? index,
              })),
            },
            variants: { create: variantPayload },
            policy: {
              upsert: {
                create: policy,
                update: policy,
              },
            },
          },
        });
      });

      revalidatePath("/seller/products");
      return { success: true, data: { id: product.id, slug: product.slug } };
    }

    let uniqueSlug = slug;
    if (await prisma.product.findUnique({ where: { slug: uniqueSlug } })) {
      uniqueSlug = `${slugBase}-${Date.now()}`;
    }

    const product = await prisma.product.create({
      data: {
        ...productData,
        slug: uniqueSlug,
        sellerId: acting.sellerUserId,
        images: {
          create: images.map((image, index) => ({
            url: image.url as string,
            altText: image.altText,
            sortOrder: image.sortOrder ?? index,
          })),
        },
        variants: { create: variantPayload },
        policy: { create: policy },
      },
    });

    revalidatePath("/seller/products");
    return { success: true, data: { id: product.id, slug: product.slug } };
  } catch (error) {
    console.error("Save product draft error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save draft",
    };
  }
}
