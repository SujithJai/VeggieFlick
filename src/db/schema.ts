import {
  pgEnum,
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  numeric,
  doublePrecision,
  index,
  uniqueIndex,
  jsonb,
  time,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const statusEnum = pgEnum("status_enum", ["active", "inactive", "draft", "deleted"]);
export const userRoleEnum = pgEnum("user_role_enum", [
  "customer",
  "delivery_partner",
  "warehouse_staff",
  "manager",
  "admin",
  "super_admin",
]);
export const paymentStatusEnum = pgEnum("payment_status_enum", [
  "pending",
  "paid",
  "failed",
  "refunded",
  "cancelled",
]);
export const orderStatusEnum = pgEnum("order_status_enum", [
  "placed",
  "confirmed",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
]);
export const deliveryStatusEnum = pgEnum("delivery_status_enum", [
  "assigned",
  "accepted",
  "picked_up",
  "on_the_way",
  "delivered",
  "failed",
]);
export const discountTypeEnum = pgEnum("discount_type_enum", [
  "percentage",
  "fixed_amount",
  "free_delivery",
]);
export const notificationTypeEnum = pgEnum("notification_type_enum", [
  "order",
  "offer",
  "delivery",
  "system",
  "promotion",
]);
export const addressTypeEnum = pgEnum("address_type_enum", ["home", "work", "other"]);
export const walletTxnTypeEnum = pgEnum("wallet_txn_type_enum", ["credit", "debit"]);

const money = (name: string) => numeric(name, { precision: 12, scale: 2 });

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    email: varchar("email", { length: 190 }),
    phone: varchar("phone", { length: 20 }).notNull(),
    avatar: text("avatar"),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").default("customer").notNull(),
    status: statusEnum("status").default("active").notNull(),
    loyaltyTier: varchar("loyalty_tier", { length: 20 }).default("Bronze").notNull(),
    loyaltyPoints: integer("loyalty_points").default(0).notNull(),
    referralCode: varchar("referral_code", { length: 16 }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("profiles_phone_idx").on(t.phone),
    index("profiles_email_idx").on(t.email),
    index("profiles_role_idx").on(t.role),
  ],
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    phone: varchar("phone", { length: 20 }).notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    consumed: boolean("consumed").default(false).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("otp_phone_idx").on(t.phone, t.createdAt)],
);

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    addressType: addressTypeEnum("address_type").default("home").notNull(),
    contactName: varchar("contact_name", { length: 120 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 20 }).notNull(),
    doorNo: varchar("door_no", { length: 60 }).notNull(),
    street: varchar("street", { length: 160 }).notNull(),
    area: varchar("area", { length: 120 }).notNull(),
    city: varchar("city", { length: 80 }).default("Chennai").notNull(),
    state: varchar("state", { length: 80 }).default("Tamil Nadu").notNull(),
    postalCode: varchar("postal_code", { length: 10 }).notNull(),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    isDefault: boolean("is_default").default(false).notNull(),
    ...timestamps,
  },
  (t) => [index("addresses_profile_idx").on(t.profileId)],
);

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    tamilName: varchar("tamil_name", { length: 120 }),
    icon: varchar("icon", { length: 32 }).default("leafy").notNull(),
    banner: text("banner"),
    accent: varchar("accent", { length: 40 }).default("#16A34A").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").default(0).notNull(),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("categories_slug_idx").on(t.slug), index("categories_sort_idx").on(t.sortOrder)],
);

export const subCategories = pgTable(
  "sub_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .references(() => categories.id, { onDelete: "cascade" })
      .notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    image: text("image"),
    sortOrder: integer("sort_order").default(0).notNull(),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("sub_categories_slug_idx").on(t.slug),
    index("sub_categories_category_idx").on(t.categoryId),
  ],
);

export const brands = pgTable(
  "brands",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 140 }).notNull(),
    logo: text("logo"),
    description: text("description"),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("brands_slug_idx").on(t.slug)],
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .references(() => categories.id, { onDelete: "restrict" })
      .notNull(),
    subCategoryId: uuid("sub_category_id").references(() => subCategories.id, { onDelete: "set null" }),
    brandId: uuid("brand_id").references(() => brands.id, { onDelete: "set null" }),
    name: varchar("name", { length: 180 }).notNull(),
    tamilName: varchar("tamil_name", { length: 180 }),
    slug: varchar("slug", { length: 200 }).notNull(),
    sku: varchar("sku", { length: 60 }).notNull(),
    barcode: varchar("barcode", { length: 60 }),
    emoji: varchar("emoji", { length: 32 }).default("vegetables").notNull(),
    shortDescription: text("short_description"),
    description: text("description"),
    nutrition: jsonb("nutrition").$type<{ label: string; value: string }[]>(),
    origin: varchar("origin", { length: 120 }),
    shelfLife: varchar("shelf_life", { length: 80 }),
    isFeatured: boolean("is_featured").default(false).notNull(),
    isBestSeller: boolean("is_best_seller").default(false).notNull(),
    isOrganic: boolean("is_organic").default(false).notNull(),
    isCutVegetable: boolean("is_cut_vegetable").default(false).notNull(),
    isFreshToday: boolean("is_fresh_today").default(false).notNull(),
    ratingAverage: numeric("rating_average", { precision: 3, scale: 2 }).default("4.50").notNull(),
    ratingCount: integer("rating_count").default(0).notNull(),
    soldCount: integer("sold_count").default(0).notNull(),
    status: statusEnum("status").default("active").notNull(),
    seoTitle: varchar("seo_title", { length: 200 }),
    seoDescription: text("seo_description"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("products_slug_idx").on(t.slug),
    uniqueIndex("products_sku_idx").on(t.sku),
    index("products_category_idx").on(t.categoryId),
    index("products_status_idx").on(t.status),
    index("products_flags_idx").on(t.isFeatured, t.isBestSeller, t.isOrganic),
  ],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    variantName: varchar("variant_name", { length: 80 }).notNull(),
    weight: numeric("weight", { precision: 10, scale: 3 }).notNull(),
    unit: varchar("unit", { length: 16 }).notNull(),
    mrp: money("mrp").notNull(),
    sellingPrice: money("selling_price").notNull(),
    costPrice: money("cost_price").notNull(),
    discountPercentage: numeric("discount_percentage", { precision: 5, scale: 2 }).default("0").notNull(),
    taxPercentage: numeric("tax_percentage", { precision: 5, scale: 2 }).default("0").notNull(),
    isDefault: boolean("is_default").default(false).notNull(),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
  },
  (t) => [index("variants_product_idx").on(t.productId)],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    imageUrl: text("image_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    displayOrder: integer("display_order").default(0).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("product_images_product_idx").on(t.productId)],
);

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    variantId: uuid("variant_id")
      .references(() => productVariants.id, { onDelete: "cascade" })
      .notNull(),
    warehouseName: varchar("warehouse_name", { length: 120 }).default("Chennai Central Hub").notNull(),
    availableStock: integer("available_stock").default(0).notNull(),
    reservedStock: integer("reserved_stock").default(0).notNull(),
    damagedStock: integer("damaged_stock").default(0).notNull(),
    minimumStock: integer("minimum_stock").default(5).notNull(),
    maximumStock: integer("maximum_stock").default(500).notNull(),
    reorderLevel: integer("reorder_level").default(20).notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("inventory_variant_idx").on(t.variantId)],
);

/* ------------------------------------------------------------------ */
/* Commerce                                                            */
/* ------------------------------------------------------------------ */

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    variantId: uuid("variant_id").references(() => productVariants.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("wishlist_unique_idx").on(t.profileId, t.productId)],
);

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }),
    guestToken: varchar("guest_token", { length: 64 }),
    subtotal: money("subtotal").default("0").notNull(),
    discount: money("discount").default("0").notNull(),
    deliveryCharge: money("delivery_charge").default("0").notNull(),
    taxAmount: money("tax_amount").default("0").notNull(),
    grandTotal: money("grand_total").default("0").notNull(),
    couponCode: varchar("coupon_code", { length: 40 }),
    ...timestamps,
  },
  (t) => [index("carts_profile_idx").on(t.profileId), index("carts_guest_idx").on(t.guestToken)],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .references(() => carts.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    variantId: uuid("variant_id")
      .references(() => productVariants.id, { onDelete: "cascade" })
      .notNull(),
    quantity: integer("quantity").default(1).notNull(),
    unitPrice: money("unit_price").notNull(),
    totalPrice: money("total_price").notNull(),
    ...timestamps,
  },
  (t) => [
    index("cart_items_cart_idx").on(t.cartId),
    uniqueIndex("cart_items_unique_idx").on(t.cartId, t.variantId),
  ],
);

export const coupons = pgTable(
  "coupons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    couponCode: varchar("coupon_code", { length: 40 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    description: text("description"),
    discountType: discountTypeEnum("discount_type").notNull(),
    discountValue: money("discount_value").default("0").notNull(),
    minimumOrderAmount: money("minimum_order_amount").default("0").notNull(),
    maximumDiscount: money("maximum_discount"),
    usageLimit: integer("usage_limit").default(1000).notNull(),
    usedCount: integer("used_count").default(0).notNull(),
    expiryDate: timestamp("expiry_date", { withTimezone: true }).notNull(),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("coupons_code_idx").on(t.couponCode)],
);

export const deliverySlots = pgTable(
  "delivery_slots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slotName: varchar("slot_name", { length: 60 }).notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    maximumOrders: integer("maximum_orders").default(250).notNull(),
    bookedOrders: integer("booked_orders").default(0).notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
  },
  (t) => [index("delivery_slots_sort_idx").on(t.sortOrder)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: varchar("order_number", { length: 30 }).notNull(),
    profileId: uuid("profile_id")
      .references(() => profiles.id, { onDelete: "restrict" })
      .notNull(),
    addressId: uuid("address_id").references(() => addresses.id, { onDelete: "set null" }),
    deliverySlotId: uuid("delivery_slot_id").references(() => deliverySlots.id, { onDelete: "set null" }),
    couponId: uuid("coupon_id").references(() => coupons.id, { onDelete: "set null" }),
    shippingSnapshot: jsonb("shipping_snapshot").$type<Record<string, string | number | null>>(),
    distanceKm: numeric("distance_km", { precision: 6, scale: 2 }).default("0").notNull(),
    subtotal: money("subtotal").notNull(),
    discount: money("discount").default("0").notNull(),
    deliveryCharge: money("delivery_charge").default("0").notNull(),
    taxAmount: money("tax_amount").default("0").notNull(),
    grandTotal: money("grand_total").notNull(),
    paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
    orderStatus: orderStatusEnum("order_status").default("placed").notNull(),
    deliveryOtp: varchar("delivery_otp", { length: 6 }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_number_idx").on(t.orderNumber),
    index("orders_profile_idx").on(t.profileId, t.createdAt),
    index("orders_status_idx").on(t.orderStatus),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "restrict" })
      .notNull(),
    variantId: uuid("variant_id")
      .references(() => productVariants.id, { onDelete: "restrict" })
      .notNull(),
    productName: varchar("product_name", { length: 200 }).notNull(),
    variantName: varchar("variant_name", { length: 80 }).notNull(),
    emoji: varchar("emoji", { length: 32 }).default("leafy").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: money("unit_price").notNull(),
    totalPrice: money("total_price").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    paymentGateway: varchar("payment_gateway", { length: 40 }).default("razorpay").notNull(),
    paymentMethod: varchar("payment_method", { length: 40 }).notNull(),
    transactionId: varchar("transaction_id", { length: 120 }),
    razorpayOrderId: varchar("razorpay_order_id", { length: 120 }),
    idempotencyKey: varchar("idempotency_key", { length: 120 }),
    paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
    paidAmount: money("paid_amount").default("0").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("payments_order_idx").on(t.orderId),
    uniqueIndex("payments_idempotency_idx").on(t.idempotencyKey),
  ],
);

export const orderTimeline = pgTable(
  "order_timeline",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    status: orderStatusEnum("status").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("order_timeline_order_idx").on(t.orderId, t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* Delivery                                                            */
/* ------------------------------------------------------------------ */

export const deliveryPartners = pgTable("delivery_partners", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 190 }),
  vehicleType: varchar("vehicle_type", { length: 60 }).notNull(),
  vehicleNumber: varchar("vehicle_number", { length: 30 }).notNull(),
  drivingLicense: varchar("driving_license", { length: 40 }),
  isOnline: boolean("is_online").default(true).notNull(),
  currentLatitude: doublePrecision("current_latitude"),
  currentLongitude: doublePrecision("current_longitude"),
  rating: numeric("rating", { precision: 3, scale: 2 }).default("4.80").notNull(),
  status: statusEnum("status").default("active").notNull(),
  ...timestamps,
});

export const deliveryAssignments = pgTable(
  "delivery_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .references(() => orders.id, { onDelete: "cascade" })
      .notNull(),
    deliveryPartnerId: uuid("delivery_partner_id")
      .references(() => deliveryPartners.id, { onDelete: "set null" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    pickedAt: timestamp("picked_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    deliveryStatus: deliveryStatusEnum("delivery_status").default("assigned").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("delivery_assignment_order_idx").on(t.orderId)],
);

/* ------------------------------------------------------------------ */
/* Engagement & content                                                */
/* ------------------------------------------------------------------ */

export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .references(() => products.id, { onDelete: "cascade" })
      .notNull(),
    profileId: uuid("profile_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    rating: integer("rating").notNull(),
    reviewTitle: varchar("review_title", { length: 160 }),
    review: text("review"),
    reviewImage: text("review_image"),
    isVerifiedPurchase: boolean("is_verified_purchase").default(false).notNull(),
    ...timestamps,
  },
  (t) => [index("reviews_product_idx").on(t.productId)],
);

export const blogs = pgTable(
  "blogs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    featuredImage: text("featured_image"),
    emoji: varchar("emoji", { length: 32 }).default("leafy").notNull(),
    author: varchar("author", { length: 120 }).default("VeggieFlick Kitchen").notNull(),
    shortDescription: text("short_description"),
    content: text("content").notNull(),
    seoTitle: varchar("seo_title", { length: 200 }),
    seoDescription: text("seo_description"),
    publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow().notNull(),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("blogs_slug_idx").on(t.slug)],
);

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 200 }).notNull(),
    slug: varchar("slug", { length: 220 }).notNull(),
    image: text("image"),
    emoji: varchar("emoji", { length: 32 }).default("soup").notNull(),
    summary: text("summary"),
    ingredients: jsonb("ingredients").$type<string[]>().notNull(),
    instructions: jsonb("instructions").$type<string[]>().notNull(),
    preparationTime: integer("preparation_time").default(10).notNull(),
    cookingTime: integer("cooking_time").default(20).notNull(),
    servings: integer("servings").default(4).notNull(),
    difficulty: varchar("difficulty", { length: 20 }).default("Easy").notNull(),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("recipes_slug_idx").on(t.slug)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    message: text("message").notNull(),
    notificationType: notificationTypeEnum("notification_type").default("system").notNull(),
    channel: varchar("channel", { length: 20 }).default("in_app").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("notifications_profile_idx").on(t.profileId, t.createdAt)],
);

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .references(() => profiles.id, { onDelete: "cascade" })
      .notNull(),
    balance: money("balance").default("0").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("wallets_profile_idx").on(t.profileId)],
);

export const walletTransactions = pgTable(
  "wallet_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    walletId: uuid("wallet_id")
      .references(() => wallets.id, { onDelete: "cascade" })
      .notNull(),
    amount: money("amount").notNull(),
    type: walletTxnTypeEnum("type").notNull(),
    narration: varchar("narration", { length: 200 }),
    referenceOrderId: uuid("reference_order_id").references(() => orders.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("wallet_txn_wallet_idx").on(t.walletId, t.createdAt)],
);

export const giftCards = pgTable(
  "gift_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 24 }).notNull(),
    amount: money("amount").notNull(),
    balance: money("balance").notNull(),
    issuedTo: varchar("issued_to", { length: 190 }),
    expiryDate: timestamp("expiry_date", { withTimezone: true }).notNull(),
    status: statusEnum("status").default("active").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("gift_cards_code_idx").on(t.code)],
);

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().defaultRandom(),
  referrerId: uuid("referrer_id")
    .references(() => profiles.id, { onDelete: "cascade" })
    .notNull(),
  referredId: uuid("referred_id").references(() => profiles.id, { onDelete: "set null" }),
  referralCode: varchar("referral_code", { length: 16 }).notNull(),
  rewardStatus: varchar("reward_status", { length: 20 }).default("pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => profiles.id, { onDelete: "set null" }),
    action: varchar("action", { length: 120 }).notNull(),
    entity: varchar("entity", { length: 80 }).notNull(),
    entityId: varchar("entity_id", { length: 80 }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("audit_logs_entity_idx").on(t.entity, t.createdAt)],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 190 }).notNull(),
    source: varchar("source", { length: 60 }).default("website").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [uniqueIndex("newsletter_email_idx").on(t.email)],
);

export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
