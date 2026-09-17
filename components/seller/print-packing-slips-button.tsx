"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintPackingSlipsButton() {
  return (
    <Button
      type="button"
      onClick={() => window.print()}
      className="gap-2 bg-[#8b2e2e] hover:bg-[#6f2424]"
    >
      <Printer className="size-4" />
      Print
    </Button>
  );
}
