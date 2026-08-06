import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10 digit Indian mobile number");

export const uuidSchema = z.string().uuid("Invalid identifier");

export const sendOtpSchema = z.object({
  phone: phoneSchema,
  fullName: z.string().trim().min(2).max(80).optional(),
});

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, "OTP must be 6 digits"),
  fullName: z.string().trim().min(2).max(80).optional(),
  rememberMe: z.boolean().optional().default(false),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  totp: z.string().trim().optional(),
});

export const productQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
  category: z.string().trim().optional(),
  subCategory: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  search: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  organic: z.enum(["true", "false"]).optional(),
  bestSeller: z.enum(["true", "false"]).optional(),
  featured: z.enum(["true", "false"]).optional(),
  freshToday: z.enum(["true", "false"]).optional(),
  cut: z.enum(["true", "false"]).optional(),
  inStock: z.enum(["true", "false"]).optional(),
  minDiscount: z.coerce.number().min(0).max(100).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z
    .enum(["popularity", "newest", "price_asc", "price_desc", "discount", "rating"])
    .default("popularity"),
});

export type ProductQuery = z.infer<typeof productQuerySchema>;

export const addToCartSchema = z.object({
  productId: uuidSchema,
  variantId: uuidSchema,
  quantity: z.coerce.number().int().min(1).max(20).default(1),
});

export const updateCartSchema = z.object({
  itemId: uuidSchema,
  quantity: z.coerce.number().int().min(0).max(20),
});

export const couponSchema = z.object({
  code: z.string().trim().min(3).max(40).toUpperCase(),
});

export const addressSchema = z.object({
  addressType: z.enum(["home", "work", "other"]).default("home"),
  contactName: z.string().trim().min(2).max(120),
  contactPhone: phoneSchema,
  doorNo: z.string().trim().min(1).max(60),
  street: z.string().trim().min(2).max(160),
  area: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80).default("Chennai"),
  state: z.string().trim().min(2).max(80).default("Tamil Nadu"),
  postalCode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6 digit pincode"),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional().default(false),
});

export const checkoutSchema = z.object({
  addressId: uuidSchema,
  deliverySlotId: uuidSchema,
  paymentMethod: z.enum(["cod", "upi", "card", "netbanking", "wallet"]),
  notes: z.string().trim().max(400).optional(),
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
});

export const reviewSchema = z.object({
  productId: uuidSchema,
  rating: z.coerce.number().int().min(1).max(5),
  reviewTitle: z.string().trim().min(3).max(160),
  review: z.string().trim().min(5).max(1200),
});

export const radiusSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const adminOrderUpdateSchema = z.object({
  orderStatus: z.enum([
    "placed",
    "confirmed",
    "packed",
    "out_for_delivery",
    "delivered",
    "cancelled",
    "returned",
  ]),
  note: z.string().trim().max(240).optional(),
});

export const inventoryUpdateSchema = z.object({
  variantId: uuidSchema,
  availableStock: z.coerce.number().int().min(0).max(100000),
  reorderLevel: z.coerce.number().int().min(0).max(10000).optional(),
});

export const productCreateSchema = z.object({
  name: z.string().trim().min(2).max(180),
  categoryId: uuidSchema,
  emoji: z.string().trim().min(1).max(32).default("vegetables"),
    shortDescription: z.string().trim().min(5).max(300),
  description: z.string().trim().min(10).max(4000),
  origin: z.string().trim().max(120).optional(),
  isOrganic: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  variantName: z.string().trim().min(1).max(80).default("500 g"),
  weight: z.coerce.number().min(0.01).max(100),
  unit: z.enum(["g", "kg", "pc", "bunch", "pack", "ml", "l"]).default("g"),
  mrp: z.coerce.number().min(1).max(100000),
  sellingPrice: z.coerce.number().min(1).max(100000),
  availableStock: z.coerce.number().int().min(0).max(100000).default(50),
});

export const couponCreateSchema = z.object({
  couponCode: z.string().trim().min(3).max(40).toUpperCase(),
  title: z.string().trim().min(3).max(160),
  discountType: z.enum(["percentage", "fixed_amount", "free_delivery"]),
  discountValue: z.coerce.number().min(0).max(100000),
  minimumOrderAmount: z.coerce.number().min(0).max(100000).default(0),
  maximumDiscount: z.coerce.number().min(0).max(100000).optional(),
  usageLimit: z.coerce.number().int().min(1).max(1000000).default(1000),
  expiryDays: z.coerce.number().int().min(1).max(365).default(30),
});

export const newsletterSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
});

export const notificationReadSchema = z.object({ id: uuidSchema });
