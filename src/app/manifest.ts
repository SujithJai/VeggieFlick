import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VeggieFlick — Farm Fresh. Delivered Fast.",
    short_name: "VeggieFlick",
    description:
      "Order farm fresh vegetables, fruits and ready-to-cook kits in Chennai with slot-based delivery within 25 km.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#16A34A",
    lang: "en-IN",
    categories: ["shopping", "food", "lifestyle"],
    icons: [
      { src: "/images/hero-basket.jpg", sizes: "512x512", type: "image/jpeg", purpose: "any" },
    ],
    shortcuts: [
      { name: "Shop", url: "/shop" },
      { name: "My basket", url: "/cart" },
      { name: "My orders", url: "/orders" },
    ],
  };
}
