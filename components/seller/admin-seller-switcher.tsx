"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { setViewAsSeller } from "@/actions/seller/view-as-seller";
import { NativeSelect } from "@/components/ui/native-select";

type SellerOption = {
  sellerId: string;
  businessName: string;
  seller: { email: string; name: string | null };
};

export function AdminSellerSwitcher({
  sellers,
  currentSellerId,
}: {
  sellers: SellerOption[];
  currentSellerId: string;
}) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchTo = (sellerId: string) => {
    if (!sellerId || sellerId === currentSellerId) return;

    startTransition(async () => {
      await setViewAsSeller(sellerId, pathname);
    });
  };

  const current = sellers.find((seller) => seller.sellerId === currentSellerId);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-b border-[#ead9c4] bg-[#f6ebe8] px-6 py-3 text-sm ${isPending ? "opacity-70" : ""}`}
    >
      <p className="text-[#8b2e2e]">
        {isPending
          ? "Switching seller admin store…"
          : `Super Admin monitoring ${current?.businessName ?? "a seller admin store"}. Switch accounts without logging out.`}
      </p>
      <label className="flex items-center gap-2">
        <span className="text-neutral-600">Viewing</span>
        <NativeSelect
          value={currentSellerId}
          disabled={isPending}
          onChange={(event) => switchTo(event.target.value)}
          wrapperClassName="w-auto max-w-[min(100%,20rem)]"
          className="h-9 border-[#ead9c4] py-1.5"
        >
          {sellers.map((seller) => (
            <option key={seller.sellerId} value={seller.sellerId}>
              {seller.businessName} ({seller.seller.email})
            </option>
          ))}
        </NativeSelect>
      </label>
    </div>
  );
}
