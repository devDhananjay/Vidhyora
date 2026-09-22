import { PRODUCTS_ATTACHMENT_TYPE } from "@/lib/support-chat/guide";

export type SupportChatProductCard = {
  id: string;
  name: string;
  slug: string;
  thumbnail: string | null;
  price: number;
  href: string;
};

export type SupportChatMessageDto = {
  id: string;
  sender: "CUSTOMER" | "AGENT" | "SYSTEM";
  body: string | null;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentType: string | null;
  createdAt: string;
  products?: SupportChatProductCard[];
};

export type SupportChatThreadDto = {
  id: string;
  guestToken: string;
  name: string;
  email: string;
  phone: string | null;
  status: "OPEN" | "PENDING" | "CLOSED" | "ARCHIVED";
  messages: SupportChatMessageDto[];
  whatsappUrl: string;
  /** True when the shopper is not a logged-in user. */
  isGuest: boolean;
};

export function parseMessageProducts(
  attachmentType: string | null | undefined,
  attachmentName: string | null | undefined,
): SupportChatProductCard[] | undefined {
  if (attachmentType !== PRODUCTS_ATTACHMENT_TYPE || !attachmentName) {
    return undefined;
  }
  try {
    const parsed = JSON.parse(attachmentName) as SupportChatProductCard[];
    if (!Array.isArray(parsed) || parsed.length === 0) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}
