import type { SellerProfile } from "@prisma/client";
import { Store } from "lucide-react";

type SellerInfoProps = {
  seller: SellerProfile & {
    seller: {
      name: string | null;
      email: string;
    };
  };
};

export function SellerInfo({ seller }: SellerInfoProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Store className="size-6 text-primary" />
        </div>
        <div>
          <div className="font-medium">Sold by</div>
          <div className="text-sm text-primary">{seller.businessName}</div>
        </div>
      </div>
    </div>
  );
}
