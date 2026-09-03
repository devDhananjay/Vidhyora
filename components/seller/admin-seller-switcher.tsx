"use client";

import { setViewAsSeller } from "@/actions/seller/view-as-seller";

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
  return (
    <form
      action={setViewAsSeller}
      className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ead9c4] bg-[#f6ebe8] px-6 py-3 text-sm"
    >
      <p className="text-[#8b2e2e]">
        Super Admin monitoring: you are reviewing a seller admin store. Switch
        accounts without logging out.
      </p>
      <label className="flex items-center gap-2">
        <span className="text-neutral-600">Viewing</span>
        <select
          name="sellerId"
          defaultValue={currentSellerId}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className="rounded-full border border-[#ead9c4] bg-white px-3 py-1.5 text-sm text-neutral-900"
        >
          {sellers.map((seller) => (
            <option key={seller.sellerId} value={seller.sellerId}>
              {seller.businessName} ({seller.seller.email})
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
