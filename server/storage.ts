import { products, categories, orders, orderItems, users, userAddresses, productReviews, tradeApplications, type Product, type Category, type Order, type OrderItem, type User, type UserAddress, type ProductReview, type TradeApplication, type InsertProduct, type InsertCategory, type InsertUser, type InsertUserAddress, type InsertProductReview, type InsertTradeApplication, type CreateOrderRequest } from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, or, like, gte, lte, asc, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;

  // Categories
  getAllCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Products
  getAllProducts(): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductsByCategorySlug(categorySlug: string): Promise<Product[]>;
  searchProducts(params: {
    search?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    categorySlug?: string;
    sort?: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest';
  }): Promise<Product[]>;
  getAllBrands(): Promise<string[]>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Orders
  createOrderWithItems(request: CreateOrderRequest, userId?: string): Promise<{ order: Order; items: OrderItem[] }>;
  getUserOrders(userId: string): Promise<Array<Order & { items: OrderItem[] }>>;

  // User Addresses
  getUserAddresses(userId: string): Promise<UserAddress[]>;
  createUserAddress(userId: string, address: InsertUserAddress): Promise<UserAddress>;
  updateUserAddress(id: string, userId: string, address: Partial<InsertUserAddress>): Promise<UserAddress | undefined>;
  deleteUserAddress(id: string, userId: string): Promise<boolean>;
  setDefaultAddress(id: string, userId: string): Promise<void>;

  // Product Reviews
  getProductReviews(productId: string): Promise<ProductReview[]>;
  createProductReview(review: InsertProductReview): Promise<ProductReview>;
  getAverageRating(productId: string): Promise<number>;

  // Trade Applications
  createTradeApplication(userId: string, application: InsertTradeApplication): Promise<TradeApplication>;
  getTradeApplicationByUserId(userId: string): Promise<TradeApplication | undefined>;
  getTradeApplicationById(id: string): Promise<TradeApplication | undefined>;
  updateTradeApprovalStatus(id: string, approved: boolean): Promise<TradeApplication | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  // Categories
  async getAllCategories(): Promise<Category[]> {
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        imageUrl: categories.imageUrl,
        productCount: sql<number>`COALESCE(COUNT(${products.id})::int, 0)`,
      })
      .from(categories)
      .leftJoin(products, eq(products.categoryId, categories.id))
      .groupBy(categories.id, categories.name, categories.slug, categories.description, categories.imageUrl);
    
    return result;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category || undefined;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.featured, true));
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.slug, slug));
    return product || undefined;
  }

  async getProductsByCategorySlug(categorySlug: string): Promise<Product[]> {
    const category = await this.getCategoryBySlug(categorySlug);
    if (!category) return [];
    
    return await db.select().from(products).where(eq(products.categoryId, category.id));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async searchProducts(params: {
    search?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    categorySlug?: string;
    sort?: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'newest';
  }): Promise<Product[]> {
    const conditions = [];

    if (params.search) {
      conditions.push(
        or(
          like(products.name, `%${params.search}%`),
          like(products.description, `%${params.search}%`)
        )
      );
    }

    if (params.brand) {
      conditions.push(eq(products.brand, params.brand));
    }

    if (params.minPrice !== undefined) {
      conditions.push(sql`CAST(${products.price} AS DECIMAL) >= ${params.minPrice}`);
    }

    if (params.maxPrice !== undefined) {
      conditions.push(sql`CAST(${products.price} AS DECIMAL) <= ${params.maxPrice}`);
    }

    if (params.categorySlug) {
      const category = await this.getCategoryBySlug(params.categorySlug);
      if (category) {
        conditions.push(eq(products.categoryId, category.id));
      }
    }

    let query = db.select().from(products);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    switch (params.sort) {
      case 'price-asc':
        query = query.orderBy(sql`CAST(${products.price} AS DECIMAL) ASC`) as any;
        break;
      case 'price-desc':
        query = query.orderBy(sql`CAST(${products.price} AS DECIMAL) DESC`) as any;
        break;
      case 'name-asc':
        query = query.orderBy(asc(products.name)) as any;
        break;
      case 'name-desc':
        query = query.orderBy(desc(products.name)) as any;
        break;
      case 'newest':
        query = query.orderBy(desc(products.createdAt)) as any;
        break;
      default:
        query = query.orderBy(asc(products.name)) as any;
    }

    return await query;
  }

  async getAllBrands(): Promise<string[]> {
    const result = await db.selectDistinct({ brand: products.brand }).from(products).orderBy(asc(products.brand));
    return result.map(r => r.brand);
  }

  // Orders
  async createOrderWithItems(request: CreateOrderRequest, userId?: string): Promise<{ order: Order; items: OrderItem[] }> {
    return await db.transaction(async (tx) => {
      // 1. Fetch all products and validate stock
      const productIds = request.items.map(item => item.productId);
      const fetchedProducts = await tx.select().from(products).where(
        inArray(products.id, productIds)
      );

      if (fetchedProducts.length !== request.items.length) {
        throw new Error("One or more products not found");
      }

      // Create a map for easy lookup
      const productMap = new Map(fetchedProducts.map(p => [p.id, p]));

      // 2. Validate stock and calculate totals
      let subtotal = 0;
      const itemsToCreate: Array<{ productId: string; quantity: number; priceAtPurchase: string; lineSubtotal: string }> = [];

      for (const item of request.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stock}, requested: ${item.quantity}`);
        }

        const price = parseFloat(product.price);
        const lineSubtotal = price * item.quantity;
        subtotal += lineSubtotal;

        itemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          priceAtPurchase: product.price,
          lineSubtotal: lineSubtotal.toFixed(2),
        });
      }

      // 3. Calculate VAT and total (15% VAT)
      const vat = subtotal * 0.15;
      const total = subtotal + vat;

      // 4. Create the order with server-controlled status
      const [createdOrder] = await tx.insert(orders).values({
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        deliveryAddress: request.deliveryAddress,
        deliveryCity: request.deliveryCity,
        deliveryProvince: request.deliveryProvince,
        deliveryPostalCode: request.deliveryPostalCode,
        paymentReference: request.paymentReference,
        paymentStatus: request.paymentStatus,
        userId: userId || null,
        subtotal: subtotal.toFixed(2),
        vat: vat.toFixed(2),
        total: total.toFixed(2),
        status: "pending",
      }).returning();

      // 5. Create order items
      const createdItems = await tx.insert(orderItems).values(
        itemsToCreate.map(item => ({
          ...item,
          orderId: createdOrder.id,
        }))
      ).returning();

      // 6. Decrement stock for each product
      for (const item of request.items) {
        await tx.update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      return { order: createdOrder, items: createdItems };
    });
  }

  async getUserOrders(userId: string): Promise<Array<Order & { items: OrderItem[] }>> {
    const userOrders = await db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
    
    const ordersWithItems = await Promise.all(
      userOrders.map(async (order) => {
        const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
        return { ...order, items };
      })
    );
    
    return ordersWithItems;
  }

  async getOrderById(orderId: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    return order || undefined;
  }

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async updateOrderPaymentReference(orderId: string, paymentReference: string): Promise<void> {
    await db.update(orders)
      .set({ paymentReference })
      .where(eq(orders.id, orderId));
  }

  async updateOrderPaymentStatus(orderId: string, paymentStatus: string, paymentReference?: string): Promise<void> {
    const updateData: any = { paymentStatus };
    if (paymentStatus === "paid") {
      updateData.status = "paid";
    }
    if (paymentReference) {
      updateData.paymentReference = paymentReference;
    }
    
    await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, orderId));
  }

  // User Addresses
  async getUserAddresses(userId: string): Promise<UserAddress[]> {
    return await db.select().from(userAddresses).where(eq(userAddresses.userId, userId)).orderBy(desc(userAddresses.isDefault), desc(userAddresses.createdAt));
  }

  async createUserAddress(userId: string, address: InsertUserAddress): Promise<UserAddress> {
    const [createdAddress] = await db.insert(userAddresses).values({
      ...address,
      userId,
    }).returning();
    
    // If this address is set as default, unset all other addresses
    if (address.isDefault) {
      await db.update(userAddresses)
        .set({ isDefault: false })
        .where(and(
          eq(userAddresses.userId, userId),
          sql`${userAddresses.id} != ${createdAddress.id}`
        ));
    }
    
    return createdAddress;
  }

  async updateUserAddress(id: string, userId: string, address: Partial<InsertUserAddress>): Promise<UserAddress | undefined> {
    // If setting as default, unset all other addresses first
    if (address.isDefault) {
      await db.update(userAddresses)
        .set({ isDefault: false })
        .where(and(
          eq(userAddresses.userId, userId),
          sql`${userAddresses.id} != ${id}`
        ));
    }
    
    const [updatedAddress] = await db.update(userAddresses)
      .set(address)
      .where(and(
        eq(userAddresses.id, id),
        eq(userAddresses.userId, userId)
      ))
      .returning();
    
    return updatedAddress || undefined;
  }

  async deleteUserAddress(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(userAddresses)
      .where(and(
        eq(userAddresses.id, id),
        eq(userAddresses.userId, userId)
      ))
      .returning();
    
    return result.length > 0;
  }

  async setDefaultAddress(id: string, userId: string): Promise<void> {
    // Unset all defaults for this user
    await db.update(userAddresses)
      .set({ isDefault: false })
      .where(eq(userAddresses.userId, userId));
    
    // Set the specified address as default
    await db.update(userAddresses)
      .set({ isDefault: true })
      .where(and(
        eq(userAddresses.id, id),
        eq(userAddresses.userId, userId)
      ));
  }

  // Product Reviews
  async getProductReviews(productId: string): Promise<ProductReview[]> {
    return await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.productId, productId))
      .orderBy(desc(productReviews.createdAt));
  }

  async createProductReview(review: InsertProductReview): Promise<ProductReview> {
    const [createdReview] = await db.insert(productReviews).values(review).returning();
    return createdReview;
  }

  async getAverageRating(productId: string): Promise<number> {
    const result = await db
      .select({
        avg: sql<number>`COALESCE(AVG(${productReviews.rating})::numeric(3,2), 0)`,
      })
      .from(productReviews)
      .where(eq(productReviews.productId, productId));
    
    // PostgreSQL returns numeric as string, convert to number
    const avgValue = result[0]?.avg;
    return typeof avgValue === 'string' ? parseFloat(avgValue) : (avgValue || 0);
  }

  // Trade Applications
  async createTradeApplication(userId: string, application: InsertTradeApplication): Promise<TradeApplication> {
    const [tradeApp] = await db.insert(tradeApplications).values({
      ...application,
      userId,
    }).returning();
    return tradeApp;
  }

  async getTradeApplicationByUserId(userId: string): Promise<TradeApplication | undefined> {
    const [tradeApp] = await db
      .select()
      .from(tradeApplications)
      .where(eq(tradeApplications.userId, userId))
      .orderBy(desc(tradeApplications.createdAt))
      .limit(1);
    return tradeApp || undefined;
  }

  async getTradeApplicationById(id: string): Promise<TradeApplication | undefined> {
    const [tradeApp] = await db
      .select()
      .from(tradeApplications)
      .where(eq(tradeApplications.id, id));
    return tradeApp || undefined;
  }

  async updateTradeApprovalStatus(id: string, approved: boolean): Promise<TradeApplication | undefined> {
    const [updatedApp] = await db
      .update(tradeApplications)
      .set({ 
        approved,
        approvedAt: approved ? sql`NOW()` : null,
      })
      .where(eq(tradeApplications.id, id))
      .returning();
    return updatedApp || undefined;
  }
}

export const storage = new DatabaseStorage();
