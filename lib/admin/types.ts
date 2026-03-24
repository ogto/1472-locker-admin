export type SessionResponse = {
  ok: boolean;
  authenticated: boolean;
  role: AdminRole | null;
};

export type ApiResponse = {
  ok?: boolean;
  status?: number;
  message?: string;
  detail?: string;
  requestUrl?: string;
  requestBody?: unknown;
  responseContentType?: string;
  data?: any;
};

export type StatusType = "ok" | "error" | "";

export type NavItem = {
  href: string;
  label: string;
  emoji?: string;
};

export type AdminRole = "admin" | "super-admin";

export type AdminSessionResponse = {
  authenticated: boolean;
  role: AdminRole | null;
};