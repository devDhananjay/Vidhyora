"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProductSort() {
  const router = useRouter();
  const currentParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(currentParams.toString());
    if (value === "default") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <Select
        onValueChange={handleSortChange}
        defaultValue={currentParams.get("sort") || "default"}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Default" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="default">Default</SelectItem>
          <SelectItem value="price-low">Price: Low to High</SelectItem>
          <SelectItem value="price-high">Price: High to Low</SelectItem>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="name">Name: A to Z</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
