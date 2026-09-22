/** Shared return / replacement window options for seller forms + AI guide. */
export const POLICY_WINDOW_OPTIONS = [
  { value: "", label: "Not offered" },
  { value: "5", label: "5 days" },
  { value: "7", label: "7 days" },
  { value: "10", label: "10 days" },
  { value: "15", label: "15 days" },
  { value: "30", label: "30 days" },
] as const;

export const DEFAULT_POLICY_WINDOW_DAYS = 5;
