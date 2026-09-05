import type { Metadata } from "next";
import { getAllUsers } from "@/actions/admin/get-users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleBadge } from "@/components/admin/role-badge";
import { format } from "date-fns";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Users | Super Admin",
};

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">User Management</h1>
        <p className="mt-2 text-muted-foreground">
          {users.length} total {users.length === 1 ? "user" : "users"}. Super
          Admin can activate or deactivate accounts.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Orders</th>
                    <th className="pb-3 font-medium">Reviews</th>
                    <th className="pb-3 font-medium">Joined</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-4">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="hover:text-primary"
                        >
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          {user.sellerProfile && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Business: {user.sellerProfile.businessName}
                            </div>
                          )}
                        </Link>
                      </td>
                      <td className="py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="py-4">
                        <span className="font-medium">{user._count.orders}</span>
                      </td>
                      <td className="py-4">
                        <span className="font-medium">{user._count.reviews}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(user.createdAt), "MMM dd, yyyy")}
                        </span>
                      </td>
                      <td className="py-4">
                        {user.isActive ? (
                          <Badge variant="outline" className="text-green-600">
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-600">Inactive</Badge>
                        )}
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
