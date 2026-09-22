import type { Metadata } from "next";
import { getAllSellers } from "@/actions/admin/manage-sellers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SellerActions } from "@/components/admin/seller-actions";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Seller Admins | Admin",
};

const KYC_FILTERS = [
  { id: "ALL", label: "All KYC" },
  { id: "PENDING", label: "KYC Pending" },
  { id: "VERIFIED", label: "KYC Verified" },
  { id: "REJECTED", label: "KYC Rejected" },
  { id: "NOT_SUBMITTED", label: "Not submitted" },
] as const;

const STATUS_FILTERS = [
  { id: "ALL", label: "All accounts" },
  { id: "PENDING", label: "Account pending" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
  { id: "SUSPENDED", label: "Suspended" },
] as const;

export default async function AdminSellersPage({
  searchParams,
}: {
  searchParams: Promise<{ kyc?: string; status?: string }>;
}) {
  const params = await searchParams;
  const kycStatus = params.kyc || "ALL";
  const status = params.status || "ALL";

  const sellers = await getAllSellers({
    kycStatus: kycStatus === "ALL" ? undefined : kycStatus,
    status: status === "ALL" ? undefined : status,
  });

  const getStatusBadge = (s: string) => {
    switch (s) {
      case "APPROVED":
        return <Badge className="bg-green-600">Approved</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-600">Pending</Badge>;
      case "REJECTED":
        return <Badge variant="destructive">Rejected</Badge>;
      case "SUSPENDED":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const pendingKycCount = sellers.filter((s) => s.kycStatus === "PENDING").length;
  const pendingCount = sellers.filter(
    (s) => s.verificationStatus === "PENDING",
  ).length;

  const filterHref = (next: { kyc?: string; status?: string }) => {
    const q = new URLSearchParams();
    const k = next.kyc ?? kycStatus;
    const st = next.status ?? status;
    if (k && k !== "ALL") q.set("kyc", k);
    if (st && st !== "ALL") q.set("status", st);
    const qs = q.toString();
    return qs ? `/admin/sellers?${qs}` : "/admin/sellers";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-brand sm:text-4xl">
          Seller Admins
        </h1>
        <p className="mt-2 text-muted-foreground">
          {sellers.length} seller admins • {pendingCount} account pending •{" "}
          {pendingKycCount} KYC pending in this view.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {KYC_FILTERS.map((f) => (
            <Link
              key={f.id}
              href={filterHref({ kyc: f.id })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                kycStatus === f.id
                  ? "border-[#8b2e2e] bg-[#8b2e2e] text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-[#8b2e2e]/40",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <Link
              key={f.id}
              href={filterHref({ status: f.id })}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                status === f.id
                  ? "border-neutral-800 bg-neutral-800 text-white"
                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400",
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {kycStatus === "PENDING"
              ? "KYC pending queue"
              : "Seller admins"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sellers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No seller admins match these filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Business</th>
                    <th className="pb-3 font-medium">Contact</th>
                    <th className="pb-3 font-medium">Products</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">KYC</th>
                    <th className="pb-3 font-medium">Joined</th>
                    <th className="pb-3 font-medium">Account</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller) => (
                    <tr key={seller.id} className="border-b last:border-0">
                      <td className="py-4">
                        <Link
                          href={`/admin/sellers/${seller.sellerId}`}
                          className="hover:text-primary"
                        >
                          <div className="font-medium">{seller.businessName}</div>
                          <div className="text-sm text-muted-foreground">
                            {seller.seller.name}
                          </div>
                        </Link>
                      </td>
                      <td className="py-4">
                        <div className="text-sm">{seller.businessEmail}</div>
                        <div className="text-sm text-muted-foreground">
                          {seller.businessPhone}
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="font-medium">
                          {seller._count.products}
                        </span>
                      </td>
                      <td className="py-4">
                        {getStatusBadge(seller.verificationStatus)}
                      </td>
                      <td className="py-4">
                        <Badge
                          variant="outline"
                          className={
                            seller.kycStatus === "VERIFIED"
                              ? "text-green-600"
                              : seller.kycStatus === "PENDING"
                                ? "text-yellow-600"
                                : seller.kycStatus === "REJECTED"
                                  ? "text-red-600"
                                  : ""
                          }
                        >
                          {seller.kycStatus}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(seller.createdAt), "MMM dd, yyyy")}
                        </span>
                      </td>
                      <td className="py-4">
                        {seller.seller.isActive ? (
                          <Badge variant="outline" className="text-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-600">Inactive</Badge>
                        )}
                      </td>
                      <td className="py-4">
                        <SellerActions
                          sellerId={seller.sellerId}
                          currentStatus={seller.verificationStatus}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
