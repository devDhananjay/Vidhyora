"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/account/update-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProfileFormProps = {
  initialName: string;
  initialPhone: string;
  email: string;
};

export function ProfileForm({
  initialName,
  initialPhone,
  email,
}: ProfileFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await updateProfile({ name, phone });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setMessage("Profile updated");
      setName(result.data.name);
      setPhone(result.data.phone ?? "");
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message ? <p className="text-sm text-green-700">{message}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="space-y-2">
        <Label htmlFor="account-email">Email</Label>
        <Input id="account-email" value={email} disabled readOnly />
        <p className="text-xs text-neutral-500">Email cannot be changed here.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-name">Full name</Label>
        <Input
          id="account-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-phone">Phone</Label>
        <Input
          id="account-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+9198XXXXXXXX"
        />
      </div>

      <Button type="submit" disabled={isPending} className="rounded-full px-6">
        {isPending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
