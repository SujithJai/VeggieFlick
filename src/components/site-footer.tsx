import Link from "next/link";
import { Bike, Leaf, Mail, MapPin, Phone, ShieldCheck, ShoppingBag } from "lucide-react";
import { NewsletterForm } from "@/components/newsletter-form";

const SHOP_LINKS = [
  { label: "Fresh Vegetables", href: "/shop?category=fresh-vegetables" },
  { label: "Fresh Fruits", href: "/shop?category=fresh-fruits" },
  { label: "Cut Vegetables", href: "/shop?category=cut-vegetables" },
  { label: "Leafy Vegetables", href: "/shop?category=leafy-vegetables" },
  { label: "Organic", href: "/shop?category=organic" },
  { label: "Ready To Cook", href: "/shop?category=ready-to-cook" },
];

const COMPANY_LINKS = [
  { label: "About", href: "/about" },
  { label: "Our Process", href: "/about" },
  { label: "Quality Promise", href: "/about" },
  { label: "Journal", href: "/blog" },
  { label: "Recipes", href: "/recipes" },
];

const HELP_LINKS = [
  { label: "FAQ", href: "/help" },
  { label: "Contact", href: "/help#contact" },
  { label: "Track Order", href: "/orders" },
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms & Conditions", href: "/legal/terms" },
];

const SOCIAL = [
  { label: "Instagram", Icon: ShoppingBag },
  { label: "X", Icon: ShoppingBag },
  { label: "YouTube", Icon: ShoppingBag },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        {/* Brand */}
        <div className="lg:col-span-2">
          <Link href="/" className="text-[20px] font-bold tracking-[-0.03em] text-ink">
            Veggie<span className="text-brand-700">Flick</span>
          </Link>
          <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-muted">
            Chennai&apos;s premium fresh produce delivery. Harvested at dawn, quality-checked twice and delivered
            within your chosen slot — anywhere inside a 25 km radius.
          </p>
          <div className="mt-5 grid gap-2 text-[13px] text-muted">
            <p className="flex items-center gap-2">
              <MapPin size={14} strokeWidth={1.6} className="text-brand-700" /> Koyambedu Hub, Chennai 600026
            </p>
            <p className="flex items-center gap-2">
              <Phone size={14} strokeWidth={1.6} className="text-brand-700" /> +91 44 4000 2200
            </p>
            <p className="flex items-center gap-2">
              <Mail size={14} strokeWidth={1.6} className="text-brand-700" /> hello@veggieflick.in
            </p>
          </div>
          <div className="mt-5 flex gap-2">
            {SOCIAL.map(({ label, Icon }) => (
              <span
                key={label}
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                <Icon size={14} strokeWidth={1.6} />
              </span>
            ))}
          </div>
        </div>

        {/* Links */}
        <nav aria-label="Shop">
          <h2 className="mb-4 text-[12px] font-semibold tracking-widest text-muted uppercase">Shop</h2>
          <ul className="grid gap-2.5 text-[13px]">
            {SHOP_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink transition-colors hover:text-brand-700">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Company">
          <h2 className="mb-4 text-[12px] font-semibold tracking-widest text-muted uppercase">Company</h2>
          <ul className="grid gap-2.5 text-[13px]">
            {COMPANY_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink transition-colors hover:text-brand-700">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <nav aria-label="Help">
            <h2 className="mb-4 text-[12px] font-semibold tracking-widest text-muted uppercase">Help</h2>
            <ul className="grid gap-2.5 text-[13px]">
              {HELP_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ink transition-colors hover:text-brand-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6">
            <h2 className="mb-2 text-[12px] font-semibold tracking-widest text-muted uppercase">
              Fresh drops
            </h2>
            <NewsletterForm />
          </div>
        </div>
      </div>

      <div className="border-t border-line bg-surface">
        <div className="container-page flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-5 text-[12px] font-medium text-muted">
          <span className="flex items-center gap-1.5">
            <Bike size={13} strokeWidth={1.6} className="text-brand-700" /> Same-day delivery across Chennai
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={13} strokeWidth={1.6} className="text-brand-700" /> Secure payments via Razorpay
          </span>
          <span className="flex items-center gap-1.5">
            <Leaf size={13} strokeWidth={1.6} className="text-brand-700" /> FSSAI licensed · GST registered
          </span>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-[11px] text-muted md:flex-row">
          <p>© {new Date().getFullYear()} VeggieFlick Retail Private Limited. All rights reserved.</p>
          <p>GSTIN 33AABCV1234F1Z5 · FSSAI 10023456001234</p>
        </div>
      </div>
    </footer>
  );
}
