"use client";

import { useState, useTransition } from "react";
import { adminResetUserPassword } from "@/actions/admin/manage-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UserPasswordResetForm({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await adminResetUserPassword(userId, {
        password,
        confirmPassword,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage(result.data.message);
      setPassword("");
      setConfirmPassword("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <p className="text-sm text-muted-foreground">
        Set a new password for this user. Share it securely — they can change it
        later from Account Settings.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="admin-user-password">New password</Label>
          <Input
            id="admin-user-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-user-confirm">Confirm password</Label>
          <Input
            id="admin-user-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        At least 8 characters, with upper, lower and a number.
      </p>

      <Button type="submit" disabled={isPending} className="rounded-full px-6">
        {isPending ? "Updating…" : "Reset password"}
      </Button>
    </form>
  );
}
