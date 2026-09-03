import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth-helpers";
import { getOrderById } from "@/actions/orders/get-orders";
import { canRequestReturn } from "@/actions/orders/return-request";
import { ReturnRequestForm } from "@/components/orders/return-request-form";

export const metadata: Metadata = {
  title: "Request Return/Replacement | VIDYORA",
};

export default async function ReturnRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ itemId?: string }>;
}) {
  const session = await requireAuth();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const { itemId } = await searchParams;

  if (!itemId) {
    notFound();
  }

  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const orderItem = order.items.find((item) => item.id === itemId);

  if (!orderItem) {
    notFound();
  }

  // Check eligibility
  const eligibility = await canRequestReturn(itemId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-serif text-4xl text-neutral-900">Request Return/Replacement</h1>
        <p className="mt-2 text-muted-foreground">
          Fill out the form below to request a return or replacement for your order
        </p>

        <ReturnRequestForm
          orderItem={orderItem}
          order={order}
          eligibility={eligibility}
        />
      </div>
    </div>
  );
}
