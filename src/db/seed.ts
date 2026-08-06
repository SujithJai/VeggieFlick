import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { sql } from "drizzle-orm";
import { randomBytes, scryptSync } from "node:crypto";
import * as schema from "./schema";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
});
const db = drizzle(pool);

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type VariantSeed = { name: string; weight: number; unit: string; mrp: number; price: number; stock: number };

type ProductSeed = {
  name: string;
  tamil: string;
  emoji: string;
  category: string;
  sub?: string;
  short: string;
  description: string;
  origin: string;
  shelfLife: string;
  flags?: Partial<{
    featured: boolean;
    bestSeller: boolean;
    organic: boolean;
    cut: boolean;
    freshToday: boolean;
  }>;
  tax?: number;
  rating: number;
  ratingCount: number;
  sold: number;
  variants: VariantSeed[];
};

const CATEGORIES = [
  { name: "Fresh Vegetables", tamil: "காய்கறிகள்", icon: "vegetables", accent: "#15803d", desc: "Handpicked daily from Koyambedu and nearby farms." },
  { name: "Fresh Fruits", tamil: "பழங்கள்", icon: "fruits", accent: "#15803d", desc: "Naturally ripened seasonal fruits, sweetness guaranteed." },
  { name: "Cut Vegetables", tamil: "நறுக்கிய காய்கறி", icon: "cut", accent: "#15803d", desc: "Washed, peeled and chopped — cooking made effortless." },
  { name: "Leafy Vegetables", tamil: "கீரை வகைகள்", icon: "leafy", accent: "#15803d", desc: "Farm-fresh keerai bunches sorted every morning." },
  { name: "Organic", tamil: "இயற்கை", icon: "organic", accent: "#15803d", desc: "Certified organic, zero pesticide residue produce." },
  { name: "Exotic Vegetables", tamil: "விசேஷ காய்கறி", icon: "exotic", accent: "#15803d", desc: "Continental favourites for your gourmet kitchen." },
  { name: "Salads", tamil: "சாலட்", icon: "salad", accent: "#15803d", desc: "Ready-to-toss salad bowls and healthy mixes." },
  { name: "Ready To Cook", tamil: "சமைக்க தயார்", icon: "ready", accent: "#15803d", desc: "Recipe kits with pre-cut veggies and spice packs." },
];

const SUB_CATEGORIES: Record<string, string[]> = {
  "Fresh Vegetables": ["Daily Essentials", "Gourds & Beans", "Roots & Tubers"],
  "Fresh Fruits": ["Seasonal Fruits", "Imported Fruits", "Citrus"],
  "Cut Vegetables": ["Chopped Veggies", "Peeled & Ready"],
  "Leafy Vegetables": ["Keerai Varieties", "Herbs"],
  Organic: ["Organic Vegetables", "Organic Fruits"],
  "Exotic Vegetables": ["European Veggies", "Asian Greens"],
  Salads: ["Salad Bowls", "Sprouts"],
  "Ready To Cook": ["South Indian Kits", "Snack Kits"],
};

const v = (name: string, weight: number, unit: string, mrp: number, price: number, stock: number): VariantSeed => ({
  name,
  weight,
  unit,
  mrp,
  price,
  stock,
});

const PRODUCTS: ProductSeed[] = [
  {
    name: "Country Tomato", tamil: "நாட்டு தக்காளி", emoji: "tomato", category: "Fresh Vegetables", sub: "Daily Essentials",
    short: "Juicy, tangy Ooty-belt tomatoes ideal for sambar and gravies.",
    description: "Hand-graded country tomatoes sourced from Ooty and Hosur farms every dawn. Firm skin, deep red pulp and balanced acidity make them perfect for rasam, sambar, thokku and salads.",
    origin: "Hosur, Tamil Nadu", shelfLife: "4-5 days refrigerated",
    flags: { bestSeller: true, featured: true, freshToday: true }, rating: 4.6, ratingCount: 812, sold: 5240,
    variants: [v("500 g", 0.5, "g", 40, 29, 180), v("1 kg", 1, "kg", 78, 55, 140), v("2 kg", 2, "kg", 150, 104, 60)],
  },
  {
    name: "Bangalore Onion", tamil: "வெங்காயம்", emoji: "onion", category: "Fresh Vegetables", sub: "Daily Essentials",
    short: "Big sized onions with crisp layers and long shelf life.",
    description: "Premium grade Bangalore rose onions, sun-cured for longer shelf life. Uniform bulbs with tight skin — the everyday base for every South Indian kitchen.",
    origin: "Chikkaballapur, Karnataka", shelfLife: "12-15 days in a dry place",
    flags: { bestSeller: true }, rating: 4.4, ratingCount: 645, sold: 4810,
    variants: [v("1 kg", 1, "kg", 52, 38, 260), v("2 kg", 2, "kg", 100, 72, 120), v("5 kg", 5, "kg", 240, 175, 40)],
  },
  {
    name: "Potato", tamil: "உருளைக்கிழங்கு", emoji: "potato", category: "Fresh Vegetables", sub: "Roots & Tubers",
    short: "Smooth-skinned potatoes, great for fry, curry and mash.",
    description: "Fresh Ooty potatoes with thin skin and creamy flesh. Cleaned and graded for even cooking — ideal for poriyal, roast, and biryani.",
    origin: "Ooty, Tamil Nadu", shelfLife: "10-12 days",
    flags: { bestSeller: true, freshToday: true }, rating: 4.5, ratingCount: 590, sold: 4320,
    variants: [v("1 kg", 1, "kg", 48, 34, 240), v("2 kg", 2, "kg", 94, 65, 100)],
  },
  {
    name: "Carrot Ooty", tamil: "கேரட்", emoji: "carrot", category: "Fresh Vegetables", sub: "Roots & Tubers",
    short: "Crunchy, sweet hill carrots rich in beta carotene.",
    description: "Ooty hill-grown carrots with intense orange colour and natural sweetness. Excellent for juices, halwa, salads and kootu.",
    origin: "Ooty, Tamil Nadu", shelfLife: "6-7 days refrigerated",
    flags: { featured: true, freshToday: true }, rating: 4.7, ratingCount: 431, sold: 3120,
    variants: [v("500 g", 0.5, "g", 45, 32, 160), v("1 kg", 1, "kg", 88, 62, 90)],
  },
  {
    name: "Brinjal Green", tamil: "கத்தரிக்காய்", emoji: "brinjal", category: "Fresh Vegetables", sub: "Daily Essentials",
    short: "Tender green brinjals with fewer seeds.",
    description: "Locally grown tender brinjals, harvested young for a soft texture. Perfect for ennai kathirikai, sambar and gothsu.",
    origin: "Thiruvallur, Tamil Nadu", shelfLife: "3-4 days refrigerated",
    rating: 4.3, ratingCount: 216, sold: 1780,
    variants: [v("500 g", 0.5, "g", 42, 31, 120), v("1 kg", 1, "kg", 82, 58, 70)],
  },
  {
    name: "Ladies Finger", tamil: "வெண்டைக்காய்", emoji: "capsicum", category: "Fresh Vegetables", sub: "Gourds & Beans",
    short: "Snap-fresh okra, tender and stringless.",
    description: "Young okra pods picked at the perfect size. Snaps cleanly when bent — the freshness test every Chennai kitchen trusts.",
    origin: "Kanchipuram, Tamil Nadu", shelfLife: "3 days refrigerated",
    flags: { freshToday: true }, rating: 4.5, ratingCount: 302, sold: 2410,
    variants: [v("250 g", 0.25, "g", 26, 19, 140), v("500 g", 0.5, "g", 50, 36, 110)],
  },
  {
    name: "Green Chilli", tamil: "பச்சை மிளகாய்", emoji: "chilli", category: "Fresh Vegetables", sub: "Daily Essentials",
    short: "Spicy Gundu variety chillies for authentic heat.",
    description: "Fresh green chillies with a clean bite of heat. Sorted, destemmed and packed to keep them crisp for days.",
    origin: "Dharmapuri, Tamil Nadu", shelfLife: "6-7 days refrigerated",
    rating: 4.4, ratingCount: 188, sold: 1520,
    variants: [v("100 g", 0.1, "g", 16, 11, 200), v("250 g", 0.25, "g", 38, 26, 130)],
  },
  {
    name: "Beetroot", tamil: "பீட்ரூட்", emoji: "beetroot", category: "Fresh Vegetables", sub: "Roots & Tubers",
    short: "Deep red beets, naturally sweet and iron rich.",
    description: "Tender beetroots with smooth skin and deep magenta flesh. Great for poriyal, juice, cutlets and salads.",
    origin: "Ooty, Tamil Nadu", shelfLife: "8-10 days refrigerated",
    rating: 4.4, ratingCount: 174, sold: 1290,
    variants: [v("500 g", 0.5, "g", 40, 28, 130), v("1 kg", 1, "kg", 78, 54, 80)],
  },
  {
    name: "Cauliflower", tamil: "காலிஃபிளவர்", emoji: "broccoli", category: "Fresh Vegetables", sub: "Daily Essentials",
    short: "Compact snow-white florets, insect free.",
    description: "Tight, creamy-white cauliflower heads trimmed and packed with the protective leaves intact for maximum freshness.",
    origin: "Krishnagiri, Tamil Nadu", shelfLife: "4-5 days refrigerated",
    rating: 4.2, ratingCount: 143, sold: 980,
    variants: [v("1 piece", 1, "pc", 55, 39, 90)],
  },
  {
    name: "Snake Gourd", tamil: "புடலங்காய்", emoji: "cucumber", category: "Fresh Vegetables", sub: "Gourds & Beans",
    short: "Tender pudalangai for kootu and poriyal.",
    description: "Young snake gourds with soft seeds and thin skin. A Tamil kitchen staple for kootu, poriyal and paruppu usili.",
    origin: "Villupuram, Tamil Nadu", shelfLife: "4 days refrigerated",
    rating: 4.3, ratingCount: 96, sold: 720,
    variants: [v("500 g", 0.5, "g", 36, 26, 100)],
  },
  {
    name: "Yelakki Banana", tamil: "ஏலக்கி வாழைப்பழம்", emoji: "banana", category: "Fresh Fruits", sub: "Seasonal Fruits",
    short: "Small, aromatic and intensely sweet bananas.",
    description: "Naturally ripened Yelakki bananas with a honey-like aroma. Rich in potassium and perfect as a daily energy snack.",
    origin: "Theni, Tamil Nadu", shelfLife: "3-4 days at room temperature",
    flags: { bestSeller: true, featured: true }, rating: 4.8, ratingCount: 976, sold: 6120,
    variants: [v("500 g", 0.5, "g", 55, 42, 150), v("1 kg", 1, "kg", 105, 79, 95)],
  },
  {
    name: "Alphonso Mango", tamil: "அல்போன்சோ மாம்பழம்", emoji: "mango", category: "Fresh Fruits", sub: "Seasonal Fruits",
    short: "The king of mangoes — carbide free, naturally ripened.",
    description: "Premium Ratnagiri Alphonso mangoes ripened in hay, never with chemicals. Buttery texture, saffron-hued pulp and unmatched aroma.",
    origin: "Ratnagiri, Maharashtra", shelfLife: "3-4 days",
    flags: { featured: true, freshToday: true }, rating: 4.9, ratingCount: 512, sold: 2860,
    variants: [v("6 pieces", 6, "pc", 899, 649, 45), v("12 pieces", 12, "pc", 1699, 1249, 20)],
  },
  {
    name: "Pomegranate Bhagwa", tamil: "மாதுளை", emoji: "apple", category: "Fresh Fruits", sub: "Seasonal Fruits",
    short: "Ruby-red arils, high in antioxidants.",
    description: "Grade-A Bhagwa pomegranates with deep red arils and thin rind. Sweet, juicy and packed with antioxidants.",
    origin: "Solapur, Maharashtra", shelfLife: "8-10 days refrigerated",
    flags: { bestSeller: true }, rating: 4.6, ratingCount: 388, sold: 2140,
    variants: [v("500 g", 0.5, "g", 130, 99, 110), v("1 kg", 1, "kg", 250, 189, 70)],
  },
  {
    name: "Sweet Lime Mosambi", tamil: "சாத்துக்குடி", emoji: "lemon", category: "Fresh Fruits", sub: "Citrus",
    short: "Juice-heavy mosambi with balanced sweetness.",
    description: "Thin-skinned mosambi selected for maximum juice yield. One kilo gives close to a litre of fresh juice.",
    origin: "Andhra Pradesh", shelfLife: "7 days",
    rating: 4.3, ratingCount: 221, sold: 1640,
    variants: [v("1 kg", 1, "kg", 95, 69, 120)],
  },
  {
    name: "Shimla Apple", tamil: "ஆப்பிள்", emoji: "apple", category: "Fresh Fruits", sub: "Seasonal Fruits",
    short: "Crisp Himachal apples with a sweet-tart bite.",
    description: "Hand-picked Royal Delicious apples from Himachal orchards. Crunchy, aromatic and waxed-free.",
    origin: "Shimla, Himachal Pradesh", shelfLife: "10-12 days refrigerated",
    flags: { bestSeller: true }, rating: 4.5, ratingCount: 465, sold: 3010,
    variants: [v("4 pieces", 4, "pc", 180, 139, 130), v("1 kg", 1, "kg", 260, 199, 80)],
  },
  {
    name: "Papaya Red Lady", tamil: "பப்பாளி", emoji: "papaya", category: "Fresh Fruits", sub: "Seasonal Fruits",
    short: "Sweet red-fleshed papaya, great for digestion.",
    description: "Semi-ripe Red Lady papaya that ripens beautifully at home. Rich in papain, vitamin A and fibre.",
    origin: "Theni, Tamil Nadu", shelfLife: "4-5 days",
    rating: 4.2, ratingCount: 156, sold: 1120,
    variants: [v("1 piece (~1 kg)", 1, "pc", 85, 59, 90)],
  },
  {
    name: "Cut Mixed Vegetables", tamil: "கலவை காய்கறி", emoji: "salad", category: "Cut Vegetables", sub: "Chopped Veggies",
    short: "Sambar-ready mix, washed and chopped this morning.",
    description: "A balanced mix of drumstick, carrot, beans, pumpkin, brinjal and radish — washed in ozonated water and cut to sambar size. Saves 20 minutes of prep.",
    origin: "VeggieFlick Chennai Hub", shelfLife: "Use within 24 hours",
    flags: { cut: true, featured: true, freshToday: true }, tax: 5, rating: 4.7, ratingCount: 342, sold: 2480,
    variants: [v("400 g", 0.4, "g", 89, 69, 80), v("800 g", 0.8, "g", 170, 129, 45)],
  },
  {
    name: "Chopped Onion", tamil: "நறுக்கிய வெங்காயம்", emoji: "onion", category: "Cut Vegetables", sub: "Peeled & Ready",
    short: "No more tears — finely chopped and vacuum packed.",
    description: "Freshly peeled and diced onions packed in food-grade trays. Perfect for masala bases and biryani.",
    origin: "VeggieFlick Chennai Hub", shelfLife: "Use within 24 hours",
    flags: { cut: true }, tax: 5, rating: 4.6, ratingCount: 289, sold: 2210,
    variants: [v("250 g", 0.25, "g", 55, 42, 100), v("500 g", 0.5, "g", 99, 78, 60)],
  },
  {
    name: "Grated Coconut", tamil: "தேங்காய் துருவல்", emoji: "coconut", category: "Cut Vegetables", sub: "Peeled & Ready",
    short: "Freshly grated coconut for chutney and poriyal.",
    description: "Mature coconuts grated on the same morning of delivery. Zero preservatives, refrigerate immediately on arrival.",
    origin: "Pollachi, Tamil Nadu", shelfLife: "Use within 24 hours",
    flags: { cut: true, bestSeller: true }, tax: 5, rating: 4.8, ratingCount: 401, sold: 3320,
    variants: [v("200 g", 0.2, "g", 55, 45, 120)],
  },
  {
    name: "Cut Pumpkin", tamil: "நறுக்கிய பரங்கிக்காய்", emoji: "pumpkin", category: "Cut Vegetables", sub: "Chopped Veggies",
    short: "Deseeded and cubed yellow pumpkin.",
    description: "Sweet yellow pumpkin, peeled, deseeded and cubed for kootu, sambar and halwa.",
    origin: "Tiruvannamalai, Tamil Nadu", shelfLife: "Use within 24 hours",
    flags: { cut: true }, tax: 5, rating: 4.4, ratingCount: 118, sold: 860,
    variants: [v("500 g", 0.5, "g", 48, 36, 70)],
  },
  {
    name: "Palak Spinach", tamil: "பசலைக் கீரை", emoji: "leafy", category: "Leafy Vegetables", sub: "Keerai Varieties",
    short: "Iron-rich tender spinach bunches.",
    description: "Broad-leaf spinach harvested at dawn, roots trimmed and sorted leaf by leaf. Great for dal palak, keerai masiyal and smoothies.",
    origin: "Thiruvallur, Tamil Nadu", shelfLife: "2 days refrigerated",
    flags: { freshToday: true, bestSeller: true }, rating: 4.5, ratingCount: 268, sold: 2050,
    variants: [v("1 bunch", 1, "bunch", 25, 18, 150), v("2 bunches", 2, "bunch", 48, 33, 90)],
  },
  {
    name: "Coriander Leaves", tamil: "கொத்தமல்லி", emoji: "coriander", category: "Leafy Vegetables", sub: "Herbs",
    short: "Aromatic kothamalli, cleaned and root trimmed.",
    description: "Fragrant coriander bunches with tender stems. The finishing touch for every curry, chaat and chutney.",
    origin: "Kanchipuram, Tamil Nadu", shelfLife: "3 days refrigerated",
    flags: { freshToday: true }, rating: 4.6, ratingCount: 355, sold: 3890,
    variants: [v("1 bunch", 1, "bunch", 16, 12, 220)],
  },
  {
    name: "Curry Leaves", tamil: "கறிவேப்பிலை", emoji: "curry", category: "Leafy Vegetables", sub: "Herbs",
    short: "Dark green karuveppilai with strong aroma.",
    description: "Pesticide-free curry leaves picked from mature trees. Essential for tempering across South Indian cuisine.",
    origin: "Salem, Tamil Nadu", shelfLife: "5 days refrigerated",
    rating: 4.7, ratingCount: 412, sold: 4120,
    variants: [v("100 g", 0.1, "g", 20, 14, 180)],
  },
  {
    name: "Mulai Keerai", tamil: "முளைக் கீரை", emoji: "leafy", category: "Leafy Vegetables", sub: "Keerai Varieties",
    short: "Traditional amaranth greens, calcium rich.",
    description: "Native amaranth greens grown without chemical inputs. Cooks down beautifully into masiyal and kadaiyal.",
    origin: "Tiruvallur, Tamil Nadu", shelfLife: "2 days refrigerated",
    rating: 4.4, ratingCount: 142, sold: 940,
    variants: [v("1 bunch", 1, "bunch", 28, 20, 110)],
  },
  {
    name: "Organic Tomato", tamil: "இயற்கை தக்காளி", emoji: "tomato", category: "Organic", sub: "Organic Vegetables",
    short: "Certified organic, grown with cow-based inputs.",
    description: "Jaivik Bharat certified organic tomatoes grown with panchagavya and vermicompost. No synthetic pesticide, ever.",
    origin: "Certified organic farm, Krishnagiri", shelfLife: "4 days refrigerated",
    flags: { organic: true, featured: true }, rating: 4.7, ratingCount: 198, sold: 1180,
    variants: [v("500 g", 0.5, "g", 75, 59, 70), v("1 kg", 1, "kg", 145, 112, 40)],
  },
  {
    name: "Organic Carrot", tamil: "இயற்கை கேரட்", emoji: "carrot", category: "Organic", sub: "Organic Vegetables",
    short: "Pesticide-free carrots with earthy sweetness.",
    description: "Grown on certified organic hill farms with natural composting. Retains a deeper sweetness than conventional carrots.",
    origin: "Certified organic farm, Ooty", shelfLife: "6 days refrigerated",
    flags: { organic: true }, rating: 4.6, ratingCount: 164, sold: 990,
    variants: [v("500 g", 0.5, "g", 89, 69, 60)],
  },
  {
    name: "Organic Bottle Gourd", tamil: "இயற்கை சுரைக்காய்", emoji: "cucumber", category: "Organic", sub: "Organic Vegetables",
    short: "Light, hydrating gourd for everyday cooking.",
    description: "Tender organic bottle gourd, ideal for kootu, halwa and juice. Harvested young for a soft, seedless core.",
    origin: "Certified organic farm, Vellore", shelfLife: "5 days refrigerated",
    flags: { organic: true }, rating: 4.3, ratingCount: 88, sold: 540,
    variants: [v("1 piece (~700 g)", 0.7, "pc", 69, 52, 55)],
  },
  {
    name: "Broccoli", tamil: "ப்ரோக்கோலி", emoji: "broccoli", category: "Exotic Vegetables", sub: "European Veggies",
    short: "Dense green crowns, rich in sulforaphane.",
    description: "Tight, dark-green broccoli crowns from Nilgiri farms. Perfect for stir fry, soup and roasted sides.",
    origin: "Nilgiris, Tamil Nadu", shelfLife: "5 days refrigerated",
    flags: { featured: true }, rating: 4.5, ratingCount: 212, sold: 1420,
    variants: [v("250 g", 0.25, "g", 89, 65, 70), v("500 g", 0.5, "g", 170, 124, 40)],
  },
  {
    name: "Zucchini Green", tamil: "சுக்கினி", emoji: "cucumber", category: "Exotic Vegetables", sub: "European Veggies",
    short: "Glossy green zucchini for grills and pasta.",
    description: "Straight, firm zucchini with edible skin. Excellent grilled, spiralised or tossed into pasta.",
    origin: "Nilgiris, Tamil Nadu", shelfLife: "6 days refrigerated",
    rating: 4.4, ratingCount: 121, sold: 760,
    variants: [v("500 g", 0.5, "g", 110, 82, 55)],
  },
  {
    name: "Coloured Capsicum Trio", tamil: "வண்ண குடைமிளகாய்", emoji: "capsicum", category: "Exotic Vegetables", sub: "European Veggies",
    short: "Red, yellow and green bell peppers in one pack.",
    description: "Greenhouse-grown bell peppers with thick, crunchy walls. A colour-rich addition to salads, pizza and stir fry.",
    origin: "Nilgiris, Tamil Nadu", shelfLife: "7 days refrigerated",
    flags: { bestSeller: true }, rating: 4.6, ratingCount: 254, sold: 1680,
    variants: [v("3 pieces", 3, "pc", 149, 109, 80)],
  },
  {
    name: "Cherry Tomato", tamil: "செர்ரி தக்காளி", emoji: "cherry", category: "Exotic Vegetables", sub: "European Veggies",
    short: "Bite-sized bursts of sweetness for salads.",
    description: "Vine-ripened cherry tomatoes with a candy-sweet profile. Great for salads, pasta and roasting.",
    origin: "Nilgiris, Tamil Nadu", shelfLife: "6 days refrigerated",
    rating: 4.7, ratingCount: 173, sold: 1240,
    variants: [v("200 g", 0.2, "g", 89, 69, 75)],
  },
  {
    name: "Garden Salad Bowl", tamil: "சாலட் கிண்ணம்", emoji: "salad", category: "Salads", sub: "Salad Bowls",
    short: "Lettuce, cherry tomato, cucumber and olives.",
    description: "A ready-to-eat salad bowl with iceberg lettuce, cherry tomatoes, cucumber, sweet corn and olives with a lemon-herb dressing sachet.",
    origin: "VeggieFlick Chennai Hub", shelfLife: "Consume same day",
    flags: { featured: true, freshToday: true }, tax: 5, rating: 4.6, ratingCount: 132, sold: 880,
    variants: [v("250 g", 0.25, "g", 179, 139, 50)],
  },
  {
    name: "Protein Sprouts Mix", tamil: "முளைகட்டிய பயறு", emoji: "sprout", category: "Salads", sub: "Sprouts",
    short: "Moong, chana and moth bean sprouts.",
    description: "Freshly sprouted moong, kala chana and moth beans — a high-protein, high-fibre start to the day.",
    origin: "VeggieFlick Chennai Hub", shelfLife: "2 days refrigerated",
    tax: 5, rating: 4.5, ratingCount: 118, sold: 720,
    variants: [v("200 g", 0.2, "g", 79, 59, 65)],
  },
  {
    name: "Sambar Recipe Kit", tamil: "சாம்பார் கிட்", emoji: "soup", category: "Ready To Cook", sub: "South Indian Kits",
    short: "Pre-cut veggies plus fresh-ground sambar podi.",
    description: "Everything for a four-serve sambar: cut drumstick, shallots, tomato, carrot and pumpkin with a 40 g pack of stone-ground sambar podi and tamarind paste.",
    origin: "VeggieFlick Chennai Hub", shelfLife: "Use within 24 hours",
    flags: { featured: true, bestSeller: true }, tax: 5, rating: 4.8, ratingCount: 296, sold: 1980,
    variants: [v("Serves 4", 1, "pack", 199, 149, 60)],
  },
  {
    name: "Biryani Veg Kit", tamil: "பிரியாணி கிட்", emoji: "rice", category: "Ready To Cook", sub: "South Indian Kits",
    short: "Cut veggies, mint, whole spices and fried onion.",
    description: "A complete vegetable biryani kit with cut carrot, beans, potato, cauliflower, mint-coriander, whole spice pouch and birista.",
    origin: "VeggieFlick Chennai Hub", shelfLife: "Use within 24 hours",
    tax: 5, rating: 4.7, ratingCount: 208, sold: 1420,
    variants: [v("Serves 4", 1, "pack", 289, 219, 45)],
  },
  {
    name: "Poriyal Kit Beans & Coconut", tamil: "பொரியல் கிட்", emoji: "soup", category: "Ready To Cook", sub: "South Indian Kits",
    short: "Chopped beans with grated coconut and tempering.",
    description: "Finely chopped French beans with grated coconut and a tempering pack of mustard, urad dal and curry leaves. Ten-minute poriyal, guaranteed.",
    origin: "VeggieFlick Chennai Hub", shelfLife: "Use within 24 hours",
    tax: 5, rating: 4.5, ratingCount: 141, sold: 910,
    variants: [v("Serves 3", 1, "pack", 129, 99, 55)],
  },
];

const BLOGS = [
  {
    title: "How VeggieFlick Keeps Vegetables Farm Fresh For 24 Hours",
    emoji: "delivery",
    short: "From a 4 AM harvest to your kitchen before lunch — inside our Chennai cold chain.",
    content:
      "Freshness is a logistics problem before it is a quality problem.\n\nOur day starts at 4 AM at the Koyambedu wholesale market and partner farms across Hosur, Ooty and Thiruvallur. Produce is graded twice — once at the farm gate and once at our Chennai hub — before it is washed in ozonated water and moved into a 4°C cold room.\n\nEvery crate carries a harvest timestamp. If a crate crosses 24 hours in our hub it never reaches a customer; it goes to our surplus donation partners instead. That single rule is why our leafy greens still snap when they reach you.\n\nDelivery riders carry insulated bags with gel packs, so the last mile in Chennai heat does not undo a morning of careful handling.",
  },
  {
    title: "Seasonal Eating In Tamil Nadu: A Month By Month Guide",
    emoji: "calendar",
    short: "What to buy, when to buy it, and why seasonal produce always tastes better.",
    content:
      "Eating seasonally is the cheapest upgrade you can make to your cooking.\n\nJanuary to March belongs to carrots, beetroot and citrus. April and May are mango months — Alphonso, Banganapalli and Imam Pasand arrive in that order. The monsoon brings gourds, greens and corn, while October to December is peak tomato, cauliflower and guava season.\n\nSeasonal produce travels less, costs less and carries more nutrition because it is harvested at maturity rather than picked early for storage. Watch our Fresh Today collection — it always mirrors what is genuinely in season around Chennai.",
  },
  {
    title: "Storing Greens So They Last Three Days Longer",
    emoji: "leafy",
    short: "The wet-cloth method, the box trick, and mistakes that wilt your keerai overnight.",
    content:
      "Greens die of two things: moisture loss and moisture excess.\n\nStep one, never wash keerai until you cook it. Step two, remove the rubber band — compressed stems bruise and rot. Step three, wrap the bunch loosely in a lightly damp cotton cloth and store it in an airtight box in the middle shelf of your fridge, not the crisper.\n\nDone right, spinach and mulai keerai stay usable for three to four days instead of one. Herbs like coriander and mint do even better standing upright in a glass with an inch of water and a loose cover.",
  },
  {
    title: "Why Cut Vegetables Are The Weeknight Hack Chennai Needed",
    emoji: "cut",
    short: "Twenty minutes saved per meal, less waste, and the same nutrition when handled right.",
    content:
      "The average South Indian home spends 22 minutes a day just peeling and chopping.\n\nOur cut vegetable range removes that step without compromising safety. Produce is washed in ozonated water, cut on sanitised stainless steel, chilled instantly and packed in food-grade trays with a same-day use-by date.\n\nNutrient loss in cut vegetables is real but small when the cold chain is unbroken — typically under 5% of vitamin C in the first 24 hours. Buy it, cook it the same day, and you get back nearly three hours a week.",
  },
];

const RECIPES = [
  {
    title: "Classic Arachuvitta Sambar",
    emoji: "soup",
    summary: "Freshly ground sambar podi transforms an everyday sambar into a Sunday special.",
    ingredients: ["1 Sambar Recipe Kit", "1 lemon-sized tamarind ball", "1 cup toor dal", "2 tbsp coconut oil", "Curry leaves and mustard for tempering", "Salt to taste"],
    instructions: ["Pressure cook toor dal for 4 whistles until soft and mash well.", "Soak tamarind in hot water and extract thick pulp.", "Boil the cut vegetables from the kit with turmeric until fork tender.", "Add tamarind extract and the sambar podi pack, simmer for 8 minutes.", "Stir in mashed dal, adjust salt and simmer 5 more minutes.", "Temper mustard, curry leaves and hing in coconut oil and pour over."],
    prep: 15, cook: 30, servings: 4, difficulty: "Easy",
  },
  {
    title: "Keerai Masiyal With Garlic Tempering",
    emoji: "leafy",
    summary: "A five-ingredient comfort dish that pairs with rice, roti or idli.",
    ingredients: ["2 bunches Mulai Keerai", "6 garlic cloves, crushed", "2 dried red chillies", "1 tsp cumin", "2 tbsp sesame oil", "Salt to taste"],
    instructions: ["Wash the greens thoroughly and chop roughly.", "Cook with a splash of water until fully wilted, about 6 minutes.", "Mash coarsely with a wooden masher.", "Heat sesame oil, splutter cumin, add garlic and red chillies.", "Pour the tempering over the mashed greens and mix.", "Serve hot with steamed rice and a spoon of ghee."],
    prep: 10, cook: 15, servings: 3, difficulty: "Easy",
  },
  {
    title: "Roasted Broccoli And Bell Pepper Toss",
    emoji: "broccoli",
    summary: "A ten-minute high-protein side that keeps its crunch.",
    ingredients: ["250 g Broccoli florets", "1 Coloured Capsicum Trio, sliced", "2 tbsp olive oil", "1 tsp crushed pepper", "1 tsp chilli flakes", "Juice of half a lemon"],
    instructions: ["Blanch broccoli in salted water for 2 minutes, then shock in ice water.", "Heat olive oil in a wide pan on high heat.", "Add peppers first, toss for 2 minutes to keep them crisp.", "Add broccoli, pepper and chilli flakes, toss for 3 minutes.", "Finish with lemon juice and flaky salt off the heat."],
    prep: 10, cook: 10, servings: 2, difficulty: "Easy",
  },
  {
    title: "Chennai Sunday Vegetable Biryani",
    emoji: "rice",
    summary: "Seeraga samba rice, mint and a kit that removes all the prep work.",
    ingredients: ["1 Biryani Veg Kit", "2 cups seeraga samba rice", "1 cup thick curd", "3 tbsp ghee", "2 onions, sliced", "3 green chillies, slit"],
    instructions: ["Soak the rice for 30 minutes and drain.", "Fry sliced onions in ghee until golden and set aside.", "Sauté the whole spice pouch, then the kit vegetables for 5 minutes.", "Add curd, mint-coriander and green chillies, cook for 4 minutes.", "Add rice and 3 cups water, cook on low for 12 minutes covered.", "Rest 10 minutes, fluff gently and top with birista."],
    prep: 30, cook: 35, servings: 4, difficulty: "Medium",
  },
];

async function main() {
  console.info("Seeding VeggieFlick database…");

  await db.execute(sql`truncate table
    order_timeline, order_items, payments, delivery_assignments, orders,
    cart_items, carts, wishlists, reviews, notifications, wallet_transactions, wallets,
    referrals, gift_cards, audit_logs, newsletter_subscribers, otp_codes,
    inventory, product_images, product_variants, products, sub_categories, brands, categories,
    coupons, delivery_slots, delivery_partners, addresses, profiles, blogs, recipes
    restart identity cascade`);

  const categoryRows = await db
    .insert(schema.categories)
    .values(
      CATEGORIES.map((c, index) => ({
        name: c.name,
        slug: slugify(c.name),
        tamilName: c.tamil,
        icon: c.icon,
        accent: c.accent,
        description: c.desc,
        sortOrder: index + 1,
      })),
    )
    .returning();
  const categoryByName = new Map(categoryRows.map((c) => [c.name, c]));

  const subRows = await db
    .insert(schema.subCategories)
    .values(
      Object.entries(SUB_CATEGORIES).flatMap(([categoryName, subs]) =>
        subs.map((name, index) => ({
          categoryId: categoryByName.get(categoryName)!.id,
          name,
          slug: slugify(`${categoryName} ${name}`),
          sortOrder: index + 1,
        })),
      ),
    )
    .returning();
  const subByName = new Map(subRows.map((s) => [s.name, s]));

  const brandRows = await db
    .insert(schema.brands)
    .values([
      { name: "VeggieFlick Farms", slug: "veggieflick-farms", description: "Our own contract farms across Tamil Nadu." },
      { name: "Nilgiri Naturals", slug: "nilgiri-naturals", description: "Hill-grown exotic produce partners." },
      { name: "Jaivik Organics", slug: "jaivik-organics", description: "Certified organic growers collective." },
    ])
    .returning();

  for (const [index, p] of PRODUCTS.entries()) {
    const category = categoryByName.get(p.category)!;
    const brand =
      p.flags?.organic ? brandRows[2] : p.category === "Exotic Vegetables" ? brandRows[1] : brandRows[0];

    const [product] = await db
      .insert(schema.products)
      .values({
        categoryId: category.id,
        subCategoryId: p.sub ? (subByName.get(p.sub)?.id ?? null) : null,
        brandId: brand.id,
        name: p.name,
        tamilName: p.tamil,
        slug: slugify(p.name),
        sku: `VF-${String(index + 1).padStart(4, "0")}`,
        barcode: `890${String(1000000 + index)}`,
        emoji: p.emoji,
        shortDescription: p.short,
        description: p.description,
        nutrition: [
          { label: "Energy", value: `${25 + (index % 9) * 7} kcal / 100 g` },
          { label: "Protein", value: `${(0.8 + (index % 5) * 0.4).toFixed(1)} g` },
          { label: "Carbohydrates", value: `${(4 + (index % 7)).toFixed(1)} g` },
          { label: "Dietary Fibre", value: `${(1.2 + (index % 4) * 0.5).toFixed(1)} g` },
        ],
        origin: p.origin,
        shelfLife: p.shelfLife,
        isFeatured: p.flags?.featured ?? false,
        isBestSeller: p.flags?.bestSeller ?? false,
        isOrganic: p.flags?.organic ?? false,
        isCutVegetable: p.flags?.cut ?? false,
        isFreshToday: p.flags?.freshToday ?? false,
        ratingAverage: p.rating.toFixed(2),
        ratingCount: p.ratingCount,
        soldCount: p.sold,
        seoTitle: `Buy ${p.name} Online in Chennai | VeggieFlick`,
        seoDescription: `${p.short} Same-day delivery across Chennai within 25 km. ${p.origin}.`,
      })
      .returning();

    await db.insert(schema.productImages).values({
      productId: product.id,
      imageUrl: `/api/v1/products/${product.slug}/image`,
      thumbnailUrl: null,
      displayOrder: 0,
      isPrimary: true,
    });

    for (const [vi, variant] of p.variants.entries()) {
      const discount = Math.round(((variant.mrp - variant.price) / variant.mrp) * 100);
      const [variantRow] = await db
        .insert(schema.productVariants)
        .values({
          productId: product.id,
          variantName: variant.name,
          weight: String(variant.weight),
          unit: variant.unit,
          mrp: variant.mrp.toFixed(2),
          sellingPrice: variant.price.toFixed(2),
          costPrice: (variant.price * 0.72).toFixed(2),
          discountPercentage: discount.toFixed(2),
          taxPercentage: (p.tax ?? 0).toFixed(2),
          isDefault: vi === 0,
        })
        .returning();

      await db.insert(schema.inventory).values({
        variantId: variantRow.id,
        warehouseName: "Chennai Central Hub",
        availableStock: variant.stock,
        reservedStock: 0,
        minimumStock: 10,
        maximumStock: 800,
        reorderLevel: 25,
      });
    }
  }

  const [admin, manager, warehouse, customer] = await db
    .insert(schema.profiles)
    .values([
      {
        fullName: "Aravind Kumar",
        email: "admin@veggieflick.in",
        phone: "9840000001",
        role: "super_admin",
        passwordHash: hashPassword("Admin@12345"),
        referralCode: "VFADMIN",
      },
      {
        fullName: "Divya Raman",
        email: "manager@veggieflick.in",
        phone: "9840000002",
        role: "manager",
        passwordHash: hashPassword("Manager@12345"),
      },
      {
        fullName: "Suresh Babu",
        email: "warehouse@veggieflick.in",
        phone: "9840000003",
        role: "warehouse_staff",
        passwordHash: hashPassword("Warehouse@12345"),
      },
      {
        fullName: "Priya Narayanan",
        email: "priya@example.com",
        phone: "9876543210",
        role: "customer",
        loyaltyTier: "Gold",
        loyaltyPoints: 420,
        referralCode: "PRIYA200",
      },
    ])
    .returning();

  await db.insert(schema.addresses).values({
    profileId: customer.id,
    addressType: "home",
    contactName: customer.fullName,
    contactPhone: customer.phone,
    doorNo: "3B, Sunrise Apartments",
    street: "2nd Main Road",
    area: "Anna Nagar West",
    city: "Chennai",
    state: "Tamil Nadu",
    postalCode: "600040",
    latitude: 13.0878,
    longitude: 80.2101,
    isDefault: true,
  });

  const [wallet] = await db
    .insert(schema.wallets)
    .values({ profileId: customer.id, balance: "250.00" })
    .returning();
  await db.insert(schema.walletTransactions).values({
    walletId: wallet.id,
    amount: "250.00",
    type: "credit",
    narration: "Welcome cashback",
  });

  await db.insert(schema.deliverySlots).values([
    { slotName: "06:00 AM - 08:00 AM", startTime: "06:00:00", endTime: "08:00:00", sortOrder: 1, maximumOrders: 300 },
    { slotName: "08:00 AM - 10:00 AM", startTime: "08:00:00", endTime: "10:00:00", sortOrder: 2, maximumOrders: 350 },
    { slotName: "10:00 AM - 12:00 PM", startTime: "10:00:00", endTime: "12:00:00", sortOrder: 3, maximumOrders: 300 },
    { slotName: "12:00 PM - 02:00 PM", startTime: "12:00:00", endTime: "14:00:00", sortOrder: 4, maximumOrders: 250 },
    { slotName: "04:00 PM - 06:00 PM", startTime: "16:00:00", endTime: "18:00:00", sortOrder: 5, maximumOrders: 300 },
    { slotName: "06:00 PM - 08:00 PM", startTime: "18:00:00", endTime: "20:00:00", sortOrder: 6, maximumOrders: 350 },
  ]);

  const inDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await db.insert(schema.coupons).values([
    {
      couponCode: "FRESH50",
      title: "₹50 off on orders above ₹499",
      description: "Flat ₹50 off for every Chennai customer on orders above ₹499.",
      discountType: "fixed_amount",
      discountValue: "50.00",
      minimumOrderAmount: "499.00",
      usageLimit: 5000,
      expiryDate: inDays(60),
    },
    {
      couponCode: "VEGGIE10",
      title: "10% off up to ₹120",
      description: "Save 10% on your entire basket, capped at ₹120.",
      discountType: "percentage",
      discountValue: "10.00",
      minimumOrderAmount: "299.00",
      maximumDiscount: "120.00",
      usageLimit: 8000,
      expiryDate: inDays(45),
    },
    {
      couponCode: "FREEDEL",
      title: "Free delivery on any order",
      description: "Zero delivery charge anywhere within our 25 km Chennai radius.",
      discountType: "free_delivery",
      discountValue: "0.00",
      minimumOrderAmount: "199.00",
      usageLimit: 10000,
      expiryDate: inDays(30),
    },
    {
      couponCode: "WELCOME100",
      title: "₹100 off for new customers",
      description: "First order discount for new VeggieFlick shoppers.",
      discountType: "fixed_amount",
      discountValue: "100.00",
      minimumOrderAmount: "699.00",
      usageLimit: 3000,
      expiryDate: inDays(90),
    },
  ]);

  await db.insert(schema.deliveryPartners).values([
    { fullName: "Mohan Raj", phone: "9500000011", vehicleType: "Two Wheeler", vehicleNumber: "TN 09 BX 4412", drivingLicense: "TN0920210001234", currentLatitude: 13.0721, currentLongitude: 80.2015 },
    { fullName: "Karthik S", phone: "9500000012", vehicleType: "Two Wheeler", vehicleNumber: "TN 07 AC 9087", drivingLicense: "TN0720190004567", currentLatitude: 13.0501, currentLongitude: 80.2321 },
    { fullName: "Vignesh P", phone: "9500000013", vehicleType: "EV Three Wheeler", vehicleNumber: "TN 11 EV 2210", drivingLicense: "TN1120200007890", currentLatitude: 13.1012, currentLongitude: 80.2044 },
  ]);

  await db.insert(schema.blogs).values(
    BLOGS.map((b) => ({
      title: b.title,
      slug: slugify(b.title),
      emoji: b.emoji,
      shortDescription: b.short,
      content: b.content,
      seoTitle: `${b.title} | VeggieFlick Blog`,
      seoDescription: b.short,
    })),
  );

  await db.insert(schema.recipes).values(
    RECIPES.map((r) => ({
      title: r.title,
      slug: slugify(r.title),
      emoji: r.emoji,
      summary: r.summary,
      ingredients: r.ingredients,
      instructions: r.instructions,
      preparationTime: r.prep,
      cookingTime: r.cook,
      servings: r.servings,
      difficulty: r.difficulty,
    })),
  );

  const seededProducts = await db.select({ id: schema.products.id }).from(schema.products).limit(6);
  const reviewSeeds = [
    { rating: 5, title: "Genuinely fresh", body: "Arrived within the slot and everything looked like it was picked the same morning." },
    { rating: 4, title: "Good quality", body: "Consistent quality across three orders now. Packaging could use less plastic." },
    { rating: 5, title: "Better than the market", body: "Cheaper than my local shop and I skip the 7 AM queue entirely." },
  ];
  for (const [i, product] of seededProducts.entries()) {
    await db.insert(schema.reviews).values({
      productId: product.id,
      profileId: customer.id,
      rating: reviewSeeds[i % 3].rating,
      reviewTitle: reviewSeeds[i % 3].title,
      review: reviewSeeds[i % 3].body,
      isVerifiedPurchase: true,
    });
  }

  await db.insert(schema.notifications).values([
    { profileId: customer.id, title: "Welcome to VeggieFlick coriander", message: "Use WELCOME100 for ₹100 off your first order above ₹699.", notificationType: "promotion" },
    { profileId: customer.id, title: "Fresh Today is live", message: "Today's harvest from Ooty and Hosur just landed at the Chennai hub.", notificationType: "offer" },
  ]);

  await db.insert(schema.auditLogs).values({
    actorId: admin.id,
    action: "database.seed",
    entity: "system",
    metadata: { products: PRODUCTS.length, categories: CATEGORIES.length },
  });

  console.info(
    `Seed complete → ${CATEGORIES.length} categories, ${PRODUCTS.length} products, ${manager.fullName} & ${warehouse.fullName} staff accounts ready.`,
  );
  await pool.end();
}

main().catch(async (error) => {
  console.error("Seed failed", error);
  await pool.end();
  process.exit(1);
});
