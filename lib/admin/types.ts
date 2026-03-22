export type SessionResponse = {
  ok: boolean;
  authenticated: boolean;
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