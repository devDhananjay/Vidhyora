"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  submitSellerKycForReview,
  updateSellerKycDetails,
} from "@/actions/seller/update-kyc-details";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SellerKycDetailsFormProps = {
  initialGstNumber: string;
  initialPanNumber: string;
  initialBankAccountHolder: string;
  initialBankAccountNumber: string;
  initialBankIfscCode: string;
  initialBankName: string;
  canSubmit: boolean;
  kycStatus: string;
};

export function SellerKycDetailsForm({
  initialGstNumber,
  initialPanNumber,
  initialBankAccountHolder,
  initialBankAccountNumber,
  initialBankIfscCode,
  initialBankName,
  canSubmit,
  kycStatus,
}: SellerKycDetailsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [gstNumber, setGstNumber] = useState(initialGstNumber);
  const [panNumber, setPanNumber] = useState(initialPanNumber);
  const [bankAccountHolder, setBankAccountHolder] = useState(
    initialBankAccountHolder,
  );
  const [bankAccountNumber, setBankAccountNumber] = useState(
    initialBankAccountNumber,
  );
  const [bankIfscCode, setBankIfscCode] = useState(initialBankIfscCode);
  const [bankName, setBankName] = useState(initialBankName);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateSellerKycDetails({
        gstNumber: gstNumber.toUpperCase(),
        panNumber: panNumber.toUpperCase(),
        bankAccountHolder,
        bankAccountNumber,
        bankIfscCode: bankIfscCode.toUpperCase(),
        bankName,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage(result.data.message);
      router.refresh();
    });
  }

  function submit() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await submitSellerKycForReview();
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage(result.data.message);
      router.refresh();
    });
  }

  return (
    <form onSubmit={save} className="space-y-4">
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kyc-gst">GST number</Label>
          <Input
            id="kyc-gst"
            value={gstNumber}
            onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            className="rounded-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kyc-pan">PAN number</Label>
          <Input
            id="kyc-pan"
            value={panNumber}
            onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
            placeholder="ABCDE1234F"
            className="rounded-full"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="kyc-holder">Account holder</Label>
          <Input
            id="kyc-holder"
            value={bankAccountHolder}
            onChange={(e) => setBankAccountHolder(e.target.value)}
            className="rounded-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kyc-bank">Bank name</Label>
          <Input
            id="kyc-bank"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="rounded-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kyc-account">Account number</Label>
          <Input
            id="kyc-account"
            value={bankAccountNumber}
            onChange={(e) =>
              setBankAccountNumber(e.target.value.replace(/\D/g, ""))
            }
            className="rounded-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kyc-ifsc">IFSC</Label>
          <Input
            id="kyc-ifsc"
            value={bankIfscCode}
            onChange={(e) => setBankIfscCode(e.target.value.toUpperCase())}
            placeholder="SBIN0001234"
            className="rounded-full"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending} className="rounded-full px-6">
          {isPending ? "Saving…" : "Save KYC details"}
        </Button>
        {kycStatus !== "VERIFIED" ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending || !canSubmit}
            onClick={submit}
            className="rounded-full px-6"
          >
            Submit for review
          </Button>
        ) : null}
      </div>
      {!canSubmit && kycStatus !== "VERIFIED" ? (
        <p className="text-xs text-muted-foreground">
          Add GST + PAN numbers and upload both documents, then submit for
          review.
        </p>
      ) : null}
    </form>
  );
}
