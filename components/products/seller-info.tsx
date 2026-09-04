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
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-full bg-[#8b2e2e]/10">
          <Store className="size-5 text-[#8b2e2e]" strokeWidth={1.6} />
        </div>
        <div>
          <p className="text-xs tracking-[0.14em] text-neutral-500 uppercase">
            Sold by
          </p>
          <p className="mt-0.5 text-sm font-medium text-[#8b2e2e]">
            {seller.businessName}
          </p>
        </div>
      </div>
    </div>
  );
}
