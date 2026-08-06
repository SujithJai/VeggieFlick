import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";

/* =============================================================
   Premium Tile — image slot on product cards. Accepts an icon
   name or a real photo path. Background gradient is category-aware.
   ============================================================= */
const TILE_GRADIENT: Record<string, [string, string]> = {
  vegetables: ["#f0fdf4", "#dcfce7"],
  fruits: ["#fff7ed", "#ffedd5"],
  leafy: ["#f0fdf4", "#d1fae5"],
  cut: ["#f0f9ff", "#e0f2fe"],
  organic: ["#f0fdf4", "#dcfce7"],
  exotic: ["#faf5ff", "#f3e8ff"],
  salad: ["#fefce8", "#fef9c3"],
  ready: ["#fff7ed", "#fed7aa"],
  default: ["#f8fafc", "#f1f5f9"],
};

export function PremiumTile({
  icon,
  image,
  alt,
  categorySlug,
  className,
  size = 28,
}: {
  icon?: string | null;
  image?: string | null;
  alt?: string;
  categorySlug?: string;
  className?: string;
  size?: number;
}) {
  const [from, to] = TILE_GRADIENT[categorySlug ?? "default"] ?? TILE_GRADIENT.default;

  return (
    <div
      className={cn("product-tile relative", className)}
      style={{ ["--tile-from" as string]: from, ["--tile-to" as string]: to }}
      aria-hidden={true}
    >
      {image ? (
        <Image
          src={image}
          alt={alt ?? ""}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover"
        />
      ) : (
        <DynamicIcon
          name={icon ?? categorySlug}
          size={size}
          strokeWidth={1.4}
          className="text-brand-700/70"
        />
      )}
    </div>
  );
}

export function CategoryIconTile({
  icon,
  accent = "#15803d",
  size = 52,
}: {
  icon?: string | null;
  accent?: string;
  size?: number;
}) {
  return (
    <span
      className="flex items-center justify-center rounded-full border border-line bg-white"
      style={{ width: size, height: size, color: accent }}
    >
      <DynamicIcon name={icon} size={Math.round(size * 0.44)} strokeWidth={1.5} />
    </span>
  );
}

export function Rating({
  value,
  count,
  className,
}: {
  value: number;
  count?: number;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium text-ink", className)}>
      <Star
        className="h-3 w-3 fill-[#f97316] text-[#f97316]"
        strokeWidth={1.6}
        aria-hidden
      />
      <span>{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className="font-normal text-muted">({count.toLocaleString("en-IN")})</span>
      )}
    </span>
  );
}

export function Badge({
  children,
  tone = "brand",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: "brand" | "fresh" | "offer" | "muted" | "danger" | "warning";
  className?: string;
  icon?: string;
}) {
  const tones = {
    brand: "chip-brand",
    fresh: "chip-fresh",
    offer: "chip-offer",
    muted: "chip-muted",
    danger: "chip-danger",
    warning: "chip-warning",
  };
  return (
    <span className={cn("chip", tones[tone], className)}>
      {icon && <DynamicIcon name={icon} size={12} strokeWidth={1.8} />}
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="text-balance text-[28px] font-bold tracking-[-0.02em] text-ink md:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">{description}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-semibold text-ink transition-colors hover:text-brand-700"
        >
          {linkLabel}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
}

export function EmptyState({
  icon = "shopping",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-brand-700">
        <DynamicIcon name={icon} size={28} strokeWidth={1.5} />
      </span>
      <div className="max-w-sm space-y-1">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="text-sm text-muted">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  placed: "chip-muted",
  confirmed: "chip-brand",
  packed: "chip-brand",
  out_for_delivery: "chip-warning",
  delivered: "chip-brand",
  cancelled: "chip-danger",
  returned: "chip-danger",
  paid: "chip-brand",
  pending: "chip-warning",
  refunded: "chip-warning",
  failed: "chip-danger",
  active: "chip-brand",
  inactive: "chip-muted",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span className={cn("chip capitalize", STATUS_TONES[status] ?? "chip-muted")}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {item.href ? (
              <Link href={item.href} className="transition-colors hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-ink">{item.label}</span>
            )}
            {index < items.length - 1 && (
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
