import type { MegaMenuItem } from "@/lib/nav/mega-menu-data";
import type { MegaMenuConfigData } from "@/lib/validations/mega-menu";

function filterActiveLinks<T extends { isActive?: boolean }>(
  links: T[],
): Omit<T, "isActive">[] {
  return links
    .filter((link) => link.isActive !== false)
    .map(({ isActive: _ignored, ...rest }) => rest);
}

/** Map admin draft mega-menu items to storefront shape (inactive filtered). */
export function toStorefrontMegaItem(
  item: MegaMenuConfigData["items"][number],
): MegaMenuItem {
  const { isActive: _ignored, links, panels, ...rest } = item;
  return {
    ...rest,
    links: filterActiveLinks(links) as MegaMenuItem["links"],
    panels: panels
      ? Object.fromEntries(
          Object.entries(panels).map(([key, panel]) => [
            key,
            {
              ...panel,
              items: filterActiveLinks(panel.items),
            },
          ]),
        )
      : undefined,
  };
}
