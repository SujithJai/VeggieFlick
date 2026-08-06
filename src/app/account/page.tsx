"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Bell, Gift, Heart, MapPin, Trash2, User, Wallet } from "lucide-react";
import { useApp } from "@/components/providers";
import { formatDateTimeIST, formatINR, initials } from "@/lib/utils";
import { Breadcrumb, CategoryIconTile, EmptyState } from "@/components/ui/primitives";

type Address = {
  id: string;
  addressType: string;
  contactName: string;
  doorNo: string;
  street: string;
  area: string;
  city: string;
  postalCode: string;
  isDefault: boolean;
  distanceKm: number;
};

type WishlistItem = {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  emoji: string;
  price: string;
  variantName: string;
};

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  notificationType: string;
  isRead: boolean;
  createdAt: string;
};

const TABS = [
  { key: "profile", label: "Profile", Icon: User },
  { key: "addresses", label: "Addresses", Icon: MapPin },
  { key: "wishlist", label: "Wishlist", Icon: Heart },
  { key: "wallet", label: "Wallet & rewards", Icon: Wallet },
  { key: "notifications", label: "Notifications", Icon: Bell },
] as const;

function AccountContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, userLoading, addItem, notify, logout } = useApp();
  const [tab, setTab] = useState<string>(params.get("tab") ?? "profile");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (!userLoading && !user) router.replace("/login?redirect=/account");
  }, [user, userLoading, router]);

  const loadAll = useCallback(async () => {
    const [a, w, n] = await Promise.all([
      fetch("/api/v1/profile/addresses").then((r) => r.json()),
      fetch("/api/v1/wishlist").then((r) => r.json()),
      fetch("/api/v1/notifications").then((r) => r.json()),
    ]);
    if (a?.success) setAddresses(a.data as Address[]);
    if (w?.success) setWishlist(w.data as WishlistItem[]);
    if (n?.success) setNotifications(n.data.items as NotificationItem[]);
  }, []);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => void loadAll(), 0);
    return () => clearTimeout(t);
  }, [user, loadAll]);

  if (userLoading || !user) {
    return <div className="container-page py-20 text-center text-[13px] text-muted">Loading your account…</div>;
  }

  return (
    <div className="container-page py-6 md:py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "My account" }]} />

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-700 text-[20px] font-semibold text-white">
          {initials(user.fullName)}
        </span>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-[-0.02em]">{user.fullName}</h1>
          <p className="text-[13px] text-muted">
            +91 {user.phone} {user.email ? `· ${user.email}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/orders" className="btn btn-outline btn-sm">My orders</Link>
          <button type="button" onClick={() => void logout()} className="btn btn-outline btn-sm">Sign out</button>
        </div>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`chip whitespace-nowrap border transition-colors ${
              tab === key
                ? "border-brand-700 bg-brand-50 font-semibold text-brand-800"
                : "border-line text-muted"
            }`}
          >
            <Icon size={12} strokeWidth={1.7} /> {label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="grid gap-4 md:grid-cols-3">
          <Stat label="Loyalty tier" value={user.loyaltyTier} tone="brand" hint={`${user.loyaltyPoints} points earned`} />
          <Stat label="Wallet balance" value={formatINR(user.walletBalance, true)} tone="default" hint="Refunds land here instantly" />
          <Stat label="Referral code" value={user.referralCode ?? "—"} tone="offer" hint="Friends get ₹100, you get ₹100" />
        </div>
      )}

      {tab === "addresses" && (
        <div className="grid gap-3">
          {addresses.length === 0 ? (
            <EmptyState
              title="No saved addresses"
              description="Add an address at checkout — we deliver anywhere within 25 km of our Chennai hub."
            />
          ) : (
            addresses.map((address) => (
              <div key={address.id} className="card flex items-start gap-3 p-4">
                <MapPin size={16} strokeWidth={1.7} className="mt-0.5 text-brand-700" />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold capitalize">
                    {address.addressType} {address.isDefault && <span className="text-brand-700">· Default</span>}
                  </p>
                  <p className="text-[13px] text-muted">
                    {address.doorNo}, {address.street}, {address.area}, {address.city} {address.postalCode}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-brand-700">{address.distanceKm} km from hub</p>
                </div>
                <button
                  type="button"
                  aria-label="Delete address"
                  onClick={async () => {
                    await fetch(`/api/v1/profile/addresses?id=${address.id}`, { method: "DELETE" });
                    notify("Address removed");
                    void loadAll();
                  }}
                  className="text-muted hover:text-danger"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "wishlist" && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.length === 0 ? (
            <div className="sm:col-span-2 lg:col-span-3">
              <EmptyState
                title="Your wishlist is empty"
                description="Tap the heart on any product to save it for later."
                action={
                  <Link href="/shop" className="btn btn-primary">
                    Browse products
                  </Link>
                }
              />
            </div>
          ) : (
            wishlist.map((item) => (
              <div key={item.id} className="card flex gap-3 p-4">
                <CategoryIconTile icon={item.slug.split("-")[0]} size={56} />
                <div className="flex-1">
                  <Link href={`/product/${item.slug}`} className="text-[13px] font-semibold hover:text-brand-700">
                    {item.name}
                  </Link>
                  <p className="text-[11px] text-muted">{item.variantName}</p>
                  <p className="mt-1 text-[14px] font-semibold">{formatINR(item.price)}</p>
                  <button
                    type="button"
                    onClick={() => void addItem(item.productId, item.variantId, 1)}
                    className="btn btn-outline btn-sm mt-2"
                  >
                    Add to basket
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "wallet" && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <Wallet size={18} className="text-brand-700" /> VeggieFlick wallet
            </h2>
            <p className="mt-4 text-3xl font-bold tracking-[-0.02em]">{formatINR(user.walletBalance, true)}</p>
            <p className="mt-2 text-[13px] text-muted">
              Cancellation refunds, gift card top-ups and cashback are credited here and can be used on any order.
            </p>
          </div>
          <div className="card p-6">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold">
              <Gift size={18} className="text-offer" /> Refer & earn
            </h2>
            <p className="mt-4 text-[13px] text-muted">
              Share your code and both of you get ₹100 off once their first order is delivered.
            </p>
            <p className="mt-3 rounded-2xl bg-surface px-4 py-3 text-lg font-bold tracking-widest">
              {user.referralCode ?? "VEGGIE100"}
            </p>
            <p className="mt-3 text-[11px] text-muted">
              Tier progress: {user.loyaltyTier} · {user.loyaltyPoints} points. Earn 1 point per ₹100 spent.
            </p>
          </div>
        </div>
      )}

      {tab === "notifications" && (
        <div className="grid gap-3">
          {notifications.length === 0 ? (
            <EmptyState title="No notifications yet" description="Order updates and offers will appear here." />
          ) : (
            <>
              <button
                type="button"
                onClick={async () => {
                  await fetch("/api/v1/notifications", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ all: true }),
                  });
                  void loadAll();
                }}
                className="btn btn-outline btn-sm w-fit"
              >
                Mark all as read
              </button>
              {notifications.map((item) => (
                <div key={item.id} className={`card p-4 ${item.isRead ? "" : "border-brand-300 bg-brand-50/40"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold">{item.title}</p>
                    <span className="text-[11px] text-muted">{formatDateTimeIST(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-muted">{item.message}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, hint, tone }: { label: string; value: string; hint: string; tone: "brand" | "default" | "offer" }) {
  const tones = {
    brand: "text-brand-700",
    default: "text-ink",
    offer: "text-offer",
  };
  return (
    <div className="card p-5">
      <p className="text-[10px] font-semibold tracking-widest text-muted uppercase">{label}</p>
      <p className={`mt-1 text-2xl font-bold tracking-[-0.02em] ${tones[tone]}`}>{value}</p>
      <p className="mt-1 text-[12px] text-muted">{hint}</p>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="container-page py-20 text-center text-[13px] text-muted">Loading…</div>}>
      <AccountContent />
    </Suspense>
  );
}
