import type { Metadata } from "next";
import { Clock4, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Breadcrumb } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Help Centre — FAQ, delivery slots and contact",
  description:
    "Answers on delivery slots, the 25 km Chennai radius, payments, refunds, coupons and how to reach the VeggieFlick support team.",
  alternates: { canonical: "/help" },
};

const FAQ = [
  {
    q: "Which areas of Chennai do you deliver to?",
    a: "We deliver anywhere within a 25 km radius of our Koyambedu hub — including Anna Nagar, T. Nagar, Adyar, Velachery, Porur, Ambattur, OMR up to Sholinganallur and Tambaram. Enter your pincode on any product page to confirm.",
  },
  {
    q: "What are the delivery slots and charges?",
    a: "Six slots run daily from 6 AM to 8 PM. Delivery is ₹30 up to 5 km, ₹50 up to 10 km, ₹70 up to 15 km and ₹100 up to 25 km. Orders above ₹499 ship free anywhere in the radius.",
  },
  {
    q: "How fresh is the produce, really?",
    a: "Every crate carries a harvest timestamp. Nothing older than 24 hours at our hub is shipped. Leafy greens are packed the same morning they are cut.",
  },
  {
    q: "What payment methods do you accept?",
    a: "UPI, credit and debit cards, net banking and wallet — all processed through Razorpay's PCI-DSS compliant gateway. Cash on delivery is available across the service area.",
  },
  {
    q: "How do cancellations and refunds work?",
    a: "You can cancel any order until it is marked out for delivery. Prepaid amounts are credited to your VeggieFlick wallet instantly and can be used on your next order.",
  },
  {
    q: "How do coupons and loyalty points work?",
    a: "Apply one coupon per order at checkout. You earn one loyalty point per ₹100 spent, and tiers move from Bronze to Platinum as you shop.",
  },
];

export default function HelpPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="container-page py-6 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Help centre" }]} />

      <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">Help centre</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Everything about delivery, payments and refunds. Still stuck? Our Chennai support team answers within 15
        minutes between 6 AM and 9 PM.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <section id="faq" className="scroll-mt-32">
          <h2 className="text-xl font-bold">Frequently asked questions</h2>
          <div className="mt-4 grid gap-3">
            {FAQ.map((item) => (
              <details key={item.q} className="card group p-5">
                <summary className="cursor-pointer list-none text-sm font-bold text-ink marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {item.q}
                    <span className="text-brand-600 transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <aside id="contact" className="scroll-mt-32">
          <div className="card p-5">
            <h2 className="text-lg font-bold">Contact us</h2>
            <ul className="mt-4 grid gap-3 text-sm">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden />
                <span>
                  <span className="block font-semibold">+91 44 4000 2200</span>
                  <span className="text-xs text-muted">6 AM – 9 PM, all days</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden />
                <span>
                  <a
                    href="https://wa.me/914440002200"
                    className="block font-semibold underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp support
                  </a>
                  <span className="text-xs text-muted">Fastest response</span>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden />
                <span className="font-semibold">hello@veggieflick.in</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden />
                <span className="text-muted">
                  VeggieFlick Hub, Koyambedu Market Complex, Chennai 600026
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock4 className="mt-0.5 h-4 w-4 text-brand-600" aria-hidden />
                <span className="text-muted">Delivery slots: 6 AM – 8 PM daily</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
