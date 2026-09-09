"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateUserProfile } from "@/actions/admin/manage-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UserProfileForm({
  userId,
  initialName,
  initialEmail,
  initialPhone,
}: {
  userId: string;
  initialName: string;
  initialEmail: string;
  initialPhone: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateUserProfile(userId, { name, email, phone });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setName(result.data.name);
      setEmail(result.data.email);
      setPhone(result.data.phone ?? "");
      setMessage("Profile updated");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="admin-user-name">Full name</Label>
          <Input
            id="admin-user-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-user-phone">Mobile</Label>
          <Input
            id="admin-user-phone"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(e) =>
              setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="10-digit mobile"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-user-email">Email</Label>
        <Input
          id="admin-user-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <Button type="submit" disabled={isPending} className="rounded-full px-6">
        {isPending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
