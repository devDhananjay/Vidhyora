import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

  const eligibility = await canRequestReturn(itemId);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href={`/orders/${order.id}`}
          className="mb-4 inline-flex items-center gap-2 text-sm text-[#8b2e2e] hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to order
        </Link>
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">
          Request Return/Replacement
        </h1>
        <p className="mt-2 text-muted-foreground">
          Fill out the form below to request a return or replacement for your
          order
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
