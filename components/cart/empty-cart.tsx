import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag } from "lucide-react";

export function EmptyCart() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex size-24 items-center justify-center rounded-full bg-muted">
            <ShoppingBag className="size-12 text-muted-foreground" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">Your cart is empty</h1>
        <p className="mb-6 text-muted-foreground">
          Looks like you haven&apos;t added anything to your cart yet. Start
          shopping to fill it up!
        </p>

        <Button asChild size="lg">
          <Link href="/products">
            <ShoppingBag className="mr-2 size-5" />
            Continue Shopping
          </Link>
        </Button>
      </div>
    </div>
  );
}
