"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { safeCallbackPath } from "@/lib/auth/callback-url";

function GoogleMark() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46c-.28 1.5-1.13 2.77-2.4 3.62v3.01h3.88c2.27-2.09 3.55-5.17 3.55-8.66Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.01c-1.08.72-2.47 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.11C3.25 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.27A11.97 11.97 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l4-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l4 3.11C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export function GoogleSignInButton({
  callbackUrl,
  label = "Continue with Google",
}: {
  callbackUrl?: string;
  label?: string;
}) {
  const [isPending, setIsPending] = useState(false);

  const redirectTo = (() => {
    const safe = safeCallbackPath(callbackUrl);
    return safe
      ? `/auth/continue?callbackUrl=${encodeURIComponent(safe)}`
      : "/auth/continue";
  })();

  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 w-full rounded-full border-neutral-200 bg-white font-medium text-neutral-800 hover:bg-neutral-50"
      disabled={isPending}
      onClick={() => {
        setIsPending(true);
        void signIn("google", { callbackUrl: redirectTo });
      }}
    >
      {isPending ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <span className="mr-2 inline-flex">
          <GoogleMark />
        </span>
      )}
      {label}
    </Button>
  );
}

export function AuthProviderDivider() {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t border-neutral-200" />
      </div>
      <div className="relative flex justify-center text-[11px] uppercase tracking-[0.14em]">
        <span className="bg-white px-3 text-neutral-400">or</span>
      </div>
    </div>
  );
}
