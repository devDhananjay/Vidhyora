import type { Metadata } from "next";
import {
  ensureHomepageConfigSeeded,
  getHomepageConfigForAdmin,
} from "@/lib/content/get-homepage";
import { HomepageEditor } from "@/components/admin/homepage-editor";

export const metadata: Metadata = {
  title: "Homepage | Super Admin",
};

export default async function AdminHomepagePage() {
  await ensureHomepageConfigSeeded();
  const { data, updatedAt, source } = await getHomepageConfigForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          Homepage
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Edit storefront marketing sections — collections, hero, categories,
          and more. Defaults match the current live look.
        </p>
      </div>

      <HomepageEditor
        initialData={data}
        updatedAt={updatedAt?.toISOString() ?? null}
        source={source}
      />
    </div>
  );
}
