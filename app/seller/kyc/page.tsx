import { redirect } from "next/navigation";

export default function SellerKycRedirectPage() {
  redirect("/seller/profile#kyc");
}
