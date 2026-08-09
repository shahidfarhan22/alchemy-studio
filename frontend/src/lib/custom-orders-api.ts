import { apiFetch } from "./api-client";
import type { CreateOrderResponse } from "./orders-api";

// Mirrors backend/src/AlchemyStudio.Api/CustomOrders/CustomOrderDtos.cs.
// Status is a plain string, not a fixed union -- it can carry the
// server-computed "Expired" value, which is never actually persisted.
export type CustomOrderStatus = "Requested" | "Quoted" | "Accepted" | "Declined" | "Cancelled" | "Expired";

export type CustomOrderRequestDto = {
  id: string;
  status: CustomOrderStatus;
  description: string | null;
  imageUrl: string | null;
  budgetMinInPaise: number | null;
  budgetMaxInPaise: number | null;
  desiredScale: string | null;
  quotedPriceInPaise: number | null;
  quoteNote: string | null;
  quotedAt: string | null;
  quoteExpiresAt: string | null;
  orderId: string | null;
  createdAt: string;
};

export type CustomOrderAdminDto = CustomOrderRequestDto & {
  userId: string;
  userEmail: string;
  userDisplayName: string;
};

export type CreateCustomOrderInput = {
  description: string | null;
  imageUrl: string | null;
  budgetMinInPaise: number | null;
  budgetMaxInPaise: number | null;
  desiredScale: string | null;
};

export const createCustomOrder = (input: CreateCustomOrderInput) =>
  apiFetch<CustomOrderRequestDto>("/api/v1/custom-orders", { method: "POST", body: input });

export const getMyCustomOrders = () => apiFetch<CustomOrderRequestDto[]>("/api/v1/custom-orders");

export const getMyCustomOrder = (id: string) => apiFetch<CustomOrderRequestDto>(`/api/v1/custom-orders/${id}`);

export const acceptCustomOrderQuote = (id: string, addressId: string) =>
  apiFetch<CreateOrderResponse>(`/api/v1/custom-orders/${id}/accept`, { method: "POST", body: { addressId } });

export const declineCustomOrderQuote = (id: string) =>
  apiFetch<CustomOrderRequestDto>(`/api/v1/custom-orders/${id}/decline`, { method: "POST" });

export const cancelCustomOrder = (id: string) =>
  apiFetch<CustomOrderRequestDto>(`/api/v1/custom-orders/${id}/cancel`, { method: "POST" });

// --- Admin (browser-only, needs the in-memory access token) ---

export const getAllCustomOrdersForAdmin = () => apiFetch<CustomOrderAdminDto[]>("/api/v1/admin/custom-orders");

export const quoteCustomOrder = (id: string, priceInPaise: number, note: string | null) =>
  apiFetch<CustomOrderAdminDto>(`/api/v1/admin/custom-orders/${id}/quote`, {
    method: "POST",
    body: { priceInPaise, note },
  });
