"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatDateTimeIST, formatINR, ORDER_STATUS_LABEL } from "@/lib/utils";
import { StatusPill } from "@/components/ui/primitives";

type AdminOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  grandTotal: string;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
};

const STATUS_FILTERS = [
  "all",
  "placed",
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

const NEXT_STATUS: Record<string, string> = {
  placed: "confirmed",
  confirmed: "packed",
  packed: "out_for_delivery",
  out_for_delivery: "delivered",
};

export default function AdminOrdersPage() {
  const { notify } = useApp();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const query = filter === "all" ? "" : `?status=${filter}`;
    const response = await fetch(`/api/v1/admin/orders${query}`, { cache: "no-store" });
    const json = await response.json();
    if (json?.success) setOrders(json.data as AdminOrder[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  async function advance(order: AdminOrder, status: string) {
    setBusyId(order.id);
    const response = await fetch("/api/v1/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, orderStatus: status }),
    });
    const json = await response.json();
    setBusyId(null);
    if (json?.success) {
      notify(`${order.orderNumber} → ${ORDER_STATUS_LABEL[status] ?? status}`);
      void load();
    } else {
      notify(json?.error?.message ?? "Update failed", "error");
    }
  }

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order management</h1>
          <p className="text-sm text-muted">
            Advance the fulfilment workflow — stock is reserved, released and restored automatically.
          </p>
        </div>
        <button type="button" onClick={() => void load()} className="btn btn-outline px-4 py-2 text-sm">
          <RefreshCcw className="h-4 w-4" aria-hidden /> Refresh
        </button>
      </header>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`chip border whitespace-nowrap capitalize ${
              filter === status ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line text-muted"
            }`}
          >
            {status.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Loading orders…
          </div>
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">No orders in this view.</p>
        ) : (
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="bg-surface text-left text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-line">
                  <td className="px-4 py-3 font-semibold">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.customerName}</p>
                    <p className="text-xs text-muted">+91 {order.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{formatDateTimeIST(order.createdAt)}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={order.paymentStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={order.orderStatus} />
                  </td>
                  <td className="px-4 py-3 text-right font-bold">{formatINR(order.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {NEXT_STATUS[order.orderStatus] && (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => void advance(order, NEXT_STATUS[order.orderStatus])}
                          className="btn btn-primary px-3 py-1.5 text-xs disabled:opacity-50"
                        >
                          Mark {ORDER_STATUS_LABEL[NEXT_STATUS[order.orderStatus]]}
                        </button>
                      )}
                      {["placed", "confirmed", "packed"].includes(order.orderStatus) && (
                        <button
                          type="button"
                          disabled={busyId === order.id}
                          onClick={() => void advance(order, "cancelled")}
                          className="btn btn-outline px-3 py-1.5 text-xs text-red-600 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
