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

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  deliveryMethod: text("delivery_method").notNull().default("delivery"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  deliveryAddress: text("delivery_address"),
  deliveryCity: text("delivery_city"),
  deliveryProvince: text("delivery_province"),
  deliveryPostalCode: text("delivery_postal_code"),
  locationPinUrl: text("location_pin_url"),
  isGift: boolean("is_gift").notNull().default(false),
  giftMessage: text("gift_message"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  vat: decimal("vat", { precision: 10, scale: 2 }).notNull(),
  tradeDiscount: decimal("trade_discount", { precision: 10, scale: 2 }),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).notNull().default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  paymentReference: text("payment_reference"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: decimal("price_at_purchase", { precision: 10, scale: 2 }).notNull(),
  lineSubtotal: decimal("line_subtotal", { precision: 10, scale: 2 }).notNull(),
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
  locationPinUrl: z.string().optional().nullable(),
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

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

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
export type ProductVariant = LpGasVariant | GarageDoorSize;

export type CartItem = {
  product: Product;
  quantity: number;
  variant?: ProductVariant;
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
