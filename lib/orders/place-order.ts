import type { Address, CartItem, Product, ProductVariant } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { calculateOrderTotals, generateOrderNumber } from "@/lib/orders/order-utils";
import { giftPackagingFeeForItems } from "@/lib/cart/gift-packaging";
import { DEFAULT_HSN, resolveGstPercent } from "@/lib/tax/jewellery-gst";
import { buildJewelleryBreakup } from "@/lib/orders/jewellery-breakup";
import { DEFAULT_COMMERCE_SETTINGS } from "@/lib/validations/site-settings";
import type { CommerceSettings } from "@/lib/validations/site-settings";

type CartLine = CartItem & {
  product: Product;
  variant: ProductVariant;
};

export function variantLabelFrom(attributes: unknown): string | null {
  if (!attributes || typeof attributes !== "object") return null;
  const parts = Object.entries(attributes as Record<string, unknown>)
    .filter(([, value]) => value != null && value !== "")
    .map(([key, value]) => `${key}: ${String(value)}`);
  return parts.length > 0 ? parts.join(", ") : null;
}

export function addressSnapshot(address: Address) {
  return {
    name: address.name,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    country: address.country,
    postalCode: address.postalCode,
    landmark: address.landmark,
  };
}

export function cartTotals(
  items: CartLine[],
  options?: {
    discount?: number;
    distanceKm?: number;
    freeShippingThreshold?: number;
    shippingFee?: number;
  },
) {
  return calculateOrderTotals(
    items.map((item) => ({
      price: Number(item.variant.price),
      quantity: item.quantity,
      tax: resolveGstPercent(Number(item.product.tax)),
    })),
    {
      ...options,
      giftPackagingFee: giftPackagingFeeForItems(items),
    },
  );
}

export function stockError(items: CartLine[]): string | null {
  for (const item of items) {
    const available = item.variant.stock - item.variant.reservedStock;
    if (available < item.quantity) {
      return `${item.product.name} - Only ${available} items available`;
    }
  }
  return null;
}

export async function createShopOrder(
  tx: Prisma.TransactionClient,
  options: {
    userId: string;
    address: Address;
    items: CartLine[];
    cartId: string;
    paymentStatus: "PENDING" | "PAID";
    orderStatus: "ORDERED" | "CONFIRMED";
    deductStock: boolean;
    discount?: number;
    couponCode?: string | null;
    couponId?: string | null;
    hidePriceOnInvoice?: boolean;
    notes?: string | null;
    giftMessage?: string | null;
    occasionNote?: string | null;
    commerce?: Pick<
      CommerceSettings,
      "freeShippingThreshold" | "shippingFee"
    >;
  },
) {
  const commerce = {
    freeShippingThreshold:
      options.commerce?.freeShippingThreshold ??
      DEFAULT_COMMERCE_SETTINGS.freeShippingThreshold,
    shippingFee:
      options.commerce?.shippingFee ?? DEFAULT_COMMERCE_SETTINGS.shippingFee,
  };
  const totals = cartTotals(options.items, {
    discount: options.discount,
    ...commerce,
  });
  const orderNumber = generateOrderNumber();

  for (const item of options.items) {
    if (options.deductStock) {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { stock: { decrement: item.quantity } },
      });
    } else {
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: { reservedStock: { increment: item.quantity } },
      });
    }
  }

  const order = await tx.order.create({
    data: {
      orderNumber,
      userId: options.userId,
      subtotal: totals.subtotal,
      discount: totals.discount,
      shippingFee: totals.shippingFee,
      giftPackagingFee: totals.giftPackagingFee,
      tax: totals.tax,
      total: totals.total,
      couponCode: options.couponCode ?? null,
      notes: options.notes ?? null,
      giftMessage: options.giftMessage?.trim() || null,
      occasionNote: options.occasionNote?.trim() || null,
      hidePriceOnInvoice: Boolean(options.hidePriceOnInvoice),
      paymentStatus: options.paymentStatus,
      orderStatus: options.orderStatus,
      shippingAddress: addressSnapshot(options.address),
      billingAddress: addressSnapshot(options.address),
      items: {
        create: options.items.map((item) => {
          const unitPrice = Number(item.variant.price);
          const jewelleryBreakup = buildJewelleryBreakup({
            unitPrice,
            quantity: item.quantity,
            taxField: Number(item.product.tax),
            attributes: item.product.attributes,
          });
          return {
            productId: item.productId,
            variantId: item.variantId,
            sellerId: item.product.sellerId,
            quantity: item.quantity,
            price: unitPrice,
            tax: resolveGstPercent(Number(item.product.tax)),
            discount: 0,
            total: unitPrice * item.quantity,
            productName: item.product.name,
            sku: item.variant.sku,
            variantLabel: variantLabelFrom(item.variant.attributes),
            hsn: item.product.hsn || DEFAULT_HSN,
            certificateNumber: item.product.certificateNumber || null,
            giftPackaging: item.giftPackaging,
            jewelleryBreakup,
          };
        }),
      },
    },
  });

  if (options.couponId && options.couponCode && totals.discount > 0) {
    await tx.couponUsage.create({
      data: {
        couponId: options.couponId,
        userId: options.userId,
        orderId: order.id,
      },
    });
    await tx.coupon.update({
      where: { id: options.couponId },
      data: { usageCount: { increment: 1 } },
    });
  }

  await tx.cartItem.deleteMany({
    where: {
      cartId: options.cartId,
      savedForLater: false,
    },
  });

  await tx.cart.update({
    where: { id: options.cartId },
    data: { couponCode: null },
  });

  await tx.orderStatusHistory.create({
    data: {
      orderId: order.id,
      status: options.orderStatus,
      actorId: options.userId,
    },
  });

  return { order, totals };
}
