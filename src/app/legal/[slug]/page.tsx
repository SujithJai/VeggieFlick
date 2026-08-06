import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/ui/primitives";

export const dynamic = "force-static";

type Params = Promise<{ slug: string }>;

const DOCUMENTS: Record<string, { title: string; updated: string; sections: { heading: string; body: string }[] }> = {
  privacy: {
    title: "Privacy Policy",
    updated: "1 January 2026",
    sections: [
      {
        heading: "Information we collect",
        body: "We collect your name, mobile number, email, delivery addresses and order history to fulfil orders. Payment details are handled entirely by Razorpay — VeggieFlick never stores card numbers, UPI handles or CVV data on its servers.",
      },
      {
        heading: "How we use your data",
        body: "Your data is used to deliver orders, process refunds, send transactional updates over SMS, email and WhatsApp, prevent fraud and improve recommendations. We do not sell personal data to third parties.",
      },
      {
        heading: "Consent and communication preferences",
        body: "Transactional messages relating to your orders are always sent. Marketing messages require explicit consent and can be turned off at any time from your account or by replying STOP to any message.",
      },
      {
        heading: "Data retention and security",
        body: "Order records are retained for eight years to meet GST and audit obligations. Access is role-restricted, all traffic is encrypted in transit, and every back-office action is written to an immutable audit log.",
      },
      {
        heading: "Your rights",
        body: "You can request a copy of your data, correct inaccuracies or ask for deletion of non-statutory records by writing to privacy@veggieflick.in. We respond within 30 days.",
      },
    ],
  },
  terms: {
    title: "Terms & Conditions",
    updated: "1 January 2026",
    sections: [
      {
        heading: "Service area",
        body: "VeggieFlick delivers within a 25 km radius of its Koyambedu hub in Chennai. Orders placed for addresses outside this radius will be declined at checkout or refunded in full.",
      },
      {
        heading: "Pricing and availability",
        body: "Prices of fresh produce fluctuate daily. The price shown at the moment your order is confirmed is final; all totals are recalculated on our servers before payment. Items may be substituted only with your consent.",
      },
      {
        heading: "Weights and tolerances",
        body: "Fresh produce is subject to a natural weight tolerance of ±5% after cleaning and trimming. Cut vegetables are packed by net weight after processing.",
      },
      {
        heading: "Cancellation and refunds",
        body: "Orders can be cancelled until they are marked out for delivery. Prepaid amounts are refunded to your VeggieFlick wallet immediately, or to the source account within 5-7 business days on request.",
      },
      {
        heading: "Liability",
        body: "Our liability for any order is limited to the value of that order. VeggieFlick is not liable for indirect losses arising from delivery delays caused by weather, civic disruptions or force majeure events.",
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(DOCUMENTS).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const doc = DOCUMENTS[slug];
  if (!doc) return { title: "Document not found" };
  return {
    title: doc.title,
    description: `${doc.title} for VeggieFlick — Chennai fresh produce delivery.`,
    alternates: { canonical: `/legal/${slug}` },
  };
}

export default async function LegalPage({ params }: { params: Params }) {
  const { slug } = await params;
  const doc = DOCUMENTS[slug];
  if (!doc) notFound();

  return (
    <div className="container-page py-6 md:py-10">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: doc.title }]} />
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{doc.title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated {doc.updated}</p>
        <div className="mt-8 grid gap-7">
          {doc.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-lg font-bold">{section.heading}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{section.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
