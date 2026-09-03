import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getUserById } from "@/actions/admin/get-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import Link from "next/link";
import { RoleBadge } from "@/components/admin/role-badge";
import { UserStatusActions } from "@/components/admin/user-status-actions";

export const metadata: Metadata = {
  title: "User Details | Super Admin",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserById(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/admin/users" className="text-sm text-primary hover:underline">
          ← Back to Users
        </Link>
        <h1 className="mt-2 font-serif text-4xl text-neutral-900">{user.name}</h1>
        <p className="mt-2 text-muted-foreground">{user.email}</p>
        <div className="mt-4">
          <UserStatusActions
            userId={user.id}
            isActive={user.isActive}
            role={user.role}
          />
        </div>
      </div>

      {/* User Info */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <RoleBadge role={user.role} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.orders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.reviews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Account</CardTitle>
          </CardHeader>
          <CardContent>
            {user.isActive ? (
              <Badge variant="outline" className="text-green-600">
                Active
              </Badge>
            ) : (
              <Badge className="bg-amber-600">Inactive</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Member Since</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {format(new Date(user.createdAt), "MMM dd, yyyy")}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seller Profile (if applicable) */}
      {user.sellerProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Seller Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Business Name</div>
                <div className="font-medium">{user.sellerProfile.businessName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Verification Status</div>
                <Badge
                  className={
                    user.sellerProfile.verificationStatus === "APPROVED"
                      ? "bg-green-600"
                      : user.sellerProfile.verificationStatus === "PENDING"
                        ? "bg-yellow-600"
                        : "bg-red-600"
                  }
                >
                  {user.sellerProfile.verificationStatus}
                </Badge>
              </div>
            </div>
            <Link href={`/admin/sellers/${user.id}`} className="inline-block text-sm text-primary hover:underline">
              View Full Seller Profile →
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <span className="text-sm text-muted-foreground">
            {user.orders.length} of {user._count.orders}
          </span>
        </CardHeader>
        <CardContent>
          {user.orders.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No orders yet
            </div>
          ) : (
            <div className="space-y-3">
              {user.orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                  <div>
                    <div className="font-medium">Order #{order.orderNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM dd, yyyy")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(Number(order.total))}</div>
                    <Badge variant="outline" className="mt-1">
                      {order.orderStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Reviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Reviews</CardTitle>
          <span className="text-sm text-muted-foreground">
            {user.reviews.length} of {user._count.reviews}
          </span>
        </CardHeader>
        <CardContent>
          {user.reviews.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No reviews yet
            </div>
          ) : (
            <div className="space-y-3">
              {user.reviews.map((review) => (
                <div key={review.id} className="border-b pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{review.title}</div>
                    <Badge
                      className={
                        review.status === "APPROVED"
                          ? "bg-green-600"
                          : review.status === "PENDING"
                            ? "bg-yellow-600"
                            : "bg-red-600"
                      }
                    >
                      {review.status}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Rating: {review.rating}/5 • {format(new Date(review.createdAt), "MMM dd, yyyy")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
