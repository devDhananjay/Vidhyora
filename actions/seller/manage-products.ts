"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { getActingSeller } from "@/lib/seller-context";
import { revalidatePath } from "next/cache";
import { createProductSchema, type CreateProductInput } from "@/lib/validations/product";
import { getCommerceSettings } from "@/lib/content/commerce-settings";
import {
  replaceProductImages,
  syncProductVariants,
} from "@/lib/products/sync-product-variants";
import { ensureUniqueVariantSkus } from "@/lib/products/unique-sku";
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
    const commerce = await getCommerceSettings();
    const needsApproval = commerce.productApprovalRequired;
    const returnWindowDays =
      validated.policy.returnWindowDays || commerce.returnWindowDays || 5;

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

    const uniqueSkus = await ensureUniqueVariantSkus(
      validated.variants.map((variant) => variant.sku),
    );

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
        videoUrl:
          validated.images.find((img) => img.kind === "VIDEO")?.url ||
          validated.videoUrl ||
          null,
        basePrice: validated.basePrice,
        compareAtPrice: validated.compareAtPrice,
        tax: validated.tax,
        hsn: validated.hsn || null,
        certificateNumber: validated.certificateNumber || null,
        certificateUrl: validated.certificateUrl || null,
        attributes: validated.attributes ?? {},
        status: needsApproval ? "DRAFT" : "ACTIVE",
        approvalStatus: needsApproval ? "PENDING_APPROVAL" : "APPROVED",
        
        // Create images
        images: {
          create: validated.images.map((img) => ({
            url: img.url,
            sourceUrl: img.sourceUrl || img.url,
            kind: img.kind === "VIDEO" ? "VIDEO" : "IMAGE",
            role:
              img.kind === "VIDEO"
                ? "PRODUCT"
                : img.role === "ON_MODEL" || img.role === "DETAIL"
                  ? img.role
                  : "PRODUCT",
            altText: img.altText,
            sortOrder: img.sortOrder,
          })),
        },
        
        // Create variants
        variants: {
          create: validated.variants.map((variant, index) => ({
            sku: uniqueSkus[index] ?? variant.sku,
            attributes: variant.attributes,
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            stock: variant.stock,
            reservedStock: 0,
            weight: variant.weight,
            length: variant.dimensions?.length ?? variant.dimensions?.l,
            width: variant.dimensions?.width ?? variant.dimensions?.w,
            height: variant.dimensions?.height ?? variant.dimensions?.h,
            isActive: variant.isActive,
          })),
        },
        
        // Create policy
        policy: {
          create: {
            returnAllowed: validated.policy.returnAllowed,
            returnWindowDays,
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
    if (error instanceof ZodError) {
      return {
        success: false,
        error: error.issues[0]?.message || "Invalid product data",
      };
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target)
        ? (error.meta?.target as string[]).join(", ")
        : String(error.meta?.target || "");
      if (/sku/i.test(target)) {
        return {
          success: false,
          error:
            "This SKU is already used on another product. Change the variant SKU and try again.",
        };
      }
      if (/slug/i.test(target)) {
        return {
          success: false,
          error:
            "A product with this name/slug already exists. Please choose a different name.",
        };
      }
      return {
        success: false,
        error: "A unique field conflict occurred. Please review SKU/slug and retry.",
      };
    }
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
    const commerce = await getCommerceSettings();
    const needsApproval = commerce.productApprovalRequired;
    const returnWindowDays =
      validated.policy.returnWindowDays || commerce.returnWindowDays || 5;

    // Check if product belongs to seller
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        seller: true,
        policy: true,
        variants: { select: { id: true, price: true } },
      },
    });

    if (!existingProduct) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    if (
      existingProduct.sellerId !== acting.sellerUserId &&
      existingProduct.seller.sellerId !== acting.sellerUserId
    ) {
      return {
        success: false,
        error: "You don't have permission to edit this product",
      };
    }

    const previousBasePrice = Number(existingProduct.basePrice);
    const previousVariantPrices = new Map(
      existingProduct.variants.map((v) => [v.id, Number(v.price)]),
    );

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

    const policyData = {
      returnAllowed: validated.policy.returnAllowed,
      returnWindowDays,
      replacementAllowed: validated.policy.replacementAllowed,
      replacementWindowDays: validated.policy.replacementWindowDays || 0,
      warrantyAvailable: validated.policy.warrantyAvailable,
      warrantyMonths: validated.policy.warrantyMonths || 0,
      policyDescription: validated.policy.policyDescription,
    };

    // Update product (transaction to handle relations)
    const product = await prisma.$transaction(async (tx) => {
      await replaceProductImages(tx, id, validated.images);
      await syncProductVariants(tx, id, validated.variants);

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
          videoUrl:
          validated.images.find((img) => img.kind === "VIDEO")?.url ||
          validated.videoUrl ||
          null,
          basePrice: validated.basePrice,
          compareAtPrice: validated.compareAtPrice,
          tax: validated.tax,
          hsn: validated.hsn || null,
          certificateNumber: validated.certificateNumber || null,
          certificateUrl: validated.certificateUrl || null,
          attributes: (() => {
            const next = {
              ...((validated.attributes as Record<string, unknown>) ?? {}),
            };
            const prev = existingProduct.attributes;
            if (prev && typeof prev === "object" && !Array.isArray(prev)) {
              const prevAttrs = prev as Record<string, unknown>;
              for (const key of ["bestSeller", "expertChoice"] as const) {
                if (prevAttrs[key] != null && next[key] === undefined) {
                  next[key] = prevAttrs[key];
                }
              }
            }
            return next;
          })(),
          approvalStatus: needsApproval ? "PENDING_APPROVAL" : "APPROVED",
          status: needsApproval
            ? existingProduct.status === "ARCHIVED"
              ? "DRAFT"
              : existingProduct.status === "ACTIVE"
                ? "DRAFT"
                : existingProduct.status
            : "ACTIVE",
          // Clear rejection when seller fixes & resubmits
          rejectionReason: needsApproval ? null : existingProduct.rejectionReason,
          rejectionCategory: needsApproval
            ? null
            : existingProduct.rejectionCategory,
          resubmissionCount:
            existingProduct.approvalStatus === "REJECTED" && needsApproval
              ? (existingProduct.resubmissionCount ?? 0) + 1
              : existingProduct.resubmissionCount,
          qualityChecklist: needsApproval
            ? Prisma.JsonNull
            : (existingProduct.qualityChecklist as Prisma.InputJsonValue) ??
              undefined,
          qualityCheckedAt: needsApproval ? null : existingProduct.qualityCheckedAt,
          qualityCheckedBy: needsApproval ? null : existingProduct.qualityCheckedBy,
          policy: {
            upsert: {
              create: policyData,
              update: policyData,
            },
          },
        },
      });
    });

    revalidatePath("/seller/products");
    revalidatePath(`/seller/products/${id}`);
    revalidatePath(`/seller/products/${id}/edit`);
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/admin/products");

    try {
      const { processPriceDropAlerts } = await import(
        "@/lib/email/product-alerts"
      );
      const nextBase = Number(product.basePrice);
      const priceDropped =
        nextBase < previousBasePrice ||
        (
          await prisma.productVariant.findMany({
            where: { productId: product.id },
            select: { id: true, price: true },
          })
        ).some((variant) => {
          const prev = previousVariantPrices.get(variant.id);
          return prev != null && Number(variant.price) < prev;
        });

      if (priceDropped) {
        await processPriceDropAlerts({
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
        });
      }
    } catch (error) {
      console.error("Price-drop notify failed:", error);
    }

    return {
      success: true,
      data: { id: product.id, slug: product.slug },
    };
  } catch (error) {
    console.error("Update product error:", error);
    if (error && typeof error === "object" && "issues" in error) {
      const issues = (error as { issues: Array<{ path: (string | number)[]; message: string }> })
        .issues;
      const first = issues?.[0];
      return {
        success: false,
        error: first
          ? `${first.path.join(".") || "form"}: ${first.message}`
          : "Validation failed",
      };
    }
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
  videoUrl?: string;
  images?: Array<{
    url?: string;
    sourceUrl?: string;
    altText?: string;
    kind?: "IMAGE" | "VIDEO";
    sortOrder?: number;
  }>;
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
  hsn?: string;
  certificateNumber?: string;
  certificateUrl?: string;
  attributes?: Record<string, string>;
};

function isPersistableImageUrl(value?: string) {
  if (!value) return false;
  return (
    /^https?:\/\//i.test(value) ||
    value.startsWith("/uploads/") ||
    value.startsWith("data:image/")
  );
}

function isPersistableVideoUrl(value?: string) {
  if (!value) return false;
  if (!(/^https?:\/\//i.test(value) || value.startsWith("/uploads/"))) {
    return false;
  }
  return (
    /\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(value) || value.includes("/videos/")
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
    const images = (data.images ?? []).filter((image) => {
      if (!image.url) return false;
      if ((image as { kind?: string }).kind === "VIDEO") {
        return isPersistableVideoUrl(image.url);
      }
      return (
        isPersistableImageUrl(image.url) || isPersistableVideoUrl(image.url)
      );
    });
    const variants = (data.variants ?? []).map((variant, index) => ({
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
      thumbnail: (() => {
        if (isPersistableImageUrl(data.thumbnail)) return data.thumbnail;
        const firstPhoto = images.find(
          (image) => (image as { kind?: string }).kind !== "VIDEO",
        );
        return firstPhoto?.url;
      })(),
      videoUrl: (() => {
        const fromImages = images.find(
          (image) => (image as { kind?: string }).kind === "VIDEO",
        )?.url;
        if (fromImages && isPersistableVideoUrl(fromImages)) return fromImages;
        return isPersistableVideoUrl(data.videoUrl) ? data.videoUrl : null;
      })(),
      basePrice: Number(data.basePrice) || variantPayload[0].price || 0,
      compareAtPrice: data.compareAtPrice || undefined,
      tax: Number(data.tax) || 0,
      hsn: data.hsn?.trim() || null,
      certificateNumber: data.certificateNumber?.trim() || null,
      certificateUrl: (() => {
        const value = data.certificateUrl?.trim();
        if (!value) return null;
        if (/^https?:\/\//i.test(value) || value.startsWith("/uploads/")) {
          return value;
        }
        return null;
      })(),
      attributes: data.attributes ?? {},
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
        await replaceProductImages(
          tx,
          productId,
          images.map((image, index) => ({
            url: image.url as string,
            sourceUrl: (image as { sourceUrl?: string }).sourceUrl || (image.url as string),
            kind:
              (image as { kind?: string }).kind === "VIDEO" ? "VIDEO" : "IMAGE",
            role: (image as { role?: string }).role || "PRODUCT",
            altText: image.altText,
            sortOrder: image.sortOrder ?? index,
          })),
        );
        await syncProductVariants(tx, productId, variantPayload);

        return tx.product.update({
          where: { id: productId },
          data: {
            ...productData,
            slug: existing.slug,
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

    const uniqueDraftSkus = await ensureUniqueVariantSkus(
      variantPayload.map((variant) => variant.sku),
    );
    const variantsWithUniqueSkus = variantPayload.map((variant, index) => ({
      ...variant,
      sku: uniqueDraftSkus[index] ?? variant.sku,
    }));

    const product = await prisma.product.create({
      data: {
        ...productData,
        slug: uniqueSlug,
        sellerId: acting.sellerUserId,
        images: {
          create: images.map((image, index) => ({
            url: image.url as string,
            sourceUrl: (image as { sourceUrl?: string }).sourceUrl || (image.url as string),
            kind:
              (image as { kind?: string }).kind === "VIDEO" ? "VIDEO" : "IMAGE",
            role: (image as { role?: string }).role || "PRODUCT",
            altText: image.altText,
            sortOrder: image.sortOrder ?? index,
          })),
        },
        variants: { create: variantsWithUniqueSkus },
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

/**
 * Clone an existing listing so the seller can tweak size/metal/SKU quickly.
 */
export async function cloneProduct(
  productId: string,
): Promise<ActionResult<{ id: string }>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return { success: false, error: "Seller profile not found" };
    }

    const source = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: acting.sellerUserId,
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        policy: true,
      },
    });

    if (!source) {
      return { success: false, error: "Product not found" };
    }

    const stamp = Date.now().toString(36);
    const baseSlug = `${source.slug}-copy`
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 160);
    let slug = `${baseSlug}-${stamp}`;
    if (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${stamp}-${Math.floor(Math.random() * 1000)}`;
    }

    const clone = await prisma.product.create({
      data: {
        name: `${source.name} (Copy)`,
        slug,
        brand: source.brand,
        categoryId: source.categoryId,
        sellerId: acting.sellerUserId,
        shortDescription: source.shortDescription,
        description: source.description,
        thumbnail: source.thumbnail,
        videoUrl: source.videoUrl,
        basePrice: source.basePrice,
        compareAtPrice: source.compareAtPrice,
        tax: source.tax,
        hsn: source.hsn,
        certificateNumber: source.certificateNumber,
        certificateUrl: source.certificateUrl,
        attributes: source.attributes ?? {},
        status: "DRAFT",
        approvalStatus: "DRAFT",
        rejectionReason: null,
        rejectionCategory: null,
        resubmissionCount: 0,
        images: {
          create: source.images.map((image, index) => ({
            url: image.url,
            sourceUrl: image.sourceUrl || image.url,
            kind: image.kind,
            role: image.role,
            altText: image.altText,
            sortOrder: image.sortOrder ?? index,
          })),
        },
        variants: {
          create: source.variants.map((variant, index) => ({
            sku: `${variant.sku}-C${stamp}`.slice(0, 50),
            attributes: variant.attributes ?? {},
            price: variant.price,
            compareAtPrice: variant.compareAtPrice,
            stock: 0,
            reservedStock: 0,
            weight: variant.weight,
            length: variant.length,
            width: variant.width,
            height: variant.height,
            isActive: variant.isActive,
          })),
        },
        policy: source.policy
          ? {
              create: {
                returnAllowed: source.policy.returnAllowed,
                returnWindowDays: source.policy.returnWindowDays,
                replacementAllowed: source.policy.replacementAllowed,
                replacementWindowDays: source.policy.replacementWindowDays,
                warrantyAvailable: source.policy.warrantyAvailable,
                warrantyMonths: source.policy.warrantyMonths,
                policyDescription: source.policy.policyDescription,
              },
            }
          : undefined,
      },
    });

    revalidatePath("/seller/products");
    return { success: true, data: { id: clone.id } };
  } catch (error) {
    console.error("Clone product error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to clone product",
    };
  }
}

/**
 * Seller deletes their own product.
 * - No orders → permanent delete
 * - Has orders → archive (keeps order history, hides from store + seller list)
 */
export async function deleteSellerProduct(
  productId: string,
): Promise<ActionResult<{ mode: "deleted" | "archived" }>> {
  try {
    const acting = await getActingSeller();
    if (!acting) {
      return { success: false, error: "Seller profile not found" };
    }

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: acting.sellerUserId,
      },
      select: {
        id: true,
        slug: true,
        _count: { select: { orderItems: true } },
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    if (product._count.orderItems > 0) {
      await prisma.product.update({
        where: { id: product.id },
        data: {
          status: "ARCHIVED",
          approvalStatus: "SUSPENDED",
        },
      });
    } else {
      // Clear cart/wishlist refs via cascade; orderItems are 0 so delete is safe
      await prisma.product.delete({
        where: { id: product.id },
      });
    }

    revalidatePath("/seller/products");
    revalidatePath(`/seller/products/${product.id}`);
    revalidatePath(`/products/${product.slug}`);
    revalidatePath("/products");
    revalidatePath("/seller/inventory");

    return {
      success: true,
      data: {
        mode: product._count.orderItems > 0 ? "archived" : "deleted",
      },
    };
  } catch (error) {
    console.error("Delete seller product error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}
