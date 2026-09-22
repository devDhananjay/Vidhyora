"use client";

import { useState } from "react";
import Link from "next/link";
import type { Address } from "@prisma/client";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Heart,
  Lock,
  MapPin,
  Package,
  Star,
  UserRound,
} from "lucide-react";
import { AccountAddressBook } from "@/components/account/account-address-book";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { ProfileForm } from "@/components/account/profile-form";
import { NotificationPreferencesForm } from "@/components/account/notification-preferences-form";
import type { NotificationPreferenceValues } from "@/actions/account/notification-preferences";
import { ROUTES } from "@/lib/constants";

type PanelId = "profile" | "password" | "addresses" | "notifications";

type AccountSettingsShellProps = {
  userName: string;
  roleLabel: string;
  memberSince: string;
  email: string;
  initialName: string;
  initialPhone: string;
  hasExistingPassword: boolean;
  addresses: Address[];
  notificationPreferences: NotificationPreferenceValues;
};

const PANELS: {
  id: PanelId;
  label: string;
  description: string;
  icon: typeof UserRound;
}[] = [
  {
    id: "profile",
    label: "Profile",
    description: "Name, email and phone",
    icon: UserRound,
  },
  {
    id: "password",
    label: "Password",
    description: "Change or set your password",
    icon: Lock,
  },
  {
    id: "addresses",
    label: "Saved addresses",
    description: "Add, edit or remove delivery addresses",
    icon: MapPin,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Email alerts for orders and offers",
    icon: Bell,
  },
];

const EXTERNAL_LINKS = [
  {
    href: ROUTES.orders,
    label: "My Orders",
    description: "Track and manage orders",
    icon: Package,
  },
  {
    href: ROUTES.wishlist,
    label: "Wishlist",
    description: "Saved jewellery",
    icon: Heart,
  },
  {
    href: "/account/reviews",
    label: "My Reviews",
    description: "Ratings you left",
    icon: Star,
  },
];

export function AccountSettingsShell({
  userName,
  roleLabel,
  memberSince,
  email,
  initialName,
  initialPhone,
  hasExistingPassword,
  addresses,
  notificationPreferences,
}: AccountSettingsShellProps) {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [addressNested, setAddressNested] = useState(false);

  const activeMeta = activePanel
    ? PANELS.find((panel) => panel.id === activePanel)
    : null;

  const hideShellChrome = activePanel === "addresses" && addressNested;

  return (
    <div className="bg-[#faf8f6]">
      <div className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-14">
        {activePanel && activeMeta ? (
          <>
            {!hideShellChrome ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActivePanel(null);
                    setAddressNested(false);
                  }}
                  className="inline-flex items-center gap-2 text-sm text-[#8b2e2e] transition hover:underline"
                >
                  <ArrowLeft className="size-4" strokeWidth={1.8} />
                  Back to Account Settings
                </button>

                <h1 className="mt-4 font-serif text-3xl text-brand sm:text-4xl">
                  {activeMeta.label}
                </h1>
                <p className="mt-2 text-neutral-600">{activeMeta.description}</p>
              </>
            ) : null}

            <div
              className={`rounded-2xl border border-neutral-100 bg-white p-5 md:p-6 ${
                hideShellChrome ? "" : "mt-6"
              }`}
            >
              {activePanel === "profile" ? (
                <ProfileForm
                  initialName={initialName}
                  initialPhone={initialPhone}
                  email={email}
                />
              ) : null}
              {activePanel === "password" ? (
                <ChangePasswordForm
                  hasExistingPassword={hasExistingPassword}
                />
              ) : null}
              {activePanel === "addresses" ? (
                <AccountAddressBook
                  addresses={addresses}
                  onNestedChange={setAddressNested}
                />
              ) : null}
              {activePanel === "notifications" ? (
                <NotificationPreferencesForm
                  initial={notificationPreferences}
                />
              ) : null}
            </div>
          </>
        ) : (
          <>
            <p className="text-xs tracking-[0.2em] text-[#8b2e2e] uppercase">
              Account
            </p>
            <h1 className="mt-2 font-serif text-3xl text-brand sm:text-4xl">
              Account Settings
            </h1>
            <p className="mt-2 text-neutral-600">
              {userName} · {roleLabel} · Member since {memberSince}
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl border border-neutral-100 bg-white">
              {PANELS.map((panel, index) => {
                const Icon = panel.icon;
                return (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => {
                      setAddressNested(false);
                      setActivePanel(panel.id);
                    }}
                    className={`flex w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-[#faf7f5] sm:px-5 ${
                      index > 0 ? "border-t border-neutral-100" : ""
                    }`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#8b2e2e]/10 text-[#8b2e2e]">
                      <Icon className="size-5" strokeWidth={1.6} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-neutral-900">
                        {panel.label}
                      </span>
                      <span className="mt-0.5 block text-sm text-neutral-500">
                        {panel.description}
                      </span>
                    </span>
                    <ChevronRight
                      className="size-5 shrink-0 text-neutral-400"
                      strokeWidth={1.6}
                    />
                  </button>
                );
              })}
            </div>

            <p className="mt-8 text-xs tracking-[0.16em] text-neutral-500 uppercase">
              More
            </p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-100 bg-white">
              {EXTERNAL_LINKS.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-4 px-4 py-4 transition hover:bg-[#faf7f5] sm:px-5 ${
                      index > 0 ? "border-t border-neutral-100" : ""
                    }`}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#8b2e2e]/10 text-[#8b2e2e]">
                      <Icon className="size-5" strokeWidth={1.6} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-neutral-900">
                        {link.label}
                      </span>
                      <span className="mt-0.5 block text-sm text-neutral-500">
                        {link.description}
                      </span>
                    </span>
                    <ChevronRight
                      className="size-5 shrink-0 text-neutral-400"
                      strokeWidth={1.6}
                    />
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
