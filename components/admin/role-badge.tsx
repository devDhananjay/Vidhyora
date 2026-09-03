import { Badge } from "@/components/ui/badge";
import { roleBadgeClass, roleLabel } from "@/lib/roles";

export function RoleBadge({ role }: { role: string }) {
  return (
    <Badge className={roleBadgeClass(role) || undefined} variant={roleBadgeClass(role) ? "default" : "outline"}>
      {roleLabel(role)}
    </Badge>
  );
}
