import { products, categories, orders, orderItems, users, userAddresses, productReviews, tradeApplications, blogPosts, sessionVisits, discountCodes, FREE_SHIPPING_PRODUCT_IDS, type Product, type Category, type Order, type OrderItem, type User, type UserAddress, type ProductReview, type TradeApplication, type BlogPost, type SessionVisit, type InsertSessionVisit, type InsertProduct, type InsertCategory, type InsertUser, type InsertUserAddress, type InsertProductReview, type InsertTradeApplication, type InsertBlogPost, type CreateOrderRequest, type DiscountCode, type InsertDiscountCode } from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, or, like, ilike, gte, lte, asc, desc, inArray } from "drizzle-orm";

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

  // Blog Posts
  getAllBlogPosts(): Promise<BlogPost[]>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;

  // Session Visits (Analytics)
  logSessionVisit(visit: InsertSessionVisit): Promise<SessionVisit>;
  getSessionVisitsForDate(date: Date): Promise<SessionVisit[]>;
  getSessionVisitsForDateRange(startDate: Date, endDate: Date): Promise<SessionVisit[]>;
  getVisitStats(date: Date): Promise<{ totalVisits: number; uniqueSessions: number; topPages: { path: string; count: number }[] }>;

  // Discount Codes
  getAllDiscountCodes(): Promise<DiscountCode[]>;
  getDiscountCodeById(id: string): Promise<DiscountCode | undefined>;
  getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined>;
  createDiscountCode(code: InsertDiscountCode): Promise<DiscountCode>;
  updateDiscountCode(id: string, updates: Partial<InsertDiscountCode>): Promise<DiscountCode | undefined>;
  deleteDiscountCode(id: string): Promise<boolean>;
  incrementDiscountCodeUsage(id: string): Promise<void>;
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

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
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

  async updateProductImages(slug: string, imageUrl: string, images: string[]): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ imageUrl, images })
      .where(eq(products.slug, slug))
      .returning();
    return product || undefined;
  }

  async updateProductCategory(slug: string, categoryId: string | null): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ categoryId })
      .where(eq(products.slug, slug))
      .returning();
    return product || undefined;
  }

  async updateProductDescription(slug: string, description: string): Promise<Product | undefined> {
    const [product] = await db
      .update(products)
      .set({ description })
      .where(eq(products.slug, slug))
      .returning();
    return product || undefined;
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
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
          ilike(products.name, `%${params.search}%`),
          ilike(products.description, `%${params.search}%`)
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

    // For search queries, prioritize name matches over description-only matches
    const nameMatchFirst = params.search 
      ? sql`CASE WHEN ${products.name} ILIKE ${'%' + params.search + '%'} THEN 0 ELSE 1 END`
      : null;

    switch (params.sort) {
      case 'price-asc':
        if (nameMatchFirst) {
          query = query.orderBy(nameMatchFirst, sql`CAST(${products.price} AS DECIMAL) ASC`) as any;
        } else {
          query = query.orderBy(sql`CAST(${products.price} AS DECIMAL) ASC`) as any;
        }
        break;
      case 'price-desc':
        if (nameMatchFirst) {
          query = query.orderBy(nameMatchFirst, sql`CAST(${products.price} AS DECIMAL) DESC`) as any;
        } else {
          query = query.orderBy(sql`CAST(${products.price} AS DECIMAL) DESC`) as any;
        }
        break;
      case 'name-asc':
        if (nameMatchFirst) {
          query = query.orderBy(nameMatchFirst, asc(products.name)) as any;
        } else {
          query = query.orderBy(asc(products.name)) as any;
        }
        break;
      case 'name-desc':
        if (nameMatchFirst) {
          query = query.orderBy(nameMatchFirst, desc(products.name)) as any;
        } else {
          query = query.orderBy(desc(products.name)) as any;
        }
        break;
      case 'newest':
        if (nameMatchFirst) {
          query = query.orderBy(nameMatchFirst, desc(products.createdAt)) as any;
        } else {
          query = query.orderBy(desc(products.createdAt)) as any;
        }
        break;
      default:
        if (nameMatchFirst) {
          query = query.orderBy(nameMatchFirst, asc(products.name)) as any;
        } else {
          query = query.orderBy(asc(products.name)) as any;
        }
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

      // 2. Validate stock and calculate totals (prices are VAT-inclusive)
      let totalVatInclusive = 0;
      const itemsToCreate: Array<{ productId: string; quantity: number; priceAtPurchase: string; lineSubtotal: string; productName: string; productImage: string | null }> = [];

      for (const item of request.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        // Check if product is discontinued
        if ((product as any).discontinued === true) {
          throw new Error(`Product is discontinued and cannot be ordered: ${product.name}`);
        }

        // Check stock availability
        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}. Available: ${product.stock}, requested: ${item.quantity}`);
        }

        // Use variant price if provided (for LP Gas Exchange/New options), otherwise use product price
        const priceString = item.variantPrice || product.price;
        const price = parseFloat(priceString);
        const lineTotal = price * item.quantity;
        totalVatInclusive += lineTotal;

        // Build product name with variant suffix for LP Gas / Glosteel doors / Torsion Springs
        let displayName = product.name;
        if (item.variant) {
          if (item.variant === 'exchange') {
            displayName = `${product.name} (Exchange)`;
          } else if (item.variant === 'new') {
            displayName = `${product.name} (New Cylinder)`;
          } else if (item.variant === '2450mm' || item.variant === '2550mm') {
            displayName = `${product.name} (${item.variant})`;
          } else if (item.variant.includes('kg-') && (item.variant.endsWith('-left') || item.variant.endsWith('-right'))) {
            // Torsion spring variant - format: 45kg-green-left -> "45kg Green Left-Wound"
            const parts = item.variant.split('-');
            const weight = parts[0];
            const color = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
            const winding = parts[2] === 'left' ? 'Left-Wound' : 'Right-Wound';
            displayName = `${product.name} (${weight} ${color} ${winding})`;
          } else {
            displayName = `${product.name} (${item.variant})`;
          }
        }

        itemsToCreate.push({
          productId: product.id,
          quantity: item.quantity,
          priceAtPurchase: priceString,
          lineSubtotal: lineTotal.toFixed(2),
          productName: displayName,
          productImage: product.imageUrl,
        });
      }

      // 3. Check if user has approved trade account for 15% discount
      let tradeDiscount = 0;
      if (userId) {
        const [application] = await tx.select()
          .from(tradeApplications)
          .where(sql`${tradeApplications.userId} = ${userId} AND ${tradeApplications.approved} = true`)
          .limit(1);
        
        if (application) {
          tradeDiscount = totalVatInclusive * 0.15;
        }
      }

      // 4. Server-side discount code validation and calculation (ignore client values)
      let discountCodeAmount = 0;
      let hasFreeShippingDiscountCode = false;
      let validatedDiscountCode: { id: string; code: string; type: string; value: string | null } | null = null;

      if (request.discountCodeId) {
        // Re-validate discount code from database - do not trust client values
        const [dbDiscountCode] = await tx.select()
          .from(discountCodes)
          .where(eq(discountCodes.id, request.discountCodeId))
          .limit(1);

        if (dbDiscountCode) {
          const now = new Date();
          const isActive = dbDiscountCode.isActive;
          const notExpired = !dbDiscountCode.expiresAt || new Date(dbDiscountCode.expiresAt) > now;
          const withinUsageLimit = dbDiscountCode.maxUses === null || dbDiscountCode.usesCount < dbDiscountCode.maxUses;

          if (isActive && notExpired && withinUsageLimit) {
            validatedDiscountCode = {
              id: dbDiscountCode.id,
              code: dbDiscountCode.code,
              type: dbDiscountCode.type,
              value: dbDiscountCode.value,
            };

            // Calculate discount amount server-side based on type
            if (dbDiscountCode.type === "free_shipping") {
              hasFreeShippingDiscountCode = true;
            } else if (dbDiscountCode.type === "fixed_amount" && dbDiscountCode.value) {
              discountCodeAmount = parseFloat(dbDiscountCode.value);
            } else if (dbDiscountCode.type === "percentage" && dbDiscountCode.value) {
              const percentage = parseFloat(dbDiscountCode.value);
              discountCodeAmount = (totalVatInclusive * percentage) / 100;
            }
          }
        }
      }

      // 5. Calculate final amounts (prices already include VAT)
      const totalAfterTradeDiscount = totalVatInclusive - tradeDiscount;
      const totalAfterDiscount = Math.max(0, totalAfterTradeDiscount - discountCodeAmount);
      const subtotalExclVat = totalAfterDiscount / 1.15;
      const vat = totalAfterDiscount - subtotalExclVat;
      
      // Calculate shipping cost with priority hierarchy:
      // 1. If pickup is selected → R0
      // 2. If cart has products with custom delivery fees → use highest custom fee (heavy items like Glosteel)
      // 3. If cart contains FREE shipping products → R0 (promotion)
      // 4. If cart contains 48KG LP Gas → R0 (special promotion)
      // 5. If cart contains other LP Gas products → R50 (Pretoria only delivery)
      // 6. If order total ≥ R2500 → R0
      // 7. Otherwise → R110 standard delivery fee
      let shippingCost = 110;
      
      if (request.deliveryMethod === "pickup") {
        shippingCost = 0;
      } else {
        // Check for custom delivery fees (e.g., heavy items like Glosteel garage doors) - takes priority
        const customDeliveryFees = fetchedProducts
          .filter(p => p.deliveryFee !== null && p.deliveryFee !== undefined)
          .map(p => parseFloat(p.deliveryFee as string));
        
        // Check if cart contains products with FREE shipping promotion
        const hasFreeShippingProduct = fetchedProducts.some(p => FREE_SHIPPING_PRODUCT_IDS.includes(p.id));
        
        // Check if cart contains 48KG LP Gas (ID: 51891f80-9f0b-4817-9a2c-c5ff57f44905)
        const has48kgLPGas = fetchedProducts.some(p => p.id === '51891f80-9f0b-4817-9a2c-c5ff57f44905');
        
        // Check if cart contains LP Gas products (category ID: e110c296-9deb-457b-9a4d-edfa9aa529e0)
        // Exclude 4kg Braai Briquettes (ID: fc37f396-5bcd-4aec-b831-768e7017f29a) - uses standard nationwide shipping
        const LP_GAS_STANDARD_SHIPPING_EXCEPTIONS = ['fc37f396-5bcd-4aec-b831-768e7017f29a'];
        const hasLPGas = fetchedProducts.some(p => 
          p.categoryId === 'e110c296-9deb-457b-9a4d-edfa9aa529e0' && 
          !LP_GAS_STANDARD_SHIPPING_EXCEPTIONS.includes(p.id)
        );
        
        if (hasFreeShippingDiscountCode) {
          shippingCost = 0; // Free shipping discount code applied
        } else if (customDeliveryFees.length > 0) {
          shippingCost = Math.max(...customDeliveryFees); // Heavy items take priority
        } else if (hasFreeShippingProduct) {
          shippingCost = 0; // FREE shipping promotion for specific products
        } else if (has48kgLPGas) {
          shippingCost = 0; // Special promotion: FREE delivery on 48kg LP Gas
        } else if (hasLPGas) {
          shippingCost = 50; // LP Gas products: R50 Pretoria delivery only
        } else if (totalAfterDiscount >= 2500) {
          shippingCost = 0;
        }
      }
      
      // Final total includes shipping
      const finalTotal = totalAfterDiscount + shippingCost;

      // 6. Create the order with server-controlled status
      const [createdOrder] = await tx.insert(orders).values({
        deliveryMethod: request.deliveryMethod || "delivery",
        customerName: request.customerName,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
        deliveryAddress: request.deliveryAddress || null,
        deliveryCity: request.deliveryCity || null,
        deliveryProvince: request.deliveryProvince || null,
        deliveryPostalCode: request.deliveryPostalCode || null,
        paymentReference: request.paymentReference,
        paymentStatus: request.paymentStatus,
        userId: userId || null,
        subtotal: subtotalExclVat.toFixed(2),
        vat: vat.toFixed(2),
        tradeDiscount: tradeDiscount > 0 ? tradeDiscount.toFixed(2) : null,
        discountCodeId: validatedDiscountCode?.id || null,
        discountCodeValue: validatedDiscountCode?.code || null,
        discountAmount: validatedDiscountCode ? (discountCodeAmount > 0 ? discountCodeAmount.toFixed(2) : (hasFreeShippingDiscountCode ? "0.00" : null)) : null,
        shippingCost: shippingCost.toFixed(2),
        total: finalTotal.toFixed(2),
        status: "pending",
      }).returning();

      // 7. If discount code was validated and applied, increment usage count
      if (validatedDiscountCode) {
        await tx.update(discountCodes)
          .set({ usesCount: sql`${discountCodes.usesCount} + 1` })
          .where(eq(discountCodes.id, validatedDiscountCode.id));
      }

      // 8. Create order items
      const createdItems = await tx.insert(orderItems).values(
        itemsToCreate.map(item => ({
          ...item,
          orderId: createdOrder.id,
        }))
      ).returning();

      // 9. Decrement stock for each product
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

  async getOrderItemsWithProducts(orderId: string): Promise<Array<OrderItem & { productName: string; productImage: string | null }>> {
    // Fetch order items with joined product data for fallback
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        lineSubtotal: orderItems.lineSubtotal,
        storedProductName: orderItems.productName,
        storedProductImage: orderItems.productImage,
        fallbackProductName: products.name,
        fallbackProductImage: products.imageUrl,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));
    
    // Use stored name/image if available, otherwise fall back to current product data
    return items.map(item => ({
      id: item.id,
      orderId: item.orderId,
      productId: item.productId,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
      lineSubtotal: item.lineSubtotal,
      productName: item.storedProductName || item.fallbackProductName,
      productImage: item.storedProductImage || item.fallbackProductImage,
    }));
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

  // Blog Posts
  async getAllBlogPosts(): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .orderBy(desc(blogPosts.publishedAt));
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));
    return post || undefined;
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const [blogPost] = await db.insert(blogPosts).values(post).returning();
    return blogPost;
  }

  // Session Visits (Analytics)
  async logSessionVisit(visit: InsertSessionVisit): Promise<SessionVisit> {
    const [sessionVisit] = await db.insert(sessionVisits).values(visit).returning();
    return sessionVisit;
  }

  async getSessionVisitsForDate(date: Date): Promise<SessionVisit[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db
      .select()
      .from(sessionVisits)
      .where(and(
        gte(sessionVisits.createdAt, startOfDay),
        lte(sessionVisits.createdAt, endOfDay)
      ))
      .orderBy(desc(sessionVisits.createdAt));
  }

  async getSessionVisitsForDateRange(startDate: Date, endDate: Date): Promise<SessionVisit[]> {
    return await db
      .select()
      .from(sessionVisits)
      .where(and(
        gte(sessionVisits.createdAt, startDate),
        lte(sessionVisits.createdAt, endDate)
      ))
      .orderBy(desc(sessionVisits.createdAt));
  }

  async getVisitStats(date: Date): Promise<{ totalVisits: number; uniqueSessions: number; topPages: { path: string; count: number }[] }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const visits = await this.getSessionVisitsForDate(date);
    
    const uniqueSessions = new Set(visits.map(v => v.sessionId)).size;
    
    const pageCountMap = new Map<string, number>();
    visits.forEach(v => {
      pageCountMap.set(v.path, (pageCountMap.get(v.path) || 0) + 1);
    });
    
    const topPages = Array.from(pageCountMap.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalVisits: visits.length,
      uniqueSessions,
      topPages
    };
  }

  // Discount Codes
  async getAllDiscountCodes(): Promise<DiscountCode[]> {
    return await db
      .select()
      .from(discountCodes)
      .orderBy(desc(discountCodes.createdAt));
  }

  async getDiscountCodeById(id: string): Promise<DiscountCode | undefined> {
    const [code] = await db
      .select()
      .from(discountCodes)
      .where(eq(discountCodes.id, id));
    return code || undefined;
  }

  async getDiscountCodeByCode(code: string): Promise<DiscountCode | undefined> {
    const [discountCode] = await db
      .select()
      .from(discountCodes)
      .where(eq(discountCodes.code, code.toUpperCase()));
    return discountCode || undefined;
  }

  async createDiscountCode(code: InsertDiscountCode): Promise<DiscountCode> {
    const [discountCode] = await db
      .insert(discountCodes)
      .values({
        ...code,
        code: code.code.toUpperCase(),
      })
      .returning();
    return discountCode;
  }

  async updateDiscountCode(id: string, updates: Partial<InsertDiscountCode>): Promise<DiscountCode | undefined> {
    const updateData = { ...updates };
    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }
    const [updated] = await db
      .update(discountCodes)
      .set(updateData)
      .where(eq(discountCodes.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteDiscountCode(id: string): Promise<boolean> {
    const result = await db
      .delete(discountCodes)
      .where(eq(discountCodes.id, id))
      .returning();
    return result.length > 0;
  }

  async incrementDiscountCodeUsage(id: string): Promise<void> {
    await db
      .update(discountCodes)
      .set({ usesCount: sql`${discountCodes.usesCount} + 1` })
      .where(eq(discountCodes.id, id));
  }
}

export const storage = new DatabaseStorage();
