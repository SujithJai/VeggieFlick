"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, MapPin, Truck, Wallet } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatINR } from "@/lib/utils";
import { Breadcrumb, EmptyState } from "@/components/ui/primitives";

type Address = {
  id: string;
  addressType: string;
  contactName: string;
  contactPhone: string;
  doorNo: string;
  street: string;
  area: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
  distanceKm: number;
  serviceable: boolean;
};

type Slot = { id: string; slotName: string; available: boolean; maximumOrders: number; bookedOrders: number };

const PAYMENT_METHODS = [
  { value: "upi", label: "UPI / Google Pay / PhonePe", Icon: CreditCard, hint: "Instant confirmation" },
  { value: "card", label: "Credit / Debit card", Icon: CreditCard, hint: "Secured by Razorpay" },
  { value: "netbanking", label: "Net banking", Icon: CreditCard, hint: "All major banks" },
  { value: "wallet", label: "VeggieFlick wallet", Icon: Wallet, hint: "Use your balance" },
  { value: "cod", label: "Cash on delivery", Icon: Truck, hint: "Pay the rider" },
] as const;

const EMPTY_FORM = {
  contactName: "",
  contactPhone: "",
  doorNo: "",
  street: "",
  area: "",
  city: "Chennai",
  state: "Tamil Nadu",
  postalCode: "",
  addressType: "home" as "home" | "work" | "other",
  isDefault: true,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, user, userLoading, refreshCart, notify } = useApp();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [addressId, setAddressId] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [method, setMethod] = useState<(typeof PAYMENT_METHODS)[number]["value"]>("upi");
  const [notes, setNotes] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey] = useState(() => `vf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

  const loadContext = useCallback(async () => {
    const response = await fetch("/api/v1/checkout", { cache: "no-store" });
    const json = await response.json();
    if (!json.success) return;
    const list = json.data.addresses as Address[];
    setAddresses(list);
    setSlots(json.data.slots as Slot[]);
    setAddressId((current) => current ?? list.find((a) => a.isDefault && a.serviceable)?.id ?? list[0]?.id ?? null);
    setSlotId((current) => current ?? (json.data.slots as Slot[]).find((s) => s.available)?.id ?? null);
  }, []);

  useEffect(() => {
    if (!userLoading && !user) router.replace("/login?redirect=/checkout");
  }, [user, userLoading, router]);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => void loadContext(), 0);
    return () => clearTimeout(timer);
  }, [user, loadContext]);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === addressId) ?? null,
    [addresses, addressId],
  );

  async function saveAddress(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch("/api/v1/profile/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const json = await response.json();
    setBusy(false);
    if (!json.success) {
      setError(json.error?.message ?? "Could not save address");
      return;
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
    setAddressId(json.data.id as string);
    await loadContext();
    notify("Address saved");
  }

  async function placeOrder() {
    if (!addressId || !slotId) {
      setError("Choose a delivery address and slot to continue.");
      return;
    }
    setBusy(true);
    setError(null);
    const response = await fetch("/api/v1/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addressId,
        deliverySlotId: slotId,
        paymentMethod: method,
        notes: notes || undefined,
        idempotencyKey,
      }),
    });
    const json = await response.json();
    if (!json.success) {
      setBusy(false);
      setError(json.error?.message ?? "Could not place the order");
      return;
    }

    if (method !== "cod") {
      await fetch("/api/v1/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: json.data.orderId }),
      }).catch(() => undefined);
    }

    await refreshCart();
    notify(`Order ${json.data.orderNumber} placed successfully`);
    router.push(`/orders/${json.data.orderId}?placed=1`);
  }

  if (userLoading) {
    return <div className="container-page py-20 text-center text-sm text-muted">Preparing checkout…</div>;
  }

  if (cart.items.length === 0) {
    return (
      <div className="container-page py-10">
        <EmptyState
          title="Nothing to check out"
          description="Your basket is empty. Add a few fresh picks and come back."
          action={
            <Link href="/shop" className="btn btn-primary px-5 py-2.5 text-sm">
              Browse products
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page py-6 md:py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Basket", href: "/cart" }, { label: "Checkout" }]} />
      <h1 className="mb-6 text-2xl font-bold tracking-tight md:text-4xl">Checkout</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="grid gap-5">
          <section className="card p-5" aria-labelledby="address-heading">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="address-heading" className="flex items-center gap-2 text-lg font-bold">
                <MapPin className="h-5 w-5 text-brand-600" aria-hidden /> Delivery address
              </h2>
              <button
                type="button"
                onClick={() => setShowForm((open) => !open)}
                className="text-sm font-semibold text-brand-700"
              >
                {showForm ? "Cancel" : "+ Add new"}
              </button>
            </div>

            {addresses.length === 0 && !showForm && (
              <p className="text-sm text-muted">
                No saved addresses yet. Add one to continue — we deliver within 25 km of Chennai.
              </p>
            )}

            <div className="grid gap-3">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 ${
                    addressId === address.id ? "border-brand-600 bg-brand-50" : "border-line"
                  } ${!address.serviceable ? "opacity-60" : ""}`}
                >
                  <input
                    type="radio"
                    name="address"
                    className="mt-1 h-4 w-4 accent-brand-600"
                    checked={addressId === address.id}
                    disabled={!address.serviceable}
                    onChange={() => setAddressId(address.id)}
                  />
                  <span className="flex-1 text-sm">
                    <span className="font-semibold capitalize">
                      {address.addressType} · {address.contactName}
                    </span>
                    <span className="block text-muted">
                      {address.doorNo}, {address.street}, {address.area}, {address.city} {address.postalCode}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-brand-700">
                      {address.serviceable
                        ? `${address.distanceKm} km from hub · deliverable`
                        : `${address.distanceKm} km away · outside our 25 km radius`}
                    </span>
                  </span>
                </label>
              ))}
            </div>

            {showForm && (
              <form onSubmit={saveAddress} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                {[
                  { key: "contactName", label: "Full name", placeholder: "Priya Narayanan" },
                  { key: "contactPhone", label: "Mobile number", placeholder: "9876543210" },
                  { key: "doorNo", label: "Door / flat no.", placeholder: "3B, Sunrise Apartments" },
                  { key: "street", label: "Street", placeholder: "2nd Main Road" },
                  { key: "area", label: "Area", placeholder: "Anna Nagar West" },
                  { key: "postalCode", label: "Pincode", placeholder: "600040" },
                ].map((field) => (
                  <label key={field.key} className="grid gap-1.5">
                    <span className="text-xs font-semibold">{field.label}</span>
                    <input
                      required
                      value={form[field.key as keyof typeof form] as string}
                      onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                      placeholder={field.placeholder}
                      className="field"
                    />
                  </label>
                ))}
                <label className="grid gap-1.5">
                  <span className="text-xs font-semibold">Address type</span>
                  <select
                    value={form.addressType}
                    onChange={(event) =>
                      setForm({ ...form, addressType: event.target.value as typeof form.addressType })
                    }
                    className="field"
                  >
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <button type="submit" disabled={busy} className="btn btn-primary px-5 py-2.5 text-sm">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Save address
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="card p-5" aria-labelledby="slot-heading">
            <h2 id="slot-heading" className="mb-4 flex items-center gap-2 text-lg font-bold">
              <Truck className="h-5 w-5 text-brand-600" aria-hidden /> Delivery slot
            </h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {slots.map((slot) => (
                <label
                  key={slot.id}
                  className={`cursor-pointer rounded-xl border p-3 text-sm ${
                    slotId === slot.id ? "border-brand-600 bg-brand-50" : "border-line"
                  } ${!slot.available ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input
                    type="radio"
                    name="slot"
                    className="sr-only"
                    checked={slotId === slot.id}
                    disabled={!slot.available}
                    onChange={() => setSlotId(slot.id)}
                  />
                  <span className="block font-semibold">{slot.slotName}</span>
                  <span className="block text-xs text-muted">
                    {slot.available ? `${slot.maximumOrders - slot.bookedOrders} slots left` : "Fully booked"}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="card p-5" aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="mb-4 flex items-center gap-2 text-lg font-bold">
              <CreditCard className="h-5 w-5 text-brand-600" aria-hidden /> Payment method
            </h2>
            <div className="grid gap-2">
              {PAYMENT_METHODS.map(({ value, label, Icon, hint }) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 ${
                    method === value ? "border-brand-600 bg-brand-50" : "border-line"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    className="h-4 w-4 accent-brand-600"
                    checked={method === value}
                    onChange={() => setMethod(value)}
                  />
                  <Icon className="h-5 w-5 text-brand-700" aria-hidden />
                  <span className="flex-1 text-sm font-semibold">{label}</span>
                  <span className="text-xs text-muted">{hint}</span>
                </label>
              ))}
            </div>

            <label className="mt-4 grid gap-1.5">
              <span className="text-xs font-semibold">Delivery instructions (optional)</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={2}
                placeholder="Call on arrival, leave with security…"
                className="field"
              />
            </label>
          </section>
        </div>

        <aside className="lg:sticky lg:top-44 lg:self-start">
          <div className="card p-5">
            <h2 className="text-lg font-bold">Order summary</h2>
            <ul className="mt-3 grid max-h-56 gap-2 overflow-y-auto pr-1 text-sm">
              {cart.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span className="flex-1 truncate text-muted">
                    <span aria-hidden>{item.emoji}</span> {item.name} × {item.quantity}
                  </span>
                  <span className="font-semibold">{formatINR(item.totalPrice)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 grid gap-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="font-semibold">{formatINR(cart.totals.subtotal, true)}</dd>
              </div>
              {cart.totals.discount > 0 && (
                <div className="flex justify-between text-brand-700">
                  <dt>Coupon {cart.totals.couponCode}</dt>
                  <dd className="font-semibold">−{formatINR(cart.totals.discount, true)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className="font-semibold">
                  {cart.totals.deliveryCharge === 0 ? "FREE" : formatINR(cart.totals.deliveryCharge, true)}
                </dd>
              </div>
              {cart.totals.taxAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted">GST</dt>
                  <dd className="font-semibold">{formatINR(cart.totals.taxAmount, true)}</dd>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-bold">Payable</dt>
                <dd className="font-bold">{formatINR(cart.totals.grandTotal, true)}</dd>
              </div>
            </dl>

            {selectedAddress && (
              <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-muted">
                Delivering {selectedAddress.distanceKm} km from our Koyambedu hub to {selectedAddress.area}.
              </p>
            )}

            {error && (
              <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={() => void placeOrder()}
              disabled={busy || !addressId || !slotId}
              className="btn btn-primary mt-4 w-full py-3 text-sm disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
              {method === "cod" ? "Place order" : `Pay ${formatINR(cart.totals.grandTotal)}`}
            </button>
            <p className="mt-3 text-center text-xs text-muted">
              Totals are recalculated server-side. Stock is reserved the moment your order is confirmed.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
