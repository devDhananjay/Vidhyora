import type { Metadata } from "next";
import { getAllSellers } from "@/actions/admin/manage-sellers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SellerActions } from "@/components/admin/seller-actions";
import { format } from "date-fns";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Seller Admins | Super Admin",
};

export default async function AdminSellersPage() {
  const sellers = await getAllSellers();

  const getStatusBadge = (status: string) => {
    switch (status) {
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

  const pendingCount = sellers.filter(s => s.verificationStatus === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-4xl text-neutral-900">Seller Admins</h1>
        <p className="mt-2 text-muted-foreground">
          {sellers.length} seller admins • {pendingCount} pending approval.
          Approve, reject, or deactivate accounts from here.
        </p>
      </div>

      {/* Sellers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Seller Admins</CardTitle>
        </CardHeader>
        <CardContent>
          {sellers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No seller admins found
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
                        <span className="font-medium">{seller._count.products}</span>
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
