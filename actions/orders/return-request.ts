"use server";

import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { returnRequestSchema, type ReturnRequestInput } from "@/lib/validations/return";
import type { ActionResult } from "@/lib/utils";

export async function createReturnRequest(
  data: ReturnRequestInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireAuth();

    const validated = returnRequestSchema.parse(data);

    // Get order item with product policy
    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: validated.orderItemId,
        order: {
          userId: session.user.id,
          orderStatus: "DELIVERED", // Only delivered orders can be returned
        },
      },
      include: {
        product: {
          include: {
            policy: true,
          },
        },
        order: true,
      },
    });

    if (!orderItem) {
      return {
        success: false,
        error: "Order item not found or not eligible for return",
      };
    }

    // Check if product allows returns/replacements
    const policy = orderItem.product.policy;
    if (!policy) {
      return {
        success: false,
        error: "No return policy found for this product",
      };
    }

    if (validated.type === "RETURN" && !policy.returnAllowed) {
      return {
        success: false,
        error: "This product does not allow returns",
      };
    }

    if (validated.type === "REPLACEMENT" && !policy.replacementAllowed) {
      return {
        success: false,
        error: "This product does not allow replacements",
      };
    }

    // Check if within return/replacement window
    const deliveredDate = orderItem.order.updatedAt; // Simplified - use actual delivery date in production
    const windowDays = validated.type === "RETURN" ? policy.returnWindowDays : policy.replacementWindowDays;
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceDelivery > windowDays) {
      return {
        success: false,
        error: `${validated.type === "RETURN" ? "Return" : "Replacement"} window of ${windowDays} days has expired`,
      };
    }

    // Check if already requested
    const existingRequest = await prisma.returnRequest.findFirst({
      where: {
        orderItemId: validated.orderItemId,
        status: {
          in: ["PENDING", "APPROVED"],
        },
      },
    });

    if (existingRequest) {
      return {
        success: false,
        error: "A return/replacement request already exists for this item",
      };
    }

    // Create return request
    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderItemId: validated.orderItemId,
        userId: session.user.id,
        type: validated.type,
        reason: validated.reason,
        description: validated.description,
        images: validated.images || [],
        status: "PENDING",
      },
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderItem.orderId}`);

    return {
      success: true,
      data: { id: returnRequest.id },
    };
  } catch (error) {
    console.error("Create return request error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create return request",
    };
  }
}

export async function getReturnRequests() {
  try {
    const session = await requireAuth();

    const requests = await prisma.returnRequest.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        orderItem: {
          include: {
            product: true,
            order: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return requests;
  } catch (error) {
    console.error("Get return requests error:", error);
    return [];
  }
}

export async function canRequestReturn(orderItemId: string): Promise<{
  canReturn: boolean;
  canReplace: boolean;
  reason?: string;
}> {
  try {
    const session = await requireAuth();

    const orderItem = await prisma.orderItem.findFirst({
      where: {
        id: orderItemId,
        order: {
          userId: session.user.id,
        },
      },
      include: {
        product: {
          include: {
            policy: true,
          },
        },
        order: true,
      },
    });

    if (!orderItem) {
      return {
        canReturn: false,
        canReplace: false,
        reason: "Order item not found",
      };
    }

    if (orderItem.order.orderStatus !== "DELIVERED") {
      return {
        canReturn: false,
        canReplace: false,
        reason: "Order must be delivered before requesting return/replacement",
      };
    }

    const policy = orderItem.product.policy;
    if (!policy) {
      return {
        canReturn: false,
        canReplace: false,
        reason: "No return policy available",
      };
    }

    const deliveredDate = orderItem.order.updatedAt;
    const daysSinceDelivery = Math.floor(
      (Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const canReturn = policy.returnAllowed && daysSinceDelivery <= policy.returnWindowDays;
    const canReplace = policy.replacementAllowed && daysSinceDelivery <= policy.replacementWindowDays;

    return {
      canReturn,
      canReplace,
      reason: !canReturn && !canReplace ? "Return/replacement window has expired" : undefined,
    };
  } catch (error) {
    console.error("Can request return error:", error);
    return {
      canReturn: false,
      canReplace: false,
      reason: "Failed to check eligibility",
    };
  }
}
