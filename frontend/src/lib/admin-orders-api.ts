import { apiFetch } from "./api-client";
import type { OrderStatus, OrderItemDto } from "./orders-api";

// Mirrors backend/src/AlchemyStudio.Api/Orders/OrderDtos.cs (admin section).
export type FulfillmentStatus = "Processing" | "Shipped" | "Delivered";

export type AdminOrderSummaryDto = {
  id: string;
  userId: string;
  userEmail: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus | null;
  subtotalInPaise: number;
  currency: string;
  createdAt: string;
};

export type OrderShippingAddressDto = {
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
};

export type AdminOrderDetailDto = {
  id: string;
  userId: string;
  userEmail: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus | null;
  trackingNumber: string | null;
  carrier: string | null;
  subtotalInPaise: number;
  currency: string;
  items: OrderItemDto[];
  shippingAddress: OrderShippingAddressDto;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  razorpayRefundId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardStatsDto = {
  totalRevenueInPaise: number;
  totalPaidOrders: number;
  averageOrderValueInPaise: number;
  ordersAwaitingFulfillment: number;
  revenueByDay: { date: string; revenueInPaise: number }[];
  statusBreakdown: { status: string; count: number }[];
};

export const getAllOrdersForAdmin = () => apiFetch<AdminOrderSummaryDto[]>("/api/v1/admin/orders");

export const getOrderForAdmin = (id: string) => apiFetch<AdminOrderDetailDto>(`/api/v1/admin/orders/${id}`);

export const updateFulfillment = (id: string, status: FulfillmentStatus, trackingNumber: string | null, carrier: string | null) =>
  apiFetch<AdminOrderDetailDto>(`/api/v1/admin/orders/${id}/fulfillment`, {
    method: "PUT",
    body: { status, trackingNumber, carrier },
  });

export const refundOrder = (id: string) =>
  apiFetch<AdminOrderDetailDto>(`/api/v1/admin/orders/${id}/refund`, { method: "POST" });

export const getDashboardStats = () => apiFetch<DashboardStatsDto>("/api/v1/admin/dashboard");
