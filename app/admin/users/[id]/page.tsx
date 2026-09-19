import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import { getUserById } from "@/actions/admin/get-users";
import { RoleBadge } from "@/components/admin/role-badge";
import { UserPasswordResetForm } from "@/components/admin/user-password-reset-form";
import { UserProfileForm } from "@/components/admin/user-profile-form";
import { UserRoleForm } from "@/components/admin/user-role-form";
import { UserStatusActions } from "@/components/admin/user-status-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "User Details | Admin",
};

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session, user] = await Promise.all([auth(), getUserById(id)]);

  if (!user) {
    notFound();
  }

  const canAssignAdminRoles = session?.user?.role === "SUPER_ADMIN";
  const isSelf = session?.user?.id === user.id;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/users"
          className="text-sm text-primary hover:underline"
        >
          ← Back to Users
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
              {user.name || "Unnamed user"}
            </h1>
            <p className="mt-2 text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <RoleBadge role={user.role} />
              {user.isActive ? (
                <Badge variant="outline" className="text-green-600">
                  Active
                </Badge>
              ) : (
                <Badge className="bg-amber-600">Disabled</Badge>
              )}
              {user.emailVerified ? (
                <Badge variant="outline">Email verified</Badge>
              ) : (
                <Badge variant="outline" className="text-amber-700">
                  Email unverified
                </Badge>
              )}
            </div>
          </div>
          {!isSelf ? (
            <UserStatusActions
              userId={user.id}
              isActive={user.isActive}
              role={user.role}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              This is your account
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{user.phone || "—"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl tracking-tight text-brand">
              {user._count.orders}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl tracking-tight text-brand">
              {user._count.reviews}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl tracking-tight text-brand">
              {user._count.addresses}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Joined</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {format(new Date(user.createdAt), "MMM dd, yyyy")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <UserProfileForm
              userId={user.id}
              initialName={user.name ?? ""}
              initialEmail={user.email}
              initialPhone={user.phone ?? ""}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role & access</CardTitle>
          </CardHeader>
          <CardContent>
            {isSelf ? (
              <p className="text-sm text-muted-foreground">
                You cannot change your own role from here.
              </p>
            ) : (
              <UserRoleForm
                userId={user.id}
                currentRole={user.role}
                canAssignAdminRoles={canAssignAdminRoles}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-neutral-100 bg-[#faf8f6] px-4 py-3 text-sm">
            <p className="font-medium text-neutral-900">
              {user.passwordHash ? "Password is set" : "No password set"}
            </p>
            <p className="mt-1 text-muted-foreground">
              Passwords are stored encrypted (hashed). Super Admin cannot view
              the original password — only reset it to a new one.
            </p>
          </div>
          {isSelf ? (
            <p className="text-sm text-muted-foreground">
              Use storefront Account Settings to change your own password.
            </p>
          ) : (
            <UserPasswordResetForm userId={user.id} />
          )}
        </CardContent>
      </Card>

      {user.sellerProfile ? (
        <Card>
          <CardHeader>
            <CardTitle>Seller profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm text-muted-foreground">Business</div>
                <div className="font-medium">
                  {user.sellerProfile.businessName}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Verification</div>
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
            <Link
              href={`/admin/sellers/${user.id}`}
              className="inline-block text-sm text-primary hover:underline"
            >
              View full seller profile →
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Saved addresses ({user.addresses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {user.addresses.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No saved addresses
            </div>
          ) : (
            <div className="space-y-3">
              {user.addresses.map((address) => (
                <div
                  key={address.id}
                  className="rounded-xl border border-neutral-100 p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{address.name}</p>
                    {address.isDefault ? (
                      <Badge variant="outline">Default</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.state} - {address.postalCode}
                  </p>
                  <p className="mt-1 text-sm">Phone: {address.phone}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent orders</CardTitle>
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
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between border-b pb-3 last:border-0 hover:text-primary"
                >
                  <div>
                    <div className="font-medium">
                      Order #{order.orderNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM dd, yyyy")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(Number(order.total))}
                    </div>
                    <Badge variant="outline" className="mt-1">
                      {order.orderStatus}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent reviews</CardTitle>
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
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium">
                      {review.title || "Review"}
                    </div>
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
                    Rating: {review.rating}/5 ·{" "}
                    {format(new Date(review.createdAt), "MMM dd, yyyy")}
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
