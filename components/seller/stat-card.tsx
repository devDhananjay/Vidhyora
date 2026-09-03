import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
};

export function StatCard({ title, value, icon: Icon, description, trend }: StatCardProps) {
  return (
    <Card className="transition hover:border-[#ead9c4]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium tracking-wide text-neutral-600">
          {title}
        </CardTitle>
        <span className="flex size-9 items-center justify-center rounded-full bg-[#f6ead7] text-[#8b2e2e]">
          <Icon className="size-4" strokeWidth={1.5} />
        </span>
      </CardHeader>
      <CardContent>
        <div className="font-serif text-3xl text-neutral-900">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-neutral-500">{description}</p>
        )}
        {trend && (
          <p
            className={`mt-1 text-xs ${
              trend.isPositive ? "text-emerald-700" : "text-[#8b2e2e]"
            }`}
          >
            {trend.isPositive ? "+" : ""}
            {trend.value}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );
}
