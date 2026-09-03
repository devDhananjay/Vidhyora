"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import { createOrderSchema } from "@/lib/validations/order";
import { generateOrderNumber, calculateOrderTotals } from "@/lib/orders/order-utils";
import { razorpayService } from "@/lib/payments/razorpay-service";
import type { ActionResult } from "@/lib/utils";

type CreateOrderResult = {
  orderId: string;
  orderNumber: string;
  razorpayOrderId?: string;
  amount: number;
};

export async function createOrder(
  formData: FormData,
): Promise<ActionResult<CreateOrderResult>> {
  try {
    const session = await requireAuth();

    const rawData = {
      addressId: formData.get("addressId"),
      paymentMethod: formData.get("paymentMethod") || "RAZORPAY",
    };

    const validatedData = createOrderSchema.parse(rawData);

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          where: { savedForLater: false },
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        error: "Cart is empty",
      };
    }

    // Get address
    const address = await prisma.address.findUnique({
      where: { id: validatedData.addressId },
    });

    if (!address || address.userId !== session.user.id) {
      return {
        success: false,
        error: "Invalid address",
      };
    }

    // Validate stock for all items
    for (const item of cart.items) {
      const availableStock = item.variant.stock - item.variant.reservedStock;
      if (availableStock < item.quantity) {
        return {
          success: false,
          error: `${item.product.name} - Only ${availableStock} items available`,
        };
      }
    }

    // Calculate order totals
    const orderItems = cart.items.map((item) => ({
      price: Number(item.variant.price),
      quantity: item.quantity,
      tax: Number(item.product.tax),
    }));

    const totals = calculateOrderTotals(orderItems);
    const orderNumber = generateOrderNumber();

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Reserve stock
      for (const item of cart.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            reservedStock: { increment: item.quantity },
          },
        });
      }

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: session.user.id,
          subtotal: totals.subtotal,
          discount: totals.discount,
          shippingFee: totals.shippingFee,
          tax: totals.tax,
          total: totals.total,
          paymentStatus: validatedData.paymentMethod === "COD" ? "PENDING" : "PENDING",
          orderStatus: "ORDERED",
          shippingAddress: {
            name: address.name,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            country: address.country,
            postalCode: address.postalCode,
            landmark: address.landmark,
          },
          billingAddress: {
            name: address.name,
            phone: address.phone,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            city: address.city,
            state: address.state,
            country: address.country,
            postalCode: address.postalCode,
            landmark: address.landmark,
          },
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              sellerId: item.product.sellerId,
              quantity: item.quantity,
              price: Number(item.variant.price),
              tax: Number(item.product.tax),
              discount: 0,
              total: Number(item.variant.price) * item.quantity,
              productName: item.product.name,
              productSlug: item.product.slug,
              sku: item.variant.sku,
              variantAttributes: item.variant.attributes,
            })),
          },
        },
      });

      // Clear cart items
      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          savedForLater: false,
        },
      });

      // Create order status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "ORDERED",
          actorId: session.user.id,
        },
      });

      return order;
    });

    // Create Razorpay order if online payment
    let razorpayOrderId: string | undefined;
    if (validatedData.paymentMethod === "RAZORPAY") {
      try {
        const razorpayOrder = await razorpayService.createOrder({
          amount: Math.round(totals.total * 100), // Convert to paise
          currency: "INR",
          receipt: result.orderNumber,
          notes: {
            orderId: result.id,
            userId: session.user.id,
          },
        });

        razorpayOrderId = razorpayOrder.id;

        // Update order with Razorpay order ID
        await prisma.order.update({
          where: { id: result.id },
          data: {
            payments: {
              create: {
                provider: "RAZORPAY",
                transactionId: razorpayOrderId,
                amount: totals.total,
                currency: "INR",
                status: "CREATED",
              },
            },
          },
        });
      } catch (error) {
        console.error("Razorpay order creation failed:", error);
        // Order is created, but payment failed - mark for manual review
        await prisma.order.update({
          where: { id: result.id },
          data: {
            orderStatus: "PAYMENT_PENDING",
          },
        });
      }
    }

    revalidatePath("/cart");
    revalidatePath("/orders");

    return {
      success: true,
      data: {
        orderId: result.id,
        orderNumber: result.orderNumber,
        razorpayOrderId,
        amount: totals.total,
      },
    };
  } catch (error) {
    console.error("Create order error:", error);
    return {
      success: false,
      error: "Failed to create order",
    };
  }
}
