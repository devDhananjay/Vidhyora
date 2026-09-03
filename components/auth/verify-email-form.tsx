"use client";

import { useState, useEffect } from "react";
import { verifyEmailAction } from "@/actions/auth/verify-email";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export function VerifyEmailForm({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    searchParams.then(async (params) => {
      if (!params.token) {
        setStatus("error");
        setMessage("Verification token is missing");
        return;
      }

      try {
        const result = await verifyEmailAction(params.token);

        if (result.success) {
          setStatus("success");
          setMessage(result.data.message);
        } else {
          setStatus("error");
          setMessage(result.error);
        }
      } catch (err) {
        setStatus("error");
        setMessage("An unexpected error occurred");
      }
    });
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Verifying your email...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-4">
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="size-4 text-green-600" />
          <AlertDescription className="text-green-900">
            {message}
          </AlertDescription>
        </Alert>
        <Button asChild className="w-full">
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <XCircle className="size-4" />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Button asChild className="w-full" variant="outline">
        <Link href="/login">Back to Login</Link>
      </Button>
    </div>
  );
}
