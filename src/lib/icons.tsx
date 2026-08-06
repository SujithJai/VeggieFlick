import {
  Apple,
  Banana,
  Beef,
  Bird,
  Bike,
  Bone,
  Cake,
  Carrot,
  Cherry,
  CloudLightning,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Egg,
  EggFried,
  Fish,
  Flower2,
  GlassWater,
  Grape,
  Heart,
  IceCream,
  Leaf,
  Milk,
  Pizza,
  Popcorn,
  Salad,
  Sandwich,
  ShoppingBag,
  Soup,
  Sparkles,
  Sprout,
  TreePine,
  User,
  Wheat,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";

/**
 * Centralized icon registry.
 *
 * Maps semantic category / product names → Lucide icon components.
 * The `emoji` column in the database is repurposed as a Lucide icon name.
 * Unknown names fall back to the Leaf icon.
 */
export const ICON_MAP: Record<string, ComponentType<LucideProps>> = {
  // ---- Categories ----
  vegetables: Carrot,
  "fresh-vegetables": Carrot,
  fruits: Apple,
  "fresh-fruits": Apple,
  leafy: Leaf,
  "leafy-vegetables": Leaf,
  cut: Salad,
  "cut-vegetables": Salad,
  organic: Sprout,
  exotic: Sparkles,
  "exotic-vegetables": Sparkles,
  salad: Salad,
  salads: Salad,
  "ready-to-cook": Soup,
  ready: Soup,
  frozen: CloudLightning,
  herbs: Flower2,

  // ---- Products ----
  tomato: Cherry,
  tomatoes: Cherry,
  onion: Sprout,
  onions: Sprout,
  potato: Apple,
  potatoes: Apple,
  carrot: Carrot,
  brinjal: Grape,
  okra: Sprout,
  chilli: Leaf,
  beetroot: Cherry,
  cauliflower: Flower2,
  gourd: Sprout,
  cucumber: Sprout,
  pumpkin: Sparkles,
  capsicum: Flower2,
  broccoli: TreePine,
  zucchini: Sprout,
  banana: Banana,
  mango: Apple,
  pomegranate: Cherry,
  mosambi: Apple,
  apple: Apple,
  papaya: Apple,
  spinach: Leaf,
  coriander: Flower2,
  curry: Leaf,
  keerai: Leaf,
  lettuce: Leaf,
  lemon: Apple,
  ginger: Cookie,
  garlic: Cookie,
  grape: Grape,
  grapes: Grape,
  watermelon: Apple,
  coconut: Cookie,
  berry: Cherry,
  berries: Cherry,
  strawberry: Cherry,
  egg: Egg,
  eggplant: Grape,
  rice: Wheat,
  meat: Beef,
  chicken: Bird,
  mutton: Beef,
  seafood: Fish,
  dairy: Milk,
  milk: Milk,
  cheese: Milk,
  bread: Sandwich,
  juice: CupSoda,
  tea: Coffee,
  coffee: Coffee,
  oil: CupSoda,
  honey: CupSoda,
  snack: Cookie,
  sweets: IceCream,
  icecream: IceCream,
  cake: Cake,
  chocolate: Cookie,
  nuts: Cookie,
  almonds: Cookie,
  cashews: Cookie,
  peanut: Cookie,
  spices: Sparkles,
  masala: Soup,
  flour: Wheat,
  sugar: CupSoda,
  salt: Sprout,
  vinegar: GlassWater,
  sauce: Soup,
  pickle: Salad,
  butter: Milk,
  yogurt: CupSoda,
  paneer: Milk,
  tofu: Sprout,
  pasta: Wheat,
  noodles: Wheat,
  cereal: Wheat,
  oats: Wheat,
  pulses: Wheat,
  dal: Wheat,
  beans: Sprout,
  lentils: Wheat,
  chickpeas: Wheat,
  mushroom: Flower2,
  flower: Flower2,
  herb: Flower2,
  croissant: Croissant,
  bird: Bird,
  fish: Fish,

  // ---- Decorative / status ----
  fresh: Sparkles,
  delivery: Bike,
  offer: Sparkles,
  location: Sparkles,
  shopping: ShoppingBag,
  "shopping-bag": ShoppingBag,
  search: Sparkles,
  calendar: Sparkles,
  account: User,
  wishlist: Heart,
};

export function lookupIcon(name: string | null | undefined): ComponentType<LucideProps> {
  if (!name) return Leaf;
  const key = name.trim().toLowerCase();
  return ICON_MAP[key] ?? Leaf;
}

/** Stable component that renders a Lucide icon by name. Declared once at module level. */
/* eslint-disable react-hooks/static-components */
/**
 * Stable wrapper that renders a Lucide icon by name.
 * The underlying Icon references come from the static ICON_MAP — they do
 * not change between renders.
 */
export function DynamicIcon({
  name,
  size = 18,
  strokeWidth = 1.6,
  className,
  "aria-hidden": ariaHidden,
}: {
  name: string | null | undefined;
  size?: number;
  strokeWidth?: number;
  className?: string;
  "aria-hidden"?: boolean;
}) {
  const Icon = lookupIcon(name);
  return <Icon size={size} strokeWidth={strokeWidth} className={className} aria-hidden={ariaHidden} />;
}
/* eslint-enable react-hooks/static-components */

export function iconProps(size = 18): LucideProps {
  return {
    size,
    strokeWidth: 1.6,
    "aria-hidden": true,
  } as LucideProps;
}
