import { apiFetch } from "./api-client";

// Mirrors backend/src/AlchemyStudio.Api/Orders/OrderDtos.cs.
export type OrderStatus = "PendingPayment" | "Paid" | "PaymentFailed" | "Cancelled" | "Refunded";

export type CreateOrderResponse = {
  orderId: string;
  razorpayOrderId: string;
  amountInPaise: number;
  currency: string;
  razorpayKeyId: string;
};

export type OrderItemDto = { productName: string; priceInPaise: number; quantity: number; lineTotalInPaise: number };

export type OrderDetailDto = {
  id: string;
  status: OrderStatus;
  subtotalInPaise: number;
  currency: string;
  items: OrderItemDto[];
  createdAt: string;
};

export const createOrder = (addressId: string) =>
  apiFetch<CreateOrderResponse>("/api/v1/orders", { method: "POST", body: { addressId } });

export const getOrder = (id: string) => apiFetch<OrderDetailDto>(`/api/v1/orders/${id}`);
