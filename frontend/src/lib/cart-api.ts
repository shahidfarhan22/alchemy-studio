import { apiFetch } from "./api-client";

// Mirrors backend/src/AlchemyStudio.Api/Cart/CartDtos.cs.
export type CartItemDto = {
  productId: string;
  productName: string;
  productSlug: string;
  imageUrl: string | null;
  priceInPaise: number;
  currency: string;
  quantity: number;
  lineTotalInPaise: number;
  inStock: boolean;
  isAvailable: boolean;
};

export type CartDto = {
  cartId: string;
  items: CartItemDto[];
  subtotalInPaise: number;
  currency: string;
};

// No auth REQUIRED -- works for guests (cookie-tracked) too -- but do NOT
// skipAuth: apiFetch attaches the access token automatically when one
// exists, which is how the backend tells a logged-in user's cart apart
// from an anonymous one. Omitting that here would make every request look
// anonymous even when logged in.
export const getCart = () => apiFetch<CartDto>("/api/v1/cart");

export const addToCart = (productId: string, quantity: number) =>
  apiFetch<CartDto>("/api/v1/cart/items", { method: "POST", body: { productId, quantity } });

export const updateCartItem = (productId: string, quantity: number) =>
  apiFetch<CartDto>(`/api/v1/cart/items/${productId}`, { method: "PUT", body: { quantity } });

export const removeCartItem = (productId: string) =>
  apiFetch<CartDto>(`/api/v1/cart/items/${productId}`, { method: "DELETE" });
