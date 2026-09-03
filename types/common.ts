export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type SortDirection = "asc" | "desc";

export type ApiError = {
  message: string;
  code?: string;
  fieldErrors?: Record<string, string[]>;
};

export type SelectOption = {
  label: string;
  value: string;
};
