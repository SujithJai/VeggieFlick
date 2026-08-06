"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUp, Home, Leaf, MessageCircle, Search, ShoppingBag, User } from "lucide-react";
import { useApp } from "@/components/providers";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/shop", label: "Shop", Icon: Leaf },
  { href: "/shop?sort=newest", label: "Search", Icon: Search },
  { href: "/cart", label: "Basket", Icon: ShoppingBag },
  { href: "/account", label: "Account", Icon: User },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { cart } = useApp();
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]);
          return (
            <li key={label}>
              <Link
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors",
                  active ? "text-brand-700" : "text-muted",
                )}
              >
                <Icon size={18} strokeWidth={1.7} />
                {label}
                {label === "Basket" && cart.itemCount > 0 && (
                  <span className="absolute top-1.5 right-[22%] flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-700 px-1 text-[9px] font-semibold text-white">
                    {cart.itemCount}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function FloatingActions() {
  const pathname = usePathname();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  return (
    <div className="fixed right-4 bottom-20 z-50 flex flex-col gap-2 md:bottom-6">
      {showTop && (
        <button
          type="button"
          aria-label="Scroll to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-ink shadow-md transition-colors hover:bg-surface"
        >
          <ArrowUp size={16} strokeWidth={1.7} />
        </button>
      )}
      <a
        href="https://wa.me/914440002200?text=Hi%20VeggieFlick%2C%20I%20need%20help%20with%20my%20order"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with VeggieFlick on WhatsApp"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-105"
      >
        <MessageCircle size={20} strokeWidth={1.7} />
      </a>
    </div>
  );
}

export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
  return <>{children}</>;
}
