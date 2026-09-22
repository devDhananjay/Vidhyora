"use client";

import { useState, useTransition } from "react";
import { submitContactMessage } from "@/actions/content/submit-contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await submitContactMessage(form);
      if (result.success) {
        setSuccess(true);
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-4">
      <h2 className="font-serif text-2xl text-brand">Send a message</h2>
      <p className="text-sm text-neutral-600">
        We usually reply within one business day.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name *</Label>
          <Input
            id="contact-name"
            required
            className="rounded-full"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email *</Label>
          <Input
            id="contact-email"
            type="email"
            required
            className="rounded-full"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input
            id="contact-phone"
            className="rounded-full"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-subject">Subject *</Label>
          <Input
            id="contact-subject"
            required
            className="rounded-full"
            value={form.subject}
            onChange={(e) =>
              setForm((f) => ({ ...f, subject: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Message *</Label>
        <Textarea
          id="contact-message"
          required
          rows={5}
          className="rounded-2xl"
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? (
        <p className="text-sm text-green-700">
          Thank you — your message has been sent.
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isPending}
        className="rounded-full bg-[#8b2e2e] px-8 hover:bg-[#6f2424]"
      >
        {isPending ? "Sending..." : "Send message"}
      </Button>
    </form>
  );
}
