const API_URL = process.env.NEXT_PUBLIC_API_URL;
if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not configured (frontend/.env.local).");
}

// Mirrors the backend's error envelope shape (see backend AGENTS.md / api.md).
export type ApiErrorDetail = { field: string; issue: string };
export type ApiErrorBody = {
  code: string;
  message: string;
  details: ApiErrorDetail[] | null;
  correlationId: string;
};

export class ApiError extends Error {
  code: string;
  details: ApiErrorDetail[] | null;
  correlationId: string;
  status: number;

  constructor(body: ApiErrorBody, status: number) {
    super(body.message);
    this.code = body.code;
    this.details = body.details;
    this.correlationId = body.correlationId;
    this.status = status;
  }
}

// Kept outside React state so any call site (not just components under the
// AuthProvider) can attach the current access token. Updated by AuthContext.
// Never persisted (no localStorage) -- lost on refresh by design, restored
// via the silent refresh-cookie flow on app load.
let currentAccessToken: string | null = null;
export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  skipAuth?: boolean;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (!options.skipAuth && currentAccessToken) {
    headers.Authorization = `Bearer ${currentAccessToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    credentials: "include", // sends the httpOnly refresh cookie
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (data?.error) {
      throw new ApiError(data.error as ApiErrorBody, response.status);
    }
    throw new ApiError(
      { code: "UNKNOWN_ERROR", message: "Something went wrong.", details: null, correlationId: "unknown" },
      response.status,
    );
  }

  return data as T;
}
