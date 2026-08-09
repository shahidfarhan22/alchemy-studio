"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { getDashboardStats } from "@/lib/admin-orders-api";
import type { DashboardStatsDto } from "@/lib/admin-orders-api";
import { formatPrice } from "@/lib/catalog-types";
import { ApiError } from "@/lib/api-client";
import { Container } from "@/components/ui/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { EyebrowLabel } from "@/components/ui/EyebrowLabel";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

const STATUS_COLORS: Record<string, string> = {
  Paid: "var(--color-success)",
  PendingPayment: "var(--color-muted)",
  PaymentFailed: "var(--color-danger)",
  Cancelled: "var(--color-muted)",
  Refunded: "var(--color-warning)",
};

function formatDay(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load dashboard stats."));
  }, []);

  return (
    <main className="flex-1 py-16">
      <Container size="xl">
        <PageHeading eyebrow="Admin" className="mb-10">
          Dashboard
        </PageHeading>

        {error && <ErrorBanner>{error}</ErrorBanner>}

        {!stats ? (
          <p className="text-muted font-sans">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
              <KpiCard label="Total revenue" value={formatPrice(stats.totalRevenueInPaise, "INR")} />
              <KpiCard label="Paid orders" value={stats.totalPaidOrders.toString()} />
              <KpiCard label="Average order value" value={formatPrice(stats.averageOrderValueInPaise, "INR")} />
              <KpiCard label="Awaiting fulfillment" value={stats.ordersAwaitingFulfillment.toString()} />
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <EyebrowLabel as="h2" className="block mb-6">
                  Revenue, last 30 days
                </EyebrowLabel>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.revenueByDay} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-gold)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--color-gold)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--color-hairline)" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDay}
                        interval={4}
                        stroke="var(--color-muted)"
                        tick={{ fontSize: 11, fontFamily: "var(--font-sans)" }}
                        axisLine={{ stroke: "var(--color-hairline)" }}
                        tickLine={false}
                      />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-hairline)",
                          borderRadius: 0,
                          fontSize: 12,
                          fontFamily: "var(--font-sans)",
                        }}
                        labelFormatter={(v) => formatDay(String(v))}
                        formatter={(value) => [formatPrice(Number(value), "INR"), "Revenue"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenueInPaise"
                        stroke="var(--color-gold)"
                        strokeWidth={1.5}
                        fill="url(#revenueFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <EyebrowLabel as="h2" className="block mb-6">
                  Orders by status
                </EyebrowLabel>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.statusBreakdown}
                        dataKey="count"
                        nameKey="status"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={2}
                        stroke="var(--color-bg)"
                        strokeWidth={2}
                      >
                        {stats.statusBreakdown.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? "var(--color-muted)"} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-hairline)",
                          borderRadius: 0,
                          fontSize: 12,
                          fontFamily: "var(--font-sans)",
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11, fontFamily: "var(--font-sans)", color: "var(--color-muted)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </Container>
    </main>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-hairline p-5">
      <EyebrowLabel className="block mb-2">{label}</EyebrowLabel>
      <p className="font-serif text-2xl text-text">{value}</p>
    </div>
  );
}
