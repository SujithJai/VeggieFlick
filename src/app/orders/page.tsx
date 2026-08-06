"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Package, RefreshCcw } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatDateTimeIST, formatINR } from "@/lib/utils";
import { Breadcrumb, EmptyState, StatusPill } from "@/components/ui/primitives";

type OrderRow = {
  id: string;
  orderNumber: string;
  grandTotal: string;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
  itemCount: number;
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, userLoading, refreshCart, notify } = useApp();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) router.replace("/login?redirect=/orders");
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/v1/orders?limit=20")
      .then((r) => r.json())
      .then((json) => {
        if (json?.success) setOrders(json.data as OrderRow[]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user]);

  async function reorder(orderId: string) {
    const response = await fetch(`/api/v1/orders/${orderId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reorder" }),
    });
    const json = await response.json();
    if (json?.success) {
      await refreshCart();
      notify("Items added back to your basket");
    } else {
      notify(json?.error?.message ?? "Could not reorder", "error");
    }
  }

  return (
    <div className="container-page py-6 md:py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "My orders" }]} />
      <h1 className="mb-6 text-2xl font-bold tracking-tight md:text-4xl">My orders</h1>

      {loading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-24 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon="shopping-bag"
          title="No orders yet"
          description="Once you place an order you can track it here in real time, download invoices and reorder in one tap."
          action={
            <Link href="/shop" className="btn btn-primary px-5 py-2.5 text-sm">
              Shop fresh produce
            </Link>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {orders.map((order) => (
            <li key={order.id} className="card flex flex-wrap items-center gap-4 p-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Package className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-[12rem] flex-1">
                <p className="font-semibold">{order.orderNumber}</p>
                <p className="text-xs text-muted">
                  {formatDateTimeIST(order.createdAt)} · {order.itemCount} item(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={order.orderStatus} />
                <StatusPill status={order.paymentStatus} />
              </div>
              <p className="text-base font-bold">{formatINR(order.grandTotal, true)}</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void reorder(order.id)}
                  className="btn btn-outline px-3 py-2 text-xs"
                >
                  <RefreshCcw className="h-3.5 w-3.5" aria-hidden /> Reorder
                </button>
                <Link href={`/orders/${order.id}`} className="btn btn-primary px-3 py-2 text-xs">
                  Track order
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
