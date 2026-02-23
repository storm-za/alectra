import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["customer", "installer", "admin"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("customer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  imageUrl: text("image_url"),
  productCount: integer("product_count").notNull().default(0),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  brand: text("brand").notNull(),
  sku: text("sku").notNull().unique(),
  storeCode: text("store_code"),
  categoryId: varchar("category_id").references(() => categories.id),
  imageUrl: text("image_url").notNull(),
  images: text("images").array().notNull().default(sql`ARRAY[]::text[]`),
  stock: integer("stock").notNull().default(0),
  featured: boolean("featured").notNull().default(false),
  discontinued: boolean("discontinued").notNull().default(false),
  specifications: text("specifications"),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productVariants = pgTable("product_variants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  sku: text("sku"),
  stock: integer("stock").notNull().default(0),
  sortOrder: integer("sort_order").notNull().default(0),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  deliveryMethod: text("delivery_method").notNull().default("delivery"),
  pickupStore: text("pickup_store"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  deliveryAddress: text("delivery_address"),
  deliveryCity: text("delivery_city"),
  deliveryProvince: text("delivery_province"),
  deliveryPostalCode: text("delivery_postal_code"),
  locationLatitude: decimal("location_latitude", { precision: 10, scale: 7 }),
  locationLongitude: decimal("location_longitude", { precision: 11, scale: 7 }),
  isGift: boolean("is_gift").notNull().default(false),
  giftMessage: text("gift_message"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vat: decimal("vat", { precision: 10, scale: 2 }).notNull(),
  tradeDiscount: decimal("trade_discount", { precision: 10, scale: 2 }),
  discountCodeId: varchar("discount_code_id"),
  discountCodeValue: text("discount_code_value"),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paymentReference: text("payment_reference"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  trackingLink: text("tracking_link"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: decimal("price_at_purchase", { precision: 10, scale: 2 }).notNull(),
  lineSubtotal: decimal("line_subtotal", { precision: 10, scale: 2 }).notNull(),
  productName: text("product_name"),
  productImage: text("product_image"),
});

export const userAddresses = pgTable("user_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  addressLine: text("address_line").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  postalCode: text("postal_code").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const productReviews = pgTable("product_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  authorName: text("author_name").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tradeApplications = pgTable("trade_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  registrationNumber: text("registration_number"),
  taxNumber: text("tax_number"),
  businessType: text("business_type").notNull(),
  physicalAddress: text("physical_address").notNull(),
  yearsInBusiness: integer("years_in_business").notNull(),
  contactPerson: text("contact_person").notNull(),
  contactPhone: text("contact_phone").notNull(),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  author: text("author").notNull().default("Alectra Solutions"),
  imageUrl: text("image_url").notNull(),
  tags: text("tags").array().notNull().default(sql`ARRAY[]::text[]`),
  metaDescription: text("meta_description").notNull(),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const sessionVisits = pgTable("session_visits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  path: text("path").notNull(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  referrer: text("referrer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type SessionVisit = typeof sessionVisits.$inferSelect;
export type InsertSessionVisit = typeof sessionVisits.$inferInsert;

export const abandonedCarts = pgTable("abandoned_carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  cartItems: text("cart_items").notNull(), // JSON string of cart items
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  reminderSent: boolean("reminder_sent").notNull().default(false),
  reminderSentAt: timestamp("reminder_sent_at"),
  converted: boolean("converted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type AbandonedCart = typeof abandonedCarts.$inferSelect;
export type InsertAbandonedCart = typeof abandonedCarts.$inferInsert;

export const discountTypeEnum = pgEnum("discount_type", ["free_shipping", "fixed_amount", "percentage"]);

export const discountCodes = pgTable("discount_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  type: discountTypeEnum("type").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }),
  maxUses: integer("max_uses"),
  usesCount: integer("uses_count").notNull().default(0),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = typeof discountCodes.$inferInsert;

export const wishlistItems = pgTable("wishlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type InsertWishlistItem = typeof wishlistItems.$inferInsert;

export const frequentlyBoughtTogether = pgTable("frequently_bought_together", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  relatedProductId: varchar("related_product_id").notNull().references(() => products.id),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type FrequentlyBoughtTogether = typeof frequentlyBoughtTogether.$inferSelect;
export type InsertFrequentlyBoughtTogether = typeof frequentlyBoughtTogether.$inferInsert;

export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  user: one(users, {
    fields: [wishlistItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlistItems.productId],
    references: [products.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  addresses: many(userAddresses),
  tradeApplications: many(tradeApplications),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  reviews: many(productReviews),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, {
    fields: [userAddresses.userId],
    references: [users.id],
  }),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
}));

export const tradeApplicationsRelations = relations(tradeApplications, ({ one }) => ({
  user: one(users, {
    fields: [tradeApplications.userId],
    references: [users.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  subtotal: true,
  vat: true,
  total: true,
  status: true,
  userId: true,
}).extend({
  deliveryMethod: z.enum(["delivery", "pickup"]).default("delivery"),
  deliveryAddress: z.string().optional().nullable(),
  deliveryCity: z.string().optional().nullable(),
  deliveryProvince: z.string().optional().nullable(),
  deliveryPostalCode: z.string().optional().nullable(),
  locationLatitude: z.string().optional().nullable(),
  locationLongitude: z.string().optional().nullable(),
  isGift: z.boolean().default(false),
  giftMessage: z.string().optional().nullable(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export const insertUserAddressSchema = createInsertSchema(userAddresses).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
}).extend({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  authorName: z.string().min(2, "Name must be at least 2 characters"),
});

export const insertTradeApplicationSchema = createInsertSchema(tradeApplications).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  userId: true,
  approved: true,
}).extend({
  companyName: z.string().min(2, "Company name is required"),
  registrationNumber: z.string().optional(),
  taxNumber: z.string().optional(),
  businessType: z.string().min(2, "Business type is required"),
  physicalAddress: z.string().min(10, "Physical address is required"),
  yearsInBusiness: z.number().int().min(0, "Years in business must be 0 or more"),
  contactPerson: z.string().min(2, "Contact person name is required"),
  contactPhone: z.string().min(10, "Valid contact phone is required"),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  publishedAt: true,
  updatedAt: true,
});

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).omit({
  id: true,
  createdAt: true,
  usesCount: true,
}).extend({
  code: z.string().min(3, "Code must be at least 3 characters").max(50, "Code too long"),
  type: z.enum(["free_shipping", "fixed_amount", "percentage"]),
  value: z.string().optional().nullable(),
  maxUses: z.number().int().min(1).optional().nullable(),
  active: z.boolean().default(true),
  expiresAt: z.string().optional().nullable(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type UserAddress = typeof userAddresses.$inferSelect;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;

export type ProductReview = typeof productReviews.$inferSelect;
export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;

export type TradeApplication = typeof tradeApplications.$inferSelect;
export type InsertTradeApplication = z.infer<typeof insertTradeApplicationSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type LpGasVariant = 'exchange' | 'new';
export type GarageDoorSize = '2450mm' | '2550mm';
export type GarageDoorFinish = 'smooth' | 'woodgrain';
export type GarageDoorVariant = `${GarageDoorSize}-${GarageDoorFinish}`;
export type TorsionSpringVariant = 
  | '45kg-green-left' | '45kg-green-right'
  | '50kg-beige-left' | '50kg-beige-right'
  | '60kg-blue-left' | '60kg-blue-right'
  | '65kg-bluewhite-left' | '65kg-bluewhite-right'
  | '70kg-white-left' | '70kg-white-right'
  | '80kg-yellow-left' | '80kg-yellow-right'
  | '90kg-orange-left' | '90kg-orange-right'
  | '100kg-green-left' | '100kg-green-right';
export type CartVariantType = LpGasVariant | GarageDoorVariant | TorsionSpringVariant;

export type CartItem = {
  product: Product;
  quantity: number;
  variant?: CartVariantType;
  variantPrice?: string;
};

// LP Gas pricing configuration
export const LP_GAS_PRICING: Record<string, { exchange: number; new: number }> = {
  'c2b268a1-714c-4460-aff3-d5f9906d98bd': { exchange: 280, new: 995 },    // 9kg
  '7c0ef3c4-7181-4d35-8145-562bc2434f11': { exchange: 580, new: 1820 },   // 19kg
  '51891f80-9f0b-4817-9a2c-c5ff57f44905': { exchange: 1199, new: 3700 },  // 48kg
};

export const LP_GAS_CYLINDER_IDS = Object.keys(LP_GAS_PRICING);

// Glosteel Garage Door size pricing configuration
export const GLOSTEEL_PRICING: Record<string, { '2450mm': number; '2550mm': number }> = {
  '9a5b69aa-7d98-4563-84a1-f5ea3068866f': { '2450mm': 1899, '2550mm': 2299 },  // African Cream
  '8ba7234a-099a-49aa-b30f-623b314bc9c2': { '2450mm': 1899, '2550mm': 2299 },  // Charcoal Grey
  '4bc37862-e715-4d3a-b374-f88e15a7fdcd': { '2450mm': 1899, '2550mm': 2299 },  // Safari Brown
};

export const GLOSTEEL_DOOR_IDS = Object.keys(GLOSTEEL_PRICING);

// Torsion Spring variant pricing and metadata configuration
export interface TorsionSpringVariantInfo {
  price: number;
  weight: string;
  color: string;
  colorCode: string;
  winding: 'left' | 'right';
  coneColor: string;
  label: string;
  description: string;
  image?: string;
}

export const TORSION_SPRING_VARIANTS: Record<TorsionSpringVariant, TorsionSpringVariantInfo> = {
  '45kg-green-left': {
    price: 289,
    weight: '45kg',
    color: 'Green',
    colorCode: 'green',
    winding: 'left',
    coneColor: 'Red',
    label: '45kg Green - Left (Red Cone)',
    description: 'Professional-grade 45kg torsion spring with green color coding for easy identification. Left-wound with red winding cone, ideal for standard single garage doors. DASMA certified for reliable performance and safety.',
    image: '/images/torsion-springs/45kg-green.webp',
  },
  '45kg-green-right': {
    price: 289,
    weight: '45kg',
    color: 'Green',
    colorCode: 'green',
    winding: 'right',
    coneColor: 'Black',
    label: '45kg Green - Right (Black Cone)',
    description: 'Professional-grade 45kg torsion spring with green color coding for easy identification. Right-wound with black winding cone, pairs with left-wound spring for balanced door operation.',
    image: '/images/torsion-springs/45kg-green.webp',
  },
  '50kg-beige-left': {
    price: 295,
    weight: '50kg',
    color: 'Beige',
    colorCode: 'beige',
    winding: 'left',
    coneColor: 'Red',
    label: '50kg Beige - Left (Red Cone)',
    description: 'Heavy-duty 50kg torsion spring with beige color coding. Left-wound with red winding cone, suitable for medium-weight sectional and roller garage doors. Precision-wound for smooth operation.',
    image: '/images/torsion-springs/50kg-beige.webp',
  },
  '50kg-beige-right': {
    price: 295,
    weight: '50kg',
    color: 'Beige',
    colorCode: 'beige',
    winding: 'right',
    coneColor: 'Black',
    label: '50kg Beige - Right (Black Cone)',
    description: 'Heavy-duty 50kg torsion spring with beige color coding. Right-wound with black winding cone, essential counterpart for balanced garage door lifting.',
    image: '/images/torsion-springs/50kg-beige.webp',
  },
  '60kg-blue-left': {
    price: 335,
    weight: '60kg',
    color: 'Blue',
    colorCode: 'blue',
    winding: 'left',
    coneColor: 'Red',
    label: '60kg Blue - Left (Red Cone)',
    description: 'Industrial-strength 60kg torsion spring with blue color coding. Left-wound with red winding cone, designed for heavier residential garage doors and light commercial applications.',
    image: '/images/torsion-springs/60kg-blue.webp',
  },
  '60kg-blue-right': {
    price: 335,
    weight: '60kg',
    color: 'Blue',
    colorCode: 'blue',
    winding: 'right',
    coneColor: 'Black',
    label: '60kg Blue - Right (Black Cone)',
    description: 'Industrial-strength 60kg torsion spring with blue color coding. Right-wound with black winding cone, provides reliable counterbalance for heavier doors.',
    image: '/images/torsion-springs/60kg-blue.webp',
  },
  '65kg-bluewhite-left': {
    price: 365,
    weight: '65kg',
    color: 'Blue/White',
    colorCode: 'bluewhite',
    winding: 'left',
    coneColor: 'Red',
    label: '65kg Blue/White - Left (Red Cone)',
    description: 'Premium 65kg torsion spring with distinctive blue/white color coding. Left-wound with red winding cone, engineered for larger residential doors requiring extra lifting capacity.',
    image: '/images/torsion-springs/65kg-bluewhite.webp',
  },
  '65kg-bluewhite-right': {
    price: 365,
    weight: '65kg',
    color: 'Blue/White',
    colorCode: 'bluewhite',
    winding: 'right',
    coneColor: 'Black',
    label: '65kg Blue/White - Right (Black Cone)',
    description: 'Premium 65kg torsion spring with distinctive blue/white color coding. Right-wound with black winding cone, matched counterpart for optimal door balance.',
    image: '/images/torsion-springs/65kg-bluewhite.webp',
  },
  '70kg-white-left': {
    price: 389,
    weight: '70kg',
    color: 'White',
    colorCode: 'white',
    winding: 'left',
    coneColor: 'Red',
    label: '70kg White - Left (Red Cone)',
    description: 'High-capacity 70kg torsion spring with white color coding. Left-wound with red winding cone, perfect for double garage doors and insulated door panels.',
    image: '/images/torsion-springs/70kg-white.webp',
  },
  '70kg-white-right': {
    price: 389,
    weight: '70kg',
    color: 'White',
    colorCode: 'white',
    winding: 'right',
    coneColor: 'Black',
    label: '70kg White - Right (Black Cone)',
    description: 'High-capacity 70kg torsion spring with white color coding. Right-wound with black winding cone, designed for effortless lifting of heavier double doors.',
    image: '/images/torsion-springs/70kg-white.webp',
  },
  '80kg-yellow-left': {
    price: 465,
    weight: '80kg',
    color: 'Yellow',
    colorCode: 'yellow',
    winding: 'left',
    coneColor: 'Red',
    label: '80kg Yellow - Left (Red Cone)',
    description: 'Commercial-grade 80kg torsion spring with yellow color coding. Left-wound with red winding cone, built for extra-large residential and commercial garage doors.',
    image: '/images/torsion-springs/80kg-yellow.webp',
  },
  '80kg-yellow-right': {
    price: 465,
    weight: '80kg',
    color: 'Yellow',
    colorCode: 'yellow',
    winding: 'right',
    coneColor: 'Black',
    label: '80kg Yellow - Right (Black Cone)',
    description: 'Commercial-grade 80kg torsion spring with yellow color coding. Right-wound with black winding cone, essential for balanced operation of heavy-duty doors.',
    image: '/images/torsion-springs/80kg-yellow.webp',
  },
  '90kg-orange-left': {
    price: 480,
    weight: '90kg',
    color: 'Orange',
    colorCode: 'orange',
    winding: 'left',
    coneColor: 'Red',
    label: '90kg Orange - Left (Red Cone)',
    description: 'Extra heavy-duty 90kg torsion spring with orange color coding. Left-wound with red winding cone, suitable for commercial installations and oversized garage doors.',
    image: '/images/torsion-springs/90kg-orange.webp',
  },
  '90kg-orange-right': {
    price: 480,
    weight: '90kg',
    color: 'Orange',
    colorCode: 'orange',
    winding: 'right',
    coneColor: 'Black',
    label: '90kg Orange - Right (Black Cone)',
    description: 'Extra heavy-duty 90kg torsion spring with orange color coding. Right-wound with black winding cone, reliable counterbalance for demanding applications.',
    image: '/images/torsion-springs/90kg-orange.webp',
  },
  '100kg-green-left': {
    price: 670,
    weight: '100kg',
    color: 'Green',
    colorCode: 'green',
    winding: 'left',
    coneColor: 'Red',
    label: '100kg Green - Left (Red Cone)',
    description: 'Maximum capacity 100kg torsion spring with green color coding. Left-wound with red winding cone, engineered for the heaviest commercial and industrial garage doors.',
    image: '/images/torsion-springs/100kg-green.webp',
  },
  '100kg-green-right': {
    price: 670,
    weight: '100kg',
    color: 'Green',
    colorCode: 'green',
    winding: 'right',
    coneColor: 'Black',
    label: '100kg Green - Right (Black Cone)',
    description: 'Maximum capacity 100kg torsion spring with green color coding. Right-wound with black winding cone, the ultimate solution for heavy industrial door systems.',
    image: '/images/torsion-springs/100kg-green.webp',
  },
};

// Torsion spring product ID
export const TORSION_SPRING_PRODUCT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

// Products that qualify for FREE shipping
export const FREE_SHIPPING_PRODUCT_IDS = [
  '780934af-6b51-4040-9cbc-10488ac09e8d',  // 4K Solar Two Screens Outdoor Security Camera
  '5dce8f01-ab70-4203-a45a-2affbccf4412',  // ET Nice DC Blue Astute 3.2m Sectional Garage Door Motor
  '619fec8b-24c4-4609-a7ff-6cedd8ce5fbd',  // Custom amount - no shipping cost
];

export const createOrderRequestSchema = insertOrderSchema.extend({
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    variant: z.string().optional(),
    variantPrice: z.string().optional(),
  })).min(1),
  discountCodeId: z.string().nullable().optional(),
  discountCode: z.string().nullable().optional(),
  discountType: z.enum(["free_shipping", "fixed_amount", "percentage"]).nullable().optional(),
  discountValue: z.string().nullable().optional(),
  discountAmount: z.string().nullable().optional(),
});

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
});

export type RegisterData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

export const paystackInitializeResponseSchema = z.object({
  authorizationUrl: z.string(),
  accessCode: z.string(),
  reference: z.string(),
});

export type PaystackInitializeResponse = z.infer<typeof paystackInitializeResponseSchema>;

export const paystackVerifyResponseSchema = z.object({
  status: z.string(),
  message: z.string().optional(),
  data: z.object({
    orderId: z.string(),
    amount: z.number(),
    paidAt: z.string().optional(),
    reference: z.string(),
  }).optional(),
});

export type PaystackVerifyResponse = z.infer<typeof paystackVerifyResponseSchema>;
