import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartDrawer } from "@/components/cart-drawer";
import { FloatingActions, HideOnAdmin, MobileBottomNav } from "@/components/mobile-nav";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://veggieflick.in";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VeggieFlick — Farm Fresh Vegetables & Fruits Delivered in Chennai",
    template: "%s | VeggieFlick",
  },
  description:
    "Order farm fresh vegetables, fruits, cut vegetables and ready-to-cook kits online in Chennai. Harvested at dawn, delivered in your chosen slot within 25 km. Free delivery above ₹499.",
  keywords: [
    "vegetables online Chennai",
    "fruits delivery Chennai",
    "cut vegetables Chennai",
    "organic vegetables Chennai",
    "grocery delivery Chennai",
    "VeggieFlick",
  ],
  authors: [{ name: "VeggieFlick Retail Private Limited" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "VeggieFlick",
    title: "VeggieFlick — Farm Fresh. Delivered Fast.",
    description:
      "Chennai's premium fresh produce delivery. Vegetables, fruits, cut veggies and recipe kits delivered within your slot.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VeggieFlick — Farm Fresh. Delivered Fast.",
    description: "Fresh vegetables and fruits delivered across Chennai within 25 km.",
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.webmanifest",
  applicationName: "VeggieFlick",
  appleWebApp: { capable: true, title: "VeggieFlick", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#16A34A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "GroceryStore",
  name: "VeggieFlick",
  image: `${siteUrl}/images/hero-basket.jpg`,
  description: "Farm fresh vegetables and fruits delivered across Chennai.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Koyambedu Market Complex",
    addressLocality: "Chennai",
    addressRegion: "Tamil Nadu",
    postalCode: "600026",
    addressCountry: "IN",
  },
  telephone: "+914440002200",
  priceRange: "₹₹",
  areaServed: "Chennai",
  currenciesAccepted: "INR",
  paymentAccepted: "UPI, Credit Card, Debit Card, Net Banking, Cash on Delivery",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-white font-sans text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <AppProviders>
          <SiteHeader />
          <main id="main" className="min-h-[60vh] pb-20 md:pb-0">
            {children}
          </main>
          <HideOnAdmin>
            <SiteFooter />
          </HideOnAdmin>
          <CartDrawer />
          <MobileBottomNav />
          <FloatingActions />
        </AppProviders>
      </body>
    </html>
  );
}
