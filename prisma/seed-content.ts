import type { PrismaClient } from "@prisma/client";

const STORES = [
  {
    name: "VIDYORA Mumbai — Bandra",
    city: "Mumbai",
    state: "Maharashtra",
    address: "15 Linking Road, Bandra West",
    postalCode: "400050",
    phone: "022-4001-1201",
    hours: "Mon–Sun 11:00 AM – 8:30 PM",
    sortOrder: 1,
  },
  {
    name: "VIDYORA Delhi — Connaught Place",
    city: "New Delhi",
    state: "Delhi",
    address: "Block A, Inner Circle, Connaught Place",
    postalCode: "110001",
    phone: "011-4001-1202",
    hours: "Mon–Sun 11:00 AM – 8:00 PM",
    sortOrder: 2,
  },
  {
    name: "VIDYORA Bengaluru — UB City",
    city: "Bengaluru",
    state: "Karnataka",
    address: "UB City Mall, Vittal Mallya Road",
    postalCode: "560001",
    phone: "080-4001-1203",
    hours: "Mon–Sun 11:00 AM – 9:00 PM",
    sortOrder: 3,
  },
  {
    name: "VIDYORA Hyderabad — Banjara Hills",
    city: "Hyderabad",
    state: "Telangana",
    address: "Road No. 12, Banjara Hills",
    postalCode: "500034",
    phone: "040-4001-1204",
    hours: "Mon–Sat 11:00 AM – 8:00 PM, Sun 12:00 PM – 7:00 PM",
    sortOrder: 4,
  },
  {
    name: "VIDYORA Jaipur — C Scheme",
    city: "Jaipur",
    state: "Rajasthan",
    address: "MI Road, C Scheme",
    postalCode: "302001",
    phone: "0141-400-1205",
    hours: "Mon–Sun 11:00 AM – 8:00 PM",
    sortOrder: 5,
  },
  {
    name: "VIDYORA Chennai — T. Nagar",
    city: "Chennai",
    state: "Tamil Nadu",
    address: "Usman Road, T. Nagar",
    postalCode: "600017",
    phone: "044-4001-1206",
    hours: "Mon–Sun 10:30 AM – 8:30 PM",
    sortOrder: 6,
  },
];

const ARTICLES = [
  {
    category: "Orders",
    question: "How do I track my jewellery order?",
    answer:
      "Sign in and open Track Order from the top bar, or go to My Orders. You will see the live status: Ordered, Confirmed, Packed, Shipped, Out for Delivery, or Delivered.",
    sortOrder: 1,
  },
  {
    category: "Orders",
    question: "Can I cancel an order after placing it?",
    answer:
      "Yes, you can cancel while the order is still Ordered or Confirmed. Once it is packed or shipped, cancellation is closed. Use Cancel on the order page and share a short reason.",
    sortOrder: 2,
  },
  {
    category: "Payments",
    question: "Do you accept Cash on Delivery?",
    answer:
      "Yes. Choose Cash on Delivery at checkout. Payment stays PENDING (COD) until the seller marks the order delivered. Online payments via Razorpay show as Paid after a successful charge.",
    sortOrder: 1,
  },
  {
    category: "Payments",
    question: "Is online payment secure?",
    answer:
      "Card, UPI and net banking go through Razorpay. VIDYORA does not store your full card details. You will only see an order after the payment is verified.",
    sortOrder: 2,
  },
  {
    category: "Returns",
    question: "What is the return window?",
    answer:
      "Delivered jewellery can be returned or replaced within the product return window shown on the product page. Open the order, choose the item, and submit a return request with photos if asked.",
    sortOrder: 1,
  },
  {
    category: "Jewellery Care",
    question: "How should I care for gold and diamond jewellery?",
    answer:
      "Store pieces separately in a dry box. Wipe with a soft cloth after wear. Avoid perfume, chlorine and household cleaners on gold and diamond jewellery. Visit a VIDYORA store for professional cleaning.",
    sortOrder: 1,
  },
  {
    category: "Stores",
    question: "Can I try jewellery in a store before buying online?",
    answer:
      "Yes. Use Store Locator to find a boutique, then call the store to check if the design is available to try. Store advisors can also help with size, gold colour and wedding sets.",
    sortOrder: 1,
  },
  {
    category: "Account",
    question: "I did not receive a verification email.",
    answer:
      "Check spam for mail from VIDYORA. You can register again only if the email is unused. For a locked account, use Forgot password or write to support@vidyora.com.",
    sortOrder: 1,
  },
];

export async function seedStoreAndHelpContent(prisma: PrismaClient) {
  for (const store of STORES) {
    await prisma.storeLocation.upsert({
      where: { name_city: { name: store.name, city: store.city } },
      update: store,
      create: store,
    });
  }

  for (const article of ARTICLES) {
    await prisma.helpArticle.upsert({
      where: { question: article.question },
      update: article,
      create: article,
    });
  }
}
