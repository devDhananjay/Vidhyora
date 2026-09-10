"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

type PrintInvoiceButtonProps = {
  orderNumber: string;
};

export function PrintInvoiceButton({ orderNumber }: PrintInvoiceButtonProps) {
  useEffect(() => {
    const previous = document.title;
    document.title = `Invoice ${orderNumber}`;
    return () => {
      document.title = previous;
    };
  }, [orderNumber]);

  return (
    <Button
      type="button"
      className="rounded-full bg-[#8b2e2e] hover:bg-[#6f2424]"
      onClick={() => {
        document.title = `Invoice ${orderNumber}`;
        window.print();
      }}
    >
      <Printer className="mr-2 size-4" />
      Print invoice
    </Button>
  );
}
