import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Leaf, ShieldCheck, Snowflake, Sprout, Truck } from "lucide-react";
import { Breadcrumb } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "About Us — Our farms, our process and our quality promise",
  description:
    "VeggieFlick sources directly from Tamil Nadu farms, runs a 24-hour cold chain in Chennai and delivers fresh produce within a 25 km radius.",
  alternates: { canonical: "/about" },
};

const PROCESS = [
  { Icon: Sprout, title: "04:00 · Harvest & sourcing", body: "Our buyers grade produce at Koyambedu and at partner farms in Hosur, Ooty, Theni and Thiruvallur." },
  { Icon: Snowflake, title: "07:00 · Wash & cold room", body: "Ozonated wash, second grading, and straight into a 4°C cold room with harvest timestamps on every crate." },
  { Icon: BadgeCheck, title: "10:00 · Quality check", body: "Random sampling for firmness, colour, moisture and pesticide residue. Anything failing goes to donation partners." },
  { Icon: Truck, title: "Slot delivery", body: "Insulated bags with gel packs, routed by slot so nothing sits in a Chennai afternoon." },
];

export default function AboutPage() {
  return (
    <div className="container-page py-6 md:py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About us" }]} />

      <section className="grid items-center gap-8 lg:grid-cols-2">
        <div>
          <span className="chip bg-brand-50 text-brand-700">Since 2021 · Chennai</span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-5xl">
            We built a cold chain so your keerai still snaps.
          </h1>
          <p className="mt-4 text-base text-muted">
            VeggieFlick started with a simple frustration: produce in Chennai loses a full day of life between the
            farm and the kitchen. So we rebuilt the middle — direct sourcing, a single high-throughput hub, and a
            hard 24-hour rule on every crate we ship.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/shop" className="btn btn-primary px-5 py-2.5 text-sm">
              Shop our harvest
            </Link>
            <Link href="/help#contact" className="btn btn-outline px-5 py-2.5 text-sm">
              Talk to our team
            </Link>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[20px] shadow-lg">
          <Image
            src="/images/hero-basket.jpg"
            alt="Fresh produce sorted at the VeggieFlick Chennai hub"
            fill
            sizes="(max-width: 1024px) 100vw, 560px"
            className="object-cover"
          />
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { value: "12,400+", label: "Chennai households served" },
          { value: "36+", label: "SKUs graded daily" },
          { value: "25 km", label: "Delivery radius" },
          { value: "< 24 h", label: "Farm-to-door promise" },
        ].map((stat) => (
          <div key={stat.label} className="card p-5 text-center">
            <p className="text-3xl font-extrabold text-brand-700">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold text-muted uppercase">{stat.label}</p>
          </div>
        ))}
      </section>

      <section id="process" className="mt-16 scroll-mt-32">
        <h2 className="text-2xl font-bold md:text-3xl">Our process</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          One hub, four checkpoints, zero shortcuts. Here is exactly what happens between the field and your
          doorstep.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map(({ Icon, title, body }) => (
            <div key={title} className="card p-5">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="quality" className="mt-16 scroll-mt-32">
        <h2 className="text-2xl font-bold md:text-3xl">Our quality promise</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { Icon: ShieldCheck, title: "Same-day refund", body: "Not happy with an item? Report it on delivery day and the amount lands in your wallet instantly — no pickup required for produce." },
            { Icon: Leaf, title: "No carbide ripening", body: "Fruits are ripened naturally in hay or ethylene-free chambers. We reject carbide-ripened stock at the gate." },
            { Icon: BadgeCheck, title: "Licensed & compliant", body: "FSSAI licensed, GST registered, PCI-DSS compliant payments through Razorpay and consent-based data handling." },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="card p-6">
              <Icon className="h-6 w-6 text-brand-600" aria-hidden />
              <h3 className="mt-3 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
