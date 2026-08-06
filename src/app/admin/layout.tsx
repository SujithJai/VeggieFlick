import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  Boxes,
  Carrot,
  LayoutDashboard,
  ShoppingCart,
  Ticket,
  Truck,
  Users,
} from "lucide-react";
import { getSession, BACK_OFFICE_ROLES } from "@/lib/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingCart },
  { href: "/admin/catalog", label: "Products", Icon: Boxes },
  { href: "/admin/catalog?tab=inventory", label: "Inventory", Icon: BarChart3 },
  { href: "/admin/catalog?tab=coupons", label: "Coupons", Icon: Ticket },
  { href: "/admin/orders?status=out_for_delivery", label: "Delivery", Icon: Truck },
  { href: "/admin/orders?status=delivered", label: "Customers", Icon: Users },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const isStaff = session ? BACK_OFFICE_ROLES.includes(session.role) : false;

  if (!isStaff) return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white lg:flex">
          <div className="flex items-center gap-2 border-b border-line px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Carrot size={18} strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-bold">VeggieFlick</p>
              <p className="text-[10px] font-semibold tracking-widest text-brand-600 uppercase">Back office</p>
            </div>
          </div>
          <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto p-3">
            <ul className="grid gap-1">
              {NAV.map(({ href, label, Icon }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-line p-3 text-xs text-muted">
            <p className="font-semibold text-ink">{session?.name}</p>
            <p className="capitalize">{session?.role.replace(/_/g, " ")}</p>
            <Link href="/" className="mt-2 inline-block font-semibold text-brand-700">
              ← Back to storefront
            </Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-line bg-white/95 px-4 py-3 backdrop-blur md:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Carrot size={16} strokeWidth={1.8} />
              </span>
              <span className="text-sm font-bold">VeggieFlick Admin</span>
            </div>
            <nav aria-label="Admin quick links" className="hidden gap-1 lg:flex">
              {NAV.slice(0, 4).map(({ href, label }) => (
                <Link
                  key={label}
                  href={href}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2 text-xs">
              <span className="hidden rounded-full bg-brand-50 px-3 py-1.5 font-semibold text-brand-700 sm:inline">
                Chennai Central Hub
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {session?.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </header>
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
