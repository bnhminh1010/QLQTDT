/* ─────────────────────────────────────────────────────────────
   Shared API response types
───────────────────────────────────────────────────────────── */

export type ApiResponse<T> = {
  data: T;
  message?: string;
  timestamp?: string;
  status?: number;
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ApiErrorResponse = {
  error: string;
  errors?: Record<string, string>;
  timestamp?: string;
  status?: number;
};
