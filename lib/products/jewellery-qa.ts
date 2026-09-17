/** Jewellery QA checklist used during admin product approval */

export const JEWELLERY_QA_ITEMS = [
  {
    id: "images_clear",
    label: "Clear product images (studio + detail)",
    critical: true,
  },
  {
    id: "on_model",
    label: "On-model or worn shot present (or noted as N/A)",
    critical: false,
  },
  {
    id: "weight",
    label: "Accurate weight / gross weight mentioned",
    critical: true,
  },
  {
    id: "metal_purity",
    label: "Metal purity / karatage stated correctly",
    critical: true,
  },
  {
    id: "certificate",
    label: "Certificate number / file valid (or N/A for fashion jewellery)",
    critical: false,
  },
  {
    id: "pricing",
    label: "Pricing looks reasonable vs metal & making",
    critical: true,
  },
  {
    id: "description",
    label: "Description complete and matches photos",
    critical: true,
  },
  {
    id: "sku_stock",
    label: "SKU unique and stock entered",
    critical: true,
  },
  {
    id: "policy",
    label: "Return / warranty policy set",
    critical: false,
  },
] as const;

export type JewelleryQaItemId = (typeof JEWELLERY_QA_ITEMS)[number]["id"];

export type JewelleryQaChecklist = {
  checked: Partial<Record<JewelleryQaItemId, boolean>>;
  notes?: string;
  checkedAt?: string;
  checkedBy?: string;
};

export const REJECTION_CATEGORIES = [
  { id: "IMAGE_QUALITY", label: "Image quality / missing photos" },
  { id: "INFO_INCOMPLETE", label: "Incomplete product information" },
  { id: "PRICING", label: "Pricing issue" },
  { id: "CERTIFICATE", label: "Certificate / purity mismatch" },
  { id: "POLICY", label: "Policy / compliance" },
  { id: "OTHER", label: "Other" },
] as const;

export type RejectionCategoryId = (typeof REJECTION_CATEGORIES)[number]["id"];

export function rejectionCategoryLabel(id?: string | null) {
  return REJECTION_CATEGORIES.find((c) => c.id === id)?.label || id || null;
}
