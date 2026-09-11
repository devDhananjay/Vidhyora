"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Send } from "lucide-react";
import {
  previewCampaignAudience,
  sendEmailCampaign,
} from "@/actions/admin/email-campaigns";
import {
  defaultCampaignCopy,
  FESTIVAL_PRESETS,
  type CampaignType,
} from "@/lib/email/campaign-templates";
import type { campaignAudienceSchema } from "@/lib/validations/email-campaign";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";

type Audience = typeof campaignAudienceSchema._type;

const TEMPLATES: { type: CampaignType; title: string; blurb: string }[] = [
  {
    type: "WELCOME",
    title: "Welcome",
    blurb: "New customers after signup or Google sign-in",
  },
  {
    type: "DROPOUT",
    title: "Cart dropout",
    blurb: "Remind shoppers who left jewellery in the bag",
  },
  {
    type: "OFFER",
    title: "Offers",
    blurb: "Coupon and private sale notes",
  },
  {
    type: "FESTIVAL",
    title: "Festival / event",
    blurb: "Diwali, Eid, weddings — Super Admin sends it live",
  },
];

const AUDIENCES: { id: Audience; label: string }[] = [
  { id: "TEST", label: "Test — send only to me" },
  { id: "CART_DROPOUT", label: "Cart dropouts (2+ hours idle)" },
  { id: "NEVER_ORDERED", label: "Signed up, never ordered" },
  { id: "ALL_CUSTOMERS", label: "All customers" },
  { id: "ALL_SELLERS", label: "All seller admins" },
  { id: "ALL_USERS", label: "Everyone" },
  { id: "CUSTOM_EMAILS", label: "Paste email list" },
];

export function EmailCampaignForm({
  configured,
  customers,
  dropouts,
  neverOrdered,
}: {
  configured: boolean;
  customers: number;
  dropouts: number;
  neverOrdered: number;
}) {
  const router = useRouter();
  const [type, setType] = useState<CampaignType>("WELCOME");
  const [festival, setFestival] = useState("diwali");
  const [audience, setAudience] = useState<Audience>("TEST");
  const [copy, setCopy] = useState(() => defaultCampaignCopy("WELCOME"));
  const [customEmails, setCustomEmails] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyTemplate(next: CampaignType, festivalKey = festival) {
    setType(next);
    if (next === "FESTIVAL") {
      const preset = FESTIVAL_PRESETS[festivalKey] ?? FESTIVAL_PRESETS.diwali;
      setCopy({
        subject: preset.subject,
        eyebrow: preset.eyebrow,
        headline: preset.headline,
        body: preset.body,
        ctaLabel: preset.ctaLabel,
        ctaUrl: preset.ctaUrl,
        couponCode: "",
        footnote: preset.footnote,
        heroImage: preset.heroImage,
        heroAlt: preset.heroAlt,
      });
      return;
    }
    setCopy(defaultCampaignCopy(next));
  }

  const audienceHint = useMemo(() => {
    if (audience === "CART_DROPOUT") return `${dropouts} idle carts`;
    if (audience === "NEVER_ORDERED") return `${neverOrdered} yet to order`;
    if (audience === "ALL_CUSTOMERS") return `${customers} customers`;
    if (audience === "TEST") return "1 test email to your login";
    return null;
  }, [audience, customers, dropouts, neverOrdered]);

  return (
    <div className="space-y-6">
      {!configured ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          SMTP is not set. Add <code>EMAIL_SERVER</code> and{" "}
          <code>EMAIL_FROM</code> in the server environment, then restart.
          In local development, unconfigured mail is logged instead of sent.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TEMPLATES.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => applyTemplate(item.type)}
            className={cn(
              "rounded-2xl border px-4 py-4 text-left transition",
              type === item.type
                ? "border-[#8b2e2e] bg-[#f6ebe8]"
                : "border-neutral-100 bg-white hover:border-[#8b2e2e]/40",
            )}
          >
            <p className="font-serif text-lg text-[#8b2e2e]">{item.title}</p>
            <p className="mt-1 text-sm text-neutral-500">{item.blurb}</p>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compose</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {type === "FESTIVAL" ? (
            <div className="space-y-2">
              <Label htmlFor="festival">Occasion</Label>
              <NativeSelect
                id="festival"
                value={festival}
                onChange={(event) => {
                  setFestival(event.target.value);
                  applyTemplate("FESTIVAL", event.target.value);
                }}
              >
                {Object.entries(FESTIVAL_PRESETS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={copy.subject}
                onChange={(event) =>
                  setCopy((current) => ({
                    ...current,
                    subject: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eyebrow">Eyebrow</Label>
              <Input
                id="eyebrow"
                value={copy.eyebrow}
                onChange={(event) =>
                  setCopy((current) => ({
                    ...current,
                    eyebrow: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input
              id="headline"
              value={copy.headline}
              onChange={(event) =>
                setCopy((current) => ({
                  ...current,
                  headline: event.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              rows={6}
              value={copy.body}
              onChange={(event) =>
                setCopy((current) => ({ ...current, body: event.target.value }))
              }
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ctaLabel">Button label</Label>
              <Input
                id="ctaLabel"
                value={copy.ctaLabel}
                onChange={(event) =>
                  setCopy((current) => ({
                    ...current,
                    ctaLabel: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctaUrl">Button link</Label>
              <Input
                id="ctaUrl"
                value={copy.ctaUrl}
                onChange={(event) =>
                  setCopy((current) => ({
                    ...current,
                    ctaUrl: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coupon">Coupon code (optional)</Label>
              <Input
                id="coupon"
                value={copy.couponCode ?? ""}
                onChange={(event) =>
                  setCopy((current) => ({
                    ...current,
                    couponCode: event.target.value,
                  }))
                }
                placeholder="VIDYORA10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience">Send to</Label>
            <NativeSelect
              id="audience"
              value={audience}
              onChange={(event) => {
                setAudience(event.target.value as Audience);
                setPreviewCount(null);
              }}
            >
              {AUDIENCES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </NativeSelect>
            {audienceHint ? (
              <p className="text-xs text-muted-foreground">{audienceHint}</p>
            ) : null}
          </div>

          {audience === "CUSTOM_EMAILS" ? (
            <div className="space-y-2">
              <Label htmlFor="customEmails">Email list</Label>
              <Textarea
                id="customEmails"
                rows={4}
                placeholder="one@email.com, two@email.com"
                value={customEmails}
                onChange={(event) => setCustomEmails(event.target.value)}
              />
            </div>
          ) : null}

          {error ? (
            <p className="text-sm text-red-700">{error}</p>
          ) : null}
          {message ? (
            <p className="text-sm text-emerald-800">{message}</p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => {
                setError(null);
                setMessage(null);
                startTransition(async () => {
                  const result = await previewCampaignAudience(
                    audience,
                    customEmails,
                  );
                  if (!result.success) {
                    setError(result.error);
                    return;
                  }
                  setPreviewCount(result.data.count);
                  setMessage(`This will reach ${result.data.count} inbox(es).`);
                });
              }}
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Mail className="mr-2 size-4" />
              )}
              Count recipients
              {previewCount !== null ? ` (${previewCount})` : ""}
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => {
                setError(null);
                setMessage(null);
                startTransition(async () => {
                  const result = await sendEmailCampaign({
                    type,
                    audience,
                    subject: copy.subject,
                    headline: copy.headline,
                    body: copy.body,
                    ctaLabel: copy.ctaLabel,
                    ctaUrl: copy.ctaUrl,
                    couponCode: copy.couponCode,
                    eyebrow: copy.eyebrow,
                    footnote: copy.footnote,
                    customEmails,
                    heroImage: copy.heroImage,
                    heroAlt: copy.heroAlt,
                  });
                  if (!result.success) {
                    setError(result.error);
                    return;
                  }
                  setMessage(
                    `Sent ${result.data.sent} email${result.data.sent === 1 ? "" : "s"}${
                      result.data.failed
                        ? `, ${result.data.failed} failed`
                        : ""
                    }.`,
                  );
                  router.refresh();
                });
              }}
            >
              {isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Send className="mr-2 size-4" />
              )}
              Send campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
