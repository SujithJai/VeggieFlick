"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";

export type CartLine = {
  id: string;
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  emoji: string;
  variantName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  totalPrice: number;
  availableStock: number;
};

export type CartTotals = {
  subtotal: number;
  savings: number;
  discount: number;
  deliveryCharge: number;
  taxAmount: number;
  grandTotal: number;
  couponCode: string | null;
  freeDeliveryThreshold: number;
  amountToFreeDelivery: number;
};

export type CartSummary = {
  cartId: string;
  items: CartLine[];
  totals: CartTotals;
  itemCount: number;
};

export type SessionUser = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  role: string;
  loyaltyTier: string;
  loyaltyPoints: number;
  referralCode: string | null;
  walletBalance: string;
};

const EMPTY_CART: CartSummary = {
  cartId: "",
  items: [],
  totals: {
    subtotal: 0,
    savings: 0,
    discount: 0,
    deliveryCharge: 0,
    taxAmount: 0,
    grandTotal: 0,
    couponCode: null,
    freeDeliveryThreshold: 499,
    amountToFreeDelivery: 499,
  },
  itemCount: 0,
};

type Toast = { id: number; message: string; tone: "success" | "error" };

type AppContextValue = {
  cart: CartSummary;
  cartLoading: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  user: SessionUser | null;
  userLoading: boolean;
  refreshCart: () => Promise<void>;
  refreshUser: () => Promise<void>;
  addItem: (productId: string, variantId: string, quantity?: number) => Promise<boolean>;
  setQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<void>;
  logout: () => Promise<void>;
  notify: (message: string, tone?: "success" | "error") => void;
};

const AppContext = createContext<AppContextValue | null>(null);

type ApiEnvelope<T> = { success: boolean; data?: T; error?: { message: string } };

async function callApi<T>(input: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  try {
    const response = await fetch(input, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    return (await response.json()) as ApiEnvelope<T>;
  } catch {
    return { success: false, error: { message: "Network error. Please retry." } };
  }
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartSummary>(EMPTY_CART);
  const [cartLoading, setCartLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, tone: "success" | "error" = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3600);
  }, []);

  const refreshCart = useCallback(async () => {
    const result = await callApi<CartSummary>("/api/v1/cart");
    if (result.success && result.data) setCart(result.data);
    setCartLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    const result = await callApi<{ authenticated: boolean; user: SessionUser | null }>("/api/v1/auth/me");
    setUser(result.success && result.data?.authenticated ? (result.data.user ?? null) : null);
    setUserLoading(false);
  }, []);

  useEffect(() => {
    // Deferred to a task so the initial paint is never blocked by cascading state updates.
    const timer = setTimeout(() => {
      void refreshCart();
      void refreshUser();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshCart, refreshUser]);

  const mutate = useCallback(
    async (input: string, init: RequestInit, successMessage?: string) => {
      const result = await callApi<CartSummary>(input, init);
      if (result.success && result.data) {
        setCart(result.data);
        if (successMessage) notify(successMessage);
        return true;
      }
      notify(result.error?.message ?? "Something went wrong", "error");
      return false;
    },
    [notify],
  );

  const addItem = useCallback(
    async (productId: string, variantId: string, quantity = 1) => {
      const done = await mutate(
        "/api/v1/cart",
        { method: "POST", body: JSON.stringify({ productId, variantId, quantity }) },
        "Added to basket",
      );
      if (done) setDrawerOpen(true);
      return done;
    },
    [mutate],
  );

  const setQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      await mutate("/api/v1/cart", { method: "PATCH", body: JSON.stringify({ itemId, quantity }) });
    },
    [mutate],
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      await mutate(`/api/v1/cart?itemId=${itemId}`, { method: "DELETE" }, "Removed from basket");
    },
    [mutate],
  );

  const clearCart = useCallback(async () => {
    await mutate("/api/v1/cart", { method: "DELETE" }, "Basket cleared");
  }, [mutate]);

  const applyCoupon = useCallback(
    async (code: string) => mutate("/api/v1/coupon", { method: "POST", body: JSON.stringify({ code }) }, `Coupon ${code} applied`),
    [mutate],
  );

  const removeCoupon = useCallback(async () => {
    await mutate("/api/v1/coupon", { method: "DELETE" }, "Coupon removed");
  }, [mutate]);

  const logout = useCallback(async () => {
    await callApi("/api/v1/auth/logout", { method: "POST" });
    setUser(null);
    await refreshCart();
    notify("Signed out");
  }, [notify, refreshCart]);

  const value = useMemo<AppContextValue>(
    () => ({
      cart,
      cartLoading,
      drawerOpen,
      setDrawerOpen,
      user,
      userLoading,
      refreshCart,
      refreshUser,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      applyCoupon,
      removeCoupon,
      logout,
      notify,
    }),
    [
      cart,
      cartLoading,
      drawerOpen,
      user,
      userLoading,
      refreshCart,
      refreshUser,
      addItem,
      setQuantity,
      removeItem,
      clearCart,
      applyCoupon,
      removeCoupon,
      logout,
      notify,
    ],
  );

  return (
    <AppContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-24 left-1/2 z-[80] flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2 md:bottom-8"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              className={`pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
                toast.tone === "error" ? "bg-red-600" : "bg-brand-700"
              }`}
            >
              {toast.tone === "error" ? (
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              )}
              <span className="flex-1">{toast.message}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProviders");
  return context;
}
