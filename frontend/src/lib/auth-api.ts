import { apiFetch } from "./api-client";

// Mirrors backend/src/AlchemyStudio.Api/Auth/AuthDtos.cs -- keep in sync by
// hand for now; a shared OpenAPI-generated client is a reasonable upgrade
// once the API surface grows past auth (see docs/api.md, written at M2).
export type UserSummary = {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  mustChangePassword: boolean;
};

export type AuthResponse = {
  accessToken: string;
  expiresAt: string;
  user: UserSummary;
};

export function register(email: string, password: string, displayName: string) {
  return apiFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: { email, password, displayName },
    skipAuth: true,
  });
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuth: true,
  });
}

export function refresh() {
  return apiFetch<AuthResponse>("/api/v1/auth/refresh", { method: "POST", skipAuth: true });
}

export function logout() {
  return apiFetch<void>("/api/v1/auth/logout", { method: "POST" });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiFetch<void>("/api/v1/auth/change-password", {
    method: "PUT",
    body: { currentPassword, newPassword },
  });
}
