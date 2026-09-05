import type { Metadata } from "next";
import { ensureMegaMenuConfigSeeded, getMegaMenuConfigForAdmin } from "@/lib/nav/get-mega-menu";
import { MegaMenuEditor } from "@/components/admin/mega-menu-editor";

export const metadata: Metadata = {
  title: "Mega Menu | Super Admin",
};

export default async function AdminMegaMenuPage() {
  await ensureMegaMenuConfigSeeded();
  const { data, updatedAt, source } = await getMegaMenuConfigForAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-neutral-900 sm:text-4xl">
          Mega Menu
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Edit storefront navigation tabs, links, images, banner and promo.
          Icons stay tied to tab ids so the current look is preserved.
        </p>
      </div>

      <MegaMenuEditor
        initialData={data}
        updatedAt={updatedAt?.toISOString() ?? null}
        source={source}
      />
    </div>
  );
}
