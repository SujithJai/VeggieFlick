import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, ne, desc } from "drizzle-orm";
import { db } from "@/db";
import { blogs } from "@/db/schema";
import { Breadcrumb } from "@/components/ui/primitives";
import { formatDateIST } from "@/lib/utils";
import { DynamicIcon } from "@/lib/icons";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

async function loadPost(slug: string) {
  const [post] = await db
    .select()
    .from(blogs)
    .where(and(eq(blogs.slug, slug), eq(blogs.status, "active")))
    .limit(1);
  return post ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.shortDescription ?? undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.shortDescription ?? undefined },
  };
}

export default async function BlogDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) notFound();

  const icon = post.emoji;
  const related = await db
    .select({ id: blogs.id, title: blogs.title, slug: blogs.slug, emoji: blogs.emoji })
    .from(blogs)
    .where(and(eq(blogs.status, "active"), ne(blogs.id, post.id)))
    .orderBy(desc(blogs.publishedAt))
    .limit(3);

  return (
    <article className="container-page py-6 md:py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Journal", href: "/blog" }, { label: post.title }]} />
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow">{formatDateIST(post.publishedAt)} · {post.author}</p>
        <h1 className="mt-3 text-balance text-[32px] font-bold leading-[1.1] tracking-[-0.02em] md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-muted">{post.shortDescription}</p>

        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl bg-surface">
          <span className="absolute inset-0 flex items-center justify-center text-brand-700/60">
            <DynamicIcon name={icon} size={80} strokeWidth={1.1} />
          </span>
        </div>

        <div className="mt-10 grid gap-6 text-[16px] leading-[1.7] text-ink/85 text-pretty">
          {post.content.split("\n\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-12 rounded-3xl bg-surface p-8 text-center">
          <p className="text-[14px] font-semibold text-ink">Put this into practice tonight</p>
          <Link href="/shop" className="btn btn-primary mt-4">
            Shop fresh produce
          </Link>
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-4 text-lg font-bold">More from the journal</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((item) => {
                return (
                  <Link key={item.id} href={`/blog/${item.slug}`} className="card card-lift p-4">
                    <DynamicIcon name={item.emoji} size={24} strokeWidth={1.5} className="text-brand-700" />
                    <p className="mt-3 text-[13px] font-semibold">{item.title}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
