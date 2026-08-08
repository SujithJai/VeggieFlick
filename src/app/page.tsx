import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Bike, ChefHat, Clock, Leaf, MessageCircle, ShieldCheck, Sparkles, Star, Truck, UtensilsCrossed } from "lucide-react";
import { db } from "@/db";
import { blogs, recipes } from "@/db/schema";
import { catalogCounts, listCategories, listCollection } from "@/lib/services/catalog";
import { ProductCard, ProductCarousel } from "@/components/product-card";
import { NewsletterForm } from "@/components/newsletter-form";
import { CategoryIconTile, SectionHeading, Badge } from "@/components/ui/primitives";
import { lookupIcon } from "@/lib/icons";

export const dynamic = "force-dynamic";

const WHY_US = [
  { Icon: Leaf, title: "Harvested this morning", body: "Sourced at 4 AM from Koyambedu and partner farms in Hosur, Ooty and Thiruvallur." },
  { Icon: Truck, title: "Slot delivery in Chennai", body: "Six delivery slots a day, insulated bags and live tracking within a 25 km radius." },
  { Icon: ShieldCheck, title: "Double quality check", body: "Graded at the farm gate and re-inspected at our hub. Anything over 24 hours never ships." },
  { Icon: Sparkles, title: "No-questions refunds", body: "Not happy with an item? Instant wallet refund on the same day of delivery." },
];

const TESTIMONIALS = [
  { name: "Lakshmi Subramanian", area: "Anna Nagar", text: "The keerai actually snaps when you bend it — that never happens with other apps. Sambar kit is a lifesaver on weeknights.", rating: 5 },
  { name: "Rahul Menon", area: "OMR Thoraipakkam", text: "Ordered at 9 PM, got my slot at 6 AM the next morning. Alphonso mangoes were exactly as promised, no carbide smell.", rating: 5 },
  { name: "Fathima Noor", area: "T. Nagar", text: "Cut vegetables save me twenty minutes every day and the packaging is genuinely clean. Prices beat my local market.", rating: 4 },
];

export default async function HomePage() {
  const [categories, flashSale, bestSellers, freshToday, organic, exotic, counts] = await Promise.all([
    listCategories(),
    listCollection({ minDiscount: 20 }, 10, "discount"),
    listCollection({ bestSeller: "true" }, 10, "popularity"),
    listCollection({ freshToday: "true" }, 8, "newest"),
    listCollection({ organic: "true" }, 8, "popularity"),
    listCollection({ category: "exotic-vegetables" }, 8, "popularity"),
    catalogCounts(),
  ]);

  let recipeRows: any[] = [];
  try {
    recipeRows = await db.select().from(recipes).where(eq(recipes.status, "active")).orderBy(desc(recipes.createdAt)).limit(4);
  } catch (err) {
    console.warn("recipes fetch warning:", err);
  }

  let blogRows: any[] = [];
  try {
    blogRows = await db.select().from(blogs).where(eq(blogs.status, "active")).orderBy(desc(blogs.publishedAt)).limit(3);
  } catch (err) {
    console.warn("blogs fetch warning:", err);
  }

  if (recipeRows.length === 0) {
    recipeRows = [
      { id: "r-1", title: "Classic Arachuvitta Sambar", slug: "classic-arachuvitta-sambar", emoji: "soup", summary: "Freshly ground sambar podi transforms an everyday sambar into a Sunday special.", preparationTime: 15, cookingTime: 30, difficulty: "Easy" },
      { id: "r-2", title: "Keerai Masiyal With Garlic Tempering", slug: "keerai-masiyal-with-garlic-tempering", emoji: "leafy", summary: "A five-ingredient comfort dish that pairs with rice, roti or idli.", preparationTime: 10, cookingTime: 15, difficulty: "Easy" },
      { id: "r-3", title: "Roasted Broccoli And Bell Pepper Toss", slug: "roasted-broccoli-and-bell-pepper-toss", emoji: "broccoli", summary: "A ten-minute high-protein side that keeps its crunch.", preparationTime: 10, cookingTime: 10, difficulty: "Easy" },
      { id: "r-4", title: "Chennai Sunday Vegetable Biryani", slug: "chennai-sunday-vegetable-biryani", emoji: "rice", summary: "Seeraga samba rice, mint and a kit that removes all the prep work.", preparationTime: 30, cookingTime: 35, difficulty: "Medium" }
    ];
  }

  if (blogRows.length === 0) {
    blogRows = [
      { id: "b-1", title: "How VeggieFlick Keeps Vegetables Farm Fresh For 24 Hours", slug: "how-veggieflick-keeps-vegetables-farm-fresh", emoji: "delivery", shortDescription: "From a 4 AM harvest to your kitchen before lunch — inside our Chennai cold chain." },
      { id: "b-2", title: "Seasonal Eating In Tamil Nadu: A Month By Month Guide", slug: "seasonal-eating-in-tamil-nadu", emoji: "calendar", shortDescription: "What to buy, when to buy it, and why seasonal produce always tastes better." },
      { id: "b-3", title: "Storing Greens So They Last Three Days Longer", slug: "storing-greens-so-they-last-three-days-longer", emoji: "leafy", shortDescription: "The wet-cloth method, the box trick, and mistakes that wilt your keerai overnight." }
    ];
  }

  return (
    <>
      {/* HERO SECTION WITH DUAL-TONE SOFT BLUE TO WHITE GRADIENT & EMBOSSED CHEF EASY COOKING BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-white pb-6 pt-4 md:py-16">
        {/* Subtle decorative color ambient glows */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-40 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="container-page grid items-center gap-10 py-6 md:py-8 lg:grid-cols-[1.15fr_1fr]">
          <div className="animate-fade-up">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand" icon="fresh">
                {counts.productCount}+ products · Chennai only
              </Badge>
              <span className="chip bg-sky-100 font-semibold text-sky-800 border border-sky-200">
                ✨ Easy Cooking & Ready to Meal
              </span>
            </div>

            <h1 className="mt-5 text-balance text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] text-ink md:text-[62px]">
              Farm fresh produce,{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-sky-600 to-emerald-700 bg-clip-text text-transparent">
                delivered before breakfast.
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">
              Vegetables, fruits, pre-cut veggies and 10-minute ready-to-cook meal kits picked at dawn from Tamil Nadu farms — at your Chennai doorstep when you need them.
            </p>

            {/* EMBOSSED CHEF DIALOGUE BANNER ("Easy Cooking for Office Returnees") */}
            <div className="mt-6 rounded-3xl border border-sky-200/80 bg-white/85 p-5 shadow-xl backdrop-blur-md transition-all hover:shadow-2xl md:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-600 text-white shadow-md">
                  <ChefHat className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                      Chef&apos;s Special Solution
                    </span>
                    <span className="text-xs text-muted flex items-center gap-1 font-medium">
                      <Clock size={12} className="text-sky-600" /> 10-Min Meal Kits
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-bold text-ink md:text-lg">
                    &ldquo;ஆபீஸ்ல இருந்து வர்றீங்களா? இனி குக் பண்ண கஷ்டப்பட வேண்டாம்!&rdquo;
                  </h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed md:text-sm">
                    No peeling, no chopping, zero stress. Pre-washed, freshly chopped veggies & 10-minute ready-to-cook meal kits ready when you reach home!
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Link
                      href="/shop?category=ready-to-cook"
                      className="btn btn-primary bg-sky-700 hover:bg-sky-800 border-none py-2 text-xs font-bold"
                    >
                      <UtensilsCrossed size={14} /> Ready to Cook Kits
                    </Link>
                    <Link
                      href="/shop?category=cut-vegetables"
                      className="btn btn-outline border-sky-300 text-sky-800 hover:bg-sky-50 py-2 text-xs font-semibold"
                    >
                      Pre-Cut Veggies 🥗
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/shop" className="btn btn-primary shadow-lg shadow-emerald-600/20">
                Shop today&apos;s harvest
              </Link>
              <Link href="/shop?freshToday=true" className="btn btn-outline bg-white/90">
                Fresh today collection
              </Link>
            </div>

            <dl className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              {[
                { label: "Delivery radius", value: "25 km" },
                { label: "Delivery slots", value: "6 daily" },
                { label: "Organic SKUs", value: `${counts.organicCount}+` },
              ].map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-sky-100 bg-white/90 px-3 py-3 shadow-sm">
                  <dt className="text-[10px] font-semibold tracking-widest text-muted uppercase">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-[20px] font-bold tracking-[-0.02em] text-ink">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border-4 border-white shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=1000&q=80"
                alt="Basket of fresh Indian vegetables and fruits"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 620px"
                className="object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <span className="rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                  Fresh Daily Harvest
                </span>
                <p className="mt-1 text-sm font-semibold text-white/90">Ooty Carrots, Country Tomatoes, Alphonso Mangoes & Leafy Greens</p>
              </div>
            </div>

            <div className="card absolute -bottom-5 left-4 flex items-center gap-3 border border-sky-100 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md md:left-8">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                <Bike size={18} strokeWidth={1.6} />
              </span>
              <div>
                <p className="text-[11px] text-muted">Next available slot</p>
                <p className="text-[13px] font-bold text-ink">Tomorrow · 06:00 – 08:00 AM</p>
              </div>
            </div>

            <div className="card absolute -top-4 right-4 hidden items-center gap-2 border border-emerald-100 bg-white/95 px-3 py-2 shadow-md md:flex">
              <span className="text-emerald-600">
                <Leaf size={14} strokeWidth={1.7} />
              </span>
              <span className="text-[12px] font-bold text-emerald-900">Farm Fresh Across Chennai</span>
            </div>
          </div>
        </div>
      </section>

      {/* INSTAMART-STYLE FREE DELIVERY BANNER */}
      <div className="bg-[#e6f9f3] border-y border-[#b2edd6] py-3 text-center text-xs md:text-sm font-extrabold text-[#00684a]">
        🚀 <span className="tracking-wide uppercase">FREE DELIVERY</span> on all orders above ₹199 across Chennai!
      </div>

      {/* CATEGORIES */}
      <section className="container-page py-10 md:py-14">
        <SectionHeading
          eyebrow="Shop by category"
          title="Everything fresh, sorted for you"
          description="Eight curated aisles built around how Chennai kitchens actually cook."
          href="/shop"
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="card card-lift flex flex-col items-center gap-3 p-4 text-center border-sky-100/60 hover:border-sky-300"
            >
              <CategoryIconTile icon={category.icon} accent={category.accent} size={56} />
              <span className="text-[13px] font-bold text-ink">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FLASH SALE */}
      {flashSale.length > 0 && (
        <section className="bg-surface py-14 md:py-16">
          <div className="container-page">
            <SectionHeading
              eyebrow="Flash sale · Today only"
              title="Biggest savings of the day"
              description="Deep discounts on surplus-fresh crates. Once they're gone, they're gone."
              href="/shop?sort=discount"
            />
            <ProductCarousel products={flashSale} />
          </div>
        </section>
      )}

      {/* BEST SELLERS */}
      <section className="container-page py-14 md:py-16">
        <SectionHeading
          eyebrow="Popular in Chennai"
          title="Most shopped near you"
          description="The daily fresh staples that go into thousands of Chennai kitchens every morning."
          href="/shop?bestSeller=true"
        />
        <ProductCarousel products={bestSellers} />
      </section>

      {/* FRESH TODAY */}
      {freshToday.length > 0 && (
        <section className="container-page py-14 md:py-16">
          <SectionHeading
            eyebrow="Fresh today"
            title="Harvested this morning"
            description="Crates that landed at our Koyambedu hub before sunrise."
            href="/shop?freshToday=true"
          />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {freshToday.slice(0, 8).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* WHY US */}
      <section className="bg-surface py-16 md:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Why VeggieFlick"
            title="Freshness is an operations problem. We solved it."
            description="A cold chain built for Chennai's climate, run on a 24-hour rule."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {WHY_US.map(({ Icon, title, body }) => (
              <div key={title} className="card p-6">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                  <Icon size={20} strokeWidth={1.6} />
                </span>
                <h3 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ORGANIC */}
      {organic.length > 0 && (
        <section className="container-page py-14 md:py-16">
          <SectionHeading
            eyebrow="Certified organic"
            title="Zero pesticide, full flavour"
            description="Jaivik Bharat certified growers from Krishnagiri, Ooty and Vellore."
            href="/shop?organic=true"
          />
          <ProductCarousel products={organic} />
        </section>
      )}

      {/* EXOTIC */}
      {exotic.length > 0 && (
        <section className="container-page py-14 md:py-16">
          <SectionHeading
            eyebrow="Exotic & continental"
            title="For the gourmet kitchen"
            description="Broccoli, zucchini, coloured peppers and cherry tomatoes from the Nilgiris."
            href="/shop?category=exotic-vegetables"
          />
          <ProductCarousel products={exotic} />
        </section>
      )}

      {/* RECIPES */}
      <section className="container-page py-14 md:py-16">
        <SectionHeading
          eyebrow="Cook with us"
          title="Recipes built around today's basket"
          description="Simple South Indian and continental recipes using produce you already ordered."
          href="/recipes"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recipeRows.map((recipe) => {
            const Icon = lookupIcon(recipe.emoji);
            return (
              <Link key={recipe.id} href={`/recipes/${recipe.slug}`} className="card card-lift overflow-hidden">
                <div className="relative aspect-[4/3] bg-surface">
                  <span className="absolute inset-0 flex items-center justify-center text-brand-700/60">
                    <Icon size={44} strokeWidth={1.3} />
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-1 text-[14px] font-semibold">{recipe.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[12px] text-muted">{recipe.summary}</p>
                  <p className="mt-3 text-[10px] font-semibold tracking-widest text-muted uppercase">
                    {recipe.preparationTime + recipe.cookingTime} min · {recipe.difficulty}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-ink py-16 text-white md:py-20">
        <div className="container-page">
          <div className="mb-10 text-center">
            <p className="eyebrow text-brand-300">Customer love</p>
            <h2 className="mt-2 text-balance text-3xl font-bold tracking-[-0.02em] md:text-4xl">
              Rated 4.8 by 12,400+ Chennai households
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <figure
                key={item.name}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <div className="mb-3 flex gap-0.5" aria-label={`${item.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      strokeWidth={1.6}
                      className={i < item.rating ? "fill-[#f97316] text-[#f97316]" : "text-white/20"}
                    />
                  ))}
                </div>
                <blockquote className="text-[14px] leading-relaxed text-white/85">
                  &ldquo;{item.text}&rdquo;
                </blockquote>
                <figcaption className="mt-5 text-[12px] font-semibold tracking-wider text-brand-300 uppercase">
                  {item.name} · {item.area}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section className="container-page py-14 md:py-16">
        <SectionHeading eyebrow="Healthy living" title="From the VeggieFlick journal" href="/blog" />
        <div className="grid gap-4 md:grid-cols-3">
          {blogRows.map((blog) => {
            const Icon = lookupIcon(blog.emoji);
            return (
              <Link key={blog.id} href={`/blog/${blog.slug}`} className="card card-lift overflow-hidden">
                <div className="relative aspect-[16/9] bg-surface">
                  <span className="absolute inset-0 flex items-center justify-center text-brand-700/60">
                    <Icon size={36} strokeWidth={1.3} />
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-[14px] font-semibold">{blog.title}</h3>
                  <p className="mt-1.5 line-clamp-2 text-[12px] text-muted">{blog.shortDescription}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* NEWSLETTER CTA */}
      <section className="container-page pb-16">
        <div className="card grid items-center gap-6 bg-surface p-6 md:grid-cols-2 md:p-10">
          <div>
            <p className="eyebrow">Fresh drops</p>
            <h2 className="mt-2 text-balance text-2xl font-bold tracking-[-0.02em] md:text-3xl">
              Get Friday&apos;s fresh drop first
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              Weekly seasonal picks, recipes from our kitchen and subscriber-only offers. No spam, unsubscribe
              anytime.
            </p>
            <ul className="mt-5 flex flex-wrap gap-4 text-[12px] font-semibold text-ink">
              <li className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-brand-700" /> Secure payments
              </li>
              <li className="flex items-center gap-1.5">
                <Bike size={14} className="text-brand-700" /> Free above ₹499
              </li>
              <li className="flex items-center gap-1.5">
                <Leaf size={14} className="text-brand-700" /> FSSAI certified
              </li>
            </ul>
          </div>
          <NewsletterForm variant="hero" />
        </div>
      </section>

    </>
  );
}
