import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-surface text-brand-700">
        <ShoppingBag size={32} strokeWidth={1.5} />
      </span>
      <h1 className="mt-6 text-balance text-3xl font-bold tracking-[-0.02em] md:text-4xl">
        This page went to the market
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
        The page you are looking for is not on our shelves. Let&apos;s get you back to something fresh.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn btn-primary">Back home</Link>
        <Link href="/shop" className="btn btn-outline">Browse products</Link>
      </div>
    </div>
  );
}
