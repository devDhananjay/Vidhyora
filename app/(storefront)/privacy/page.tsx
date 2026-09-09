import { redirect } from "next/navigation";

/** Legacy URL — use /privacy-policy */
export default function PrivacyRedirectPage() {
  redirect("/privacy-policy");
}
