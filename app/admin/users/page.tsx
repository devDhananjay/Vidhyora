import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import {
  getAllUsers,
  getUserManagementStats,
} from "@/actions/admin/get-users";
import { RoleBadge } from "@/components/admin/role-badge";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

export const metadata: Metadata = {
  title: "Users | Super Admin",
};

type SearchParams = Promise<{
  q?: string;
  role?: string;
  status?: string;
  page?: string;
}>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() || "";
  const role = params.role || "ALL";
  const status = params.status || "ALL";
  const page = Number(params.page || "1") || 1;

  const [stats, list] = await Promise.all([
    getUserManagementStats(),
    getAllUsers({
      search: q || undefined,
      role,
      status,
      page,
      pageSize: 20,
    }),
  ]);

  function hrefFor(next: {
    q?: string;
    role?: string;
    status?: string;
    page?: number;
  }) {
    const sp = new URLSearchParams();
    const nextQ = next.q ?? q;
    const nextRole = next.role ?? role;
    const nextStatus = next.status ?? status;
    const nextPage = next.page ?? page;
    if (nextQ) sp.set("q", nextQ);
    if (nextRole !== "ALL") sp.set("role", nextRole);
    if (nextStatus !== "ALL") sp.set("status", nextStatus);
    if (nextPage > 1) sp.set("page", String(nextPage));
    const query = sp.toString();
    return query ? `/admin/users?${query}` : "/admin/users";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          User Management
        </h1>
        <p className="mt-2 text-muted-foreground">
          Search, update profiles, change roles, enable/disable accounts and
          reset passwords.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Disabled" value={stats.inactive} />
        <StatCard label="Customers" value={stats.customers} />
        <StatCard label="Seller Admins" value={stats.sellers} />
        <StatCard label="Admins" value={stats.admins} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_160px_160px_auto]">
            <Input
              name="q"
              defaultValue={q}
              placeholder="Search name, email or phone"
            />
            <NativeSelect name="role" defaultValue={role}>
              <option value="ALL">All roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="SELLER">Seller Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </NativeSelect>
            <NativeSelect name="status" defaultValue={status}>
              <option value="ALL">All status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Disabled</option>
            </NativeSelect>
            <Button type="submit" className="rounded-full">
              Apply
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>
            Users ({list.total})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Page {list.page} of {list.totalPages}
          </p>
        </CardHeader>
        <CardContent>
          {list.users.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Phone</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Orders</th>
                    <th className="pb-3 font-medium">Joined</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.users.map((user) => (
                    <tr key={user.id} className="border-b last:border-0">
                      <td className="py-4">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="hover:text-primary"
                        >
                          <div className="font-medium">
                            {user.name || "Unnamed"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          {user.sellerProfile ? (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Business: {user.sellerProfile.businessName}
                            </div>
                          ) : null}
                        </Link>
                      </td>
                      <td className="py-4 text-sm text-muted-foreground">
                        {user.phone || "—"}
                      </td>
                      <td className="py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="py-4">
                        <span className="font-medium">{user._count.orders}</span>
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
                          <Badge className="bg-amber-600">Disabled</Badge>
                        )}
                      </td>
                      <td className="py-4">
                        <UserRowActions
                          userId={user.id}
                          isActive={user.isActive}
                          role={user.role}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {list.totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-3">
              {list.page > 1 ? (
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={hrefFor({ page: list.page - 1 })}>Previous</Link>
                </Button>
              ) : (
                <span />
              )}
              {list.page < list.totalPages ? (
                <Button asChild variant="outline" className="rounded-full">
                  <Link href={hrefFor({ page: list.page + 1 })}>Next</Link>
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
