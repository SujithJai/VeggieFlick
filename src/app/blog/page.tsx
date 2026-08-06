import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogs } from "@/db/schema";
import { Breadcrumb, SectionHeading } from "@/components/ui/primitives";
import { formatDateIST } from "@/lib/utils";
import { lookupIcon } from "@/lib/icons";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog — Fresh produce guides, storage tips and seasonal eating",
  description:
    "Practical guides on buying, storing and cooking fresh vegetables and fruits in Chennai, written by the VeggieFlick team.",
  alternates: { canonical: "/blog" },
};

export default async function BlogListPage() {
  const posts = await db.select().from(blogs).where(eq(blogs.status, "active")).orderBy(desc(blogs.publishedAt));

  return (
    <div className="container-page py-6 md:py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Journal" }]} />
      <SectionHeading
        eyebrow="VeggieFlick journal"
        title="Healthy living, the Chennai way"
        description="Seasonal guides, storage hacks and behind-the-scenes stories from our cold chain."
      />
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => {
          const Icon = lookupIcon(post.emoji);
          return (
            <article key={post.id} className="card card-lift overflow-hidden">
              <Link href={`/blog/${post.slug}`}>
                <div className="relative aspect-[16/9] bg-surface">
                  <span className="absolute inset-0 flex items-center justify-center text-brand-700/60">
                    <Icon size={44} strokeWidth={1.3} />
                  </span>
                </div>
              </Link>
              <div className="p-5">
                <p className="eyebrow">{formatDateIST(post.publishedAt)} · {post.author}</p>
                <h2 className="mt-2 text-[16px] font-semibold tracking-[-0.01em]">
                  <Link href={`/blog/${post.slug}`} className="hover:text-brand-700">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-muted">
                  {post.shortDescription}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink transition-colors hover:text-brand-700"
                >
                  Read article
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
