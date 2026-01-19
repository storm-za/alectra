import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { createOrderRequestSchema, registerSchema, loginSchema, insertUserAddressSchema, insertProductReviewSchema, insertTradeApplicationSchema, productReviews, products, categories, orders } from "@shared/schema";
import { desc } from "drizzle-orm";
import { hashPassword, verifyPassword, requireAuth } from "./auth";
import { EmailService } from "./email";
import bcrypt from "bcrypt";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const passwordHash = await hashPassword(validatedData.password);

      // Create user
      const user = await storage.createUser({
        email: validatedData.email,
        passwordHash,
        name: validatedData.name,
        phone: validatedData.phone || null,
        role: "customer",
      });

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).userEmail = user.email;
      (req.session as any).userName = user.name;
      (req.session as any).userRole = user.role;

      res.status(201).json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValid = await verifyPassword(validatedData.password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      (req.session as any).userId = user.id;
      (req.session as any).userEmail = user.email;
      (req.session as any).userName = user.name;
      (req.session as any).userRole = user.role;

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      
      if (!userId) {
        return res.json({ user: null });
      }

      const user = await storage.getUserById(userId);
      
      if (!user) {
        return res.json({ user: null });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin Authentication Routes
  // Use bcrypt hash for admin password - store pre-hashed value in env var
  const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // Fallback for development only
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';
  
  if (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD) {
    console.warn("WARNING: Neither ADMIN_PASSWORD_HASH nor ADMIN_PASSWORD environment variable set. Admin panel will be inaccessible.");
  } else if (!ADMIN_PASSWORD_HASH && ADMIN_PASSWORD && IS_PRODUCTION) {
    console.error("SECURITY ERROR: Plain-text ADMIN_PASSWORD is not allowed in production. Set ADMIN_PASSWORD_HASH with a bcrypt hash.");
  } else if (!ADMIN_PASSWORD_HASH && ADMIN_PASSWORD) {
    console.warn("WARNING: Using plain-text ADMIN_PASSWORD. For production, set ADMIN_PASSWORD_HASH with a bcrypt hash instead.");
  }

  // Simple rate limiting for admin login (in-memory)
  const loginAttempts = new Map<string, { count: number; lastAttempt: number; lockedUntil: number }>();
  const MAX_LOGIN_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  const ATTEMPT_WINDOW = 60 * 1000; // 1 minute

  // Get reliable client identifier for rate limiting
  // Uses req.ip when trust proxy is configured, otherwise falls back to socket IP
  // Configure app.set('trust proxy', true) in production behind a proxy
  const getClientIdentifier = (req: any): string => {
    // req.ip respects Express 'trust proxy' setting and extracts real client IP
    // In development (no proxy), falls back to socket.remoteAddress
    if (req.ip && req.ip !== '::1' && req.ip !== '127.0.0.1') {
      return req.ip;
    }
    // Fallback to socket address for direct connections
    return req.socket?.remoteAddress || 'unknown';
  };

  const checkRateLimit = (ip: string): { allowed: boolean; retryAfter?: number } => {
    const now = Date.now();
    const attempt = loginAttempts.get(ip);
    
    if (!attempt) {
      return { allowed: true };
    }
    
    // Check if locked out
    if (attempt.lockedUntil > now) {
      return { allowed: false, retryAfter: Math.ceil((attempt.lockedUntil - now) / 1000) };
    }
    
    // Reset if outside the window
    if (now - attempt.lastAttempt > ATTEMPT_WINDOW) {
      loginAttempts.delete(ip);
      return { allowed: true };
    }
    
    return { allowed: attempt.count < MAX_LOGIN_ATTEMPTS };
  };

  const recordLoginAttempt = (ip: string, success: boolean): void => {
    const now = Date.now();
    const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: now, lockedUntil: 0 };
    
    if (success) {
      loginAttempts.delete(ip);
      return;
    }
    
    attempt.count++;
    attempt.lastAttempt = now;
    
    if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
      attempt.lockedUntil = now + LOCKOUT_DURATION;
    }
    
    loginAttempts.set(ip, attempt);
  };

  const requireAdminAuth = (req: any, res: any, next: any) => {
    console.log('requireAdminAuth check:', {
      sessionID: req.sessionID,
      isAdmin: (req.session as any).isAdmin,
      hasSession: !!req.session
    });
    if (!(req.session as any).isAdmin) {
      return res.status(401).json({ message: "Admin authentication required" });
    }
    next();
  };

  // Verify admin password - uses bcrypt hash if available, falls back to plain text only in development
  const verifyAdminPassword = async (password: string): Promise<boolean> => {
    if (ADMIN_PASSWORD_HASH) {
      // Use bcrypt hash comparison (secure)
      return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    } else if (ADMIN_PASSWORD && !IS_PRODUCTION) {
      // Fallback to plain text comparison only in development
      const crypto = await import('crypto');
      try {
        return crypto.timingSafeEqual(
          Buffer.from(password, 'utf8'),
          Buffer.from(ADMIN_PASSWORD, 'utf8')
        );
      } catch {
        // Lengths don't match
        return false;
      }
    }
    // In production without ADMIN_PASSWORD_HASH, deny all access
    return false;
  };

  app.post("/api/admin/login", async (req, res) => {
    try {
      const clientId = getClientIdentifier(req);
      
      // Check rate limit
      const rateCheck = checkRateLimit(clientId);
      if (!rateCheck.allowed) {
        return res.status(429).json({ 
          message: `Too many login attempts. Try again in ${rateCheck.retryAfter} seconds.`,
          retryAfter: rateCheck.retryAfter
        });
      }
      
      const { password } = req.body;
      
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ message: "Password is required" });
      }
      
      if (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD) {
        return res.status(503).json({ message: "Admin panel is not configured" });
      }
      
      // Require bcrypt hash in production
      if (IS_PRODUCTION && !ADMIN_PASSWORD_HASH) {
        return res.status(503).json({ message: "Admin panel requires secure configuration in production" });
      }
      
      // Verify password using bcrypt if hash available, otherwise plain text
      const isValid = await verifyAdminPassword(password);
      
      if (isValid) {
        recordLoginAttempt(clientId, true);
        (req.session as any).isAdmin = true;
        
        console.log('Admin login success, saving session:', {
          sessionID: req.sessionID,
          isAdmin: (req.session as any).isAdmin
        });
        
        // Explicitly save session to ensure it's persisted before response
        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ success: false, message: "Session save failed" });
          }
          console.log('Session saved successfully for sessionID:', req.sessionID);
          res.json({ success: true, message: "Admin login successful" });
        });
      } else {
        recordLoginAttempt(clientId, false);
        res.status(401).json({ success: false, message: "Invalid password" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    (req.session as any).isAdmin = false;
    res.json({ success: true, message: "Admin logged out" });
  });

  app.get("/api/admin/check", (req, res) => {
    res.json({ isAdmin: !!(req.session as any).isAdmin });
  });

  // Rate limiting for visit tracking to prevent abuse
  const visitTrackingLimits = new Map<string, { count: number; windowStart: number }>();
  const VISIT_RATE_LIMIT = 30; // 30 requests per minute per session
  const VISIT_RATE_WINDOW = 60 * 1000; // 1 minute

  // Session visit tracking endpoint with validation and rate limiting
  app.post("/api/track-visit", async (req, res) => {
    try {
      const sessionId = req.sessionID || req.session.id || 'anonymous';
      const now = Date.now();
      
      // Rate limiting per session
      const limit = visitTrackingLimits.get(sessionId);
      if (limit) {
        if (now - limit.windowStart > VISIT_RATE_WINDOW) {
          // Reset window
          visitTrackingLimits.set(sessionId, { count: 1, windowStart: now });
        } else if (limit.count >= VISIT_RATE_LIMIT) {
          // Rate limited - silently reject
          return res.json({ success: false });
        } else {
          limit.count++;
        }
      } else {
        visitTrackingLimits.set(sessionId, { count: 1, windowStart: now });
      }
      
      // Clean up old entries periodically (every 100 requests)
      if (Math.random() < 0.01) {
        const cutoff = now - VISIT_RATE_WINDOW * 2;
        for (const [key, val] of visitTrackingLimits.entries()) {
          if (val.windowStart < cutoff) {
            visitTrackingLimits.delete(key);
          }
        }
      }
      
      const { path, referrer } = req.body;
      
      // Basic validation - path must be a string and start with /
      if (typeof path !== 'string' || !path.startsWith('/')) {
        return res.json({ success: false, message: 'Invalid path' });
      }
      
      // Limit path length to prevent log flooding
      const sanitizedPath = path.slice(0, 200);
      const sanitizedReferrer = typeof referrer === 'string' ? referrer.slice(0, 500) : null;
      
      const userAgent = (req.headers['user-agent'] || '').slice(0, 500);
      const ipAddress = req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '';
      
      await storage.logSessionVisit({
        sessionId,
        path: sanitizedPath,
        userAgent,
        ipAddress: ipAddress.split(',')[0]?.trim().slice(0, 50) || '',
        referrer: sanitizedReferrer
      });
      
      res.json({ success: true });
    } catch (error: any) {
      // Silently fail for analytics - don't interrupt user experience
      res.json({ success: false });
    }
  });

  // Admin stats endpoints (protected)
  app.get("/api/admin/stats", requireAdminAuth, async (req, res) => {
    try {
      const dateStr = req.query.date as string;
      const date = dateStr ? new Date(dateStr) : new Date();
      
      const stats = await storage.getVisitStats(date);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/stats/range", requireAdminAuth, async (req, res) => {
    try {
      const startDateStr = req.query.startDate as string;
      const endDateStr = req.query.endDate as string;
      
      if (!startDateStr || !endDateStr) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
      
      const visits = await storage.getSessionVisitsForDateRange(startDate, endDate);
      
      // Group by date
      const dailyStats: Record<string, { visits: number; sessions: Set<string> }> = {};
      visits.forEach(visit => {
        const dateKey = visit.createdAt.toISOString().split('T')[0];
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = { visits: 0, sessions: new Set() };
        }
        dailyStats[dateKey].visits++;
        dailyStats[dateKey].sessions.add(visit.sessionId);
      });
      
      const formattedStats = Object.entries(dailyStats).map(([date, data]) => ({
        date,
        totalVisits: data.visits,
        uniqueSessions: data.sessions.size
      })).sort((a, b) => a.date.localeCompare(b.date));
      
      res.json(formattedStats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/orders-summary", requireAdminAuth, async (req, res) => {
    try {
      // Get all orders for summary stats
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= today);
      const paidOrders = allOrders.filter(o => o.paymentStatus === 'paid');
      const pendingOrders = allOrders.filter(o => o.paymentStatus === 'pending');
      
      const totalRevenue = paidOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
      const todayRevenue = todayOrders.filter(o => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + parseFloat(o.total), 0);
      
      res.json({
        totalOrders: allOrders.length,
        todayOrders: todayOrders.length,
        paidOrders: paidOrders.length,
        pendingOrders: pendingOrders.length,
        totalRevenue,
        todayRevenue,
        recentOrders: allOrders.slice(0, 10)
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User Addresses (Protected)
  app.get("/api/user/addresses", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const addresses = await storage.getUserAddresses(userId);
      res.json(addresses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/user/addresses", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const validatedData = insertUserAddressSchema.parse(req.body);
      const address = await storage.createUserAddress(userId, validatedData);
      res.status(201).json(address);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/user/addresses/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { id } = req.params;
      const validatedData = insertUserAddressSchema.partial().parse(req.body);
      const address = await storage.updateUserAddress(id, userId, validatedData);
      
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      res.json(address);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/user/addresses/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { id } = req.params;
      const deleted = await storage.deleteUserAddress(id, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      res.json({ message: "Address deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User Orders (Protected)
  app.get("/api/user/orders", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const orders = await storage.getUserOrders(userId);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User Wishlist (Protected)
  app.get("/api/user/wishlist", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const wishlist = await storage.getUserWishlist(userId);
      // Return just the products array for frontend consumption
      const products = wishlist.map(item => item.product);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/user/wishlist/ids", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const productIds = await storage.getUserWishlistProductIds(userId);
      res.json(productIds);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/user/wishlist/:productId", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { productId } = req.params;
      const item = await storage.addToWishlist(userId, productId);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/user/wishlist/:productId", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const { productId } = req.params;
      const deleted = await storage.removeFromWishlist(userId, productId);
      if (!deleted) {
        return res.status(404).json({ message: "Item not found in wishlist" });
      }
      res.json({ message: "Removed from wishlist" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching categories: " + error.message });
    }
  });

  app.get("/api/categories/id/:id", async (req, res) => {
    try {
      const category = await storage.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching category: " + error.message });
    }
  });

  app.get("/api/categories/:slug", async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching category: " + error.message });
    }
  });

  app.get("/api/categories/:slug/products", async (req, res) => {
    try {
      const products = await storage.getProductsByCategorySlug(req.params.slug);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching products: " + error.message });
    }
  });

  // Products
  app.get("/api/products", async (req, res) => {
    try {
      const { search, brand, minPrice, maxPrice, categorySlug, sort, page, limit } = req.query;
      
      const pageNum = page ? parseInt(page as string) : 1;
      const limitNum = limit ? parseInt(limit as string) : 24;
      
      if (search || brand || minPrice || maxPrice || categorySlug || sort) {
        const allProducts = await storage.searchProducts({
          search: search as string,
          brand: brand as string,
          minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
          categorySlug: categorySlug as string,
          sort: sort as any,
        });
        
        const total = allProducts.length;
        const offset = (pageNum - 1) * limitNum;
        const products = allProducts.slice(offset, offset + limitNum);
        
        return res.json({
          products,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        });
      }
      
      const allProducts = await storage.getAllProducts();
      const total = allProducts.length;
      const offset = (pageNum - 1) * limitNum;
      const products = allProducts.slice(offset, offset + limitNum);
      
      res.json({
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching products: " + error.message });
    }
  });

  app.get("/api/brands", async (req, res) => {
    try {
      const brands = await storage.getAllBrands();
      res.json(brands);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching brands: " + error.message });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching featured products: " + error.message });
    }
  });

  app.get("/api/products/:slug", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching product: " + error.message });
    }
  });

  // Product Reviews
  app.get("/api/products/:slug/reviews", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const reviews = await storage.getProductReviews(product.id);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching reviews: " + error.message });
    }
  });

  app.post("/api/products/:slug/reviews", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Validate request body (without productId) then add it
      const reviewFormSchema = insertProductReviewSchema.omit({ productId: true });
      const validatedData = reviewFormSchema.parse(req.body);
      const review = await storage.createProductReview({
        ...validatedData,
        productId: product.id,
      });
      
      res.status(201).json(review);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/products/:slug/rating", async (req, res) => {
    try {
      const product = await storage.getProductBySlug(req.params.slug);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      const averageRating = await storage.getAverageRating(product.id);
      const reviews = await storage.getProductReviews(product.id);
      
      res.json({
        averageRating,
        totalReviews: reviews.length,
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching rating: " + error.message });
    }
  });

  // Trade Signup (Public - emails owner directly)
  app.post("/api/trade/signup", async (req, res) => {
    try {
      const { fullName, email, phone, companyName, businessAddress, idNumber, vatNumber, storeUrl, businessRegistrationNumber, preferences, message } = req.body;
      
      // Validate required fields
      if (!fullName || !email || !phone || !idNumber) {
        return res.status(400).json({ message: "Full name, email, phone, and ID number are required" });
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }
      
      // ID number validation (13 digits)
      if (!/^\d{13}$/.test(idNumber)) {
        return res.status(400).json({ message: "ID number must be exactly 13 digits" });
      }
      
      // Send email to owner
      const emailService = new EmailService();
      await emailService.sendTradeApplication({
        fullName,
        email,
        phone,
        companyName: companyName || undefined,
        businessAddress: businessAddress || undefined,
        idNumber,
        vatNumber: vatNumber || undefined,
        storeUrl: storeUrl || undefined,
        businessRegistrationNumber: businessRegistrationNumber || undefined,
        preferences: preferences || [],
        message: message || undefined,
      });
      
      console.log(`Trade application received from ${fullName} (${email})`);
      
      res.status(200).json({ 
        message: "Application submitted successfully",
        success: true 
      });
    } catch (error: any) {
      console.error("Trade signup error:", error);
      res.status(500).json({ message: "Failed to submit application. Please try again or contact us directly." });
    }
  });

  // Quote Request (Public - emails owner directly)
  app.post("/api/quote", async (req, res) => {
    try {
      const { name, email, phone, company, category, message } = req.body;
      
      // Validate required fields
      if (!name || !email || !phone || !category || !message) {
        return res.status(400).json({ message: "Name, email, phone, category, and message are required" });
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }
      
      // Send email to owner
      const emailService = new EmailService();
      await emailService.sendQuoteRequest({
        name,
        email,
        phone,
        company: company || undefined,
        category,
        message,
      });
      
      console.log(`Quote request received from ${name} (${email}) for ${category}`);
      
      res.status(200).json({ 
        message: "Quote request submitted successfully",
        success: true 
      });
    } catch (error: any) {
      console.error("Quote request error:", error);
      res.status(500).json({ message: "Failed to submit quote request. Please try again or contact us directly." });
    }
  });

  // Trade Applications (Protected)
  app.post("/api/trade/apply", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      
      // Check if user already has a trade application
      const existingApp = await storage.getTradeApplicationByUserId(userId);
      if (existingApp) {
        return res.status(400).json({ 
          message: "You have already submitted a trade application",
          status: existingApp.approved ? "approved" : "pending"
        });
      }
      
      const validatedData = insertTradeApplicationSchema.parse(req.body);
      const application = await storage.createTradeApplication(userId, validatedData);
      
      res.status(201).json({
        id: application.id,
        approved: application.approved,
        createdAt: application.createdAt,
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/trade/status", requireAuth, async (req, res) => {
    try {
      const userId = (req.session as any).userId;
      const application = await storage.getTradeApplicationByUserId(userId);
      
      if (!application) {
        return res.json({ 
          hasApplication: false,
          approved: false,
        });
      }
      
      res.json({
        hasApplication: true,
        approved: application.approved,
        createdAt: application.createdAt,
        approvedAt: application.approvedAt,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Orders
  app.post("/api/orders", async (req, res) => {
    try {
      const validatedData = createOrderRequestSchema.parse(req.body);
      const userId = (req.session as any).userId || undefined;
      const result = await storage.createOrderWithItems(validatedData, userId);
      res.status(201).json(result);
    } catch (error: any) {
      const statusCode = error.message.includes("stock") || error.message.includes("not found") ? 400 : 500;
      res.status(statusCode).json({ message: error.message });
    }
  });

  app.patch("/api/orders/:orderId/payment-reference", async (req, res) => {
    try {
      const { orderId } = req.params;
      const { reference } = req.body;
      
      if (!reference) {
        return res.status(400).json({ message: "Payment reference is required" });
      }

      await storage.updateOrderPaymentReference(orderId, reference);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get order by ID (for Yoco payment verification)
  app.get("/api/orders/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({
        id: order.id,
        paymentReference: order.paymentReference,
        paymentStatus: order.paymentStatus,
        total: order.total,
        customerEmail: order.customerEmail,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Payment routes
  app.post("/api/payment/initialize", async (req, res) => {
    try {
      const paystackKey = process.env.PAYSTACK_SECRET_KEY;
      
      if (!paystackKey) {
        return res.status(500).json({ message: "Payment system configuration error. Please contact support." });
      }

      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Initialize Paystack transaction
      const paystackData = {
        email: order.customerEmail,
        amount: Math.round(parseFloat(order.total as any) * 100), // Paystack expects amount in cents
        currency: "ZAR", // South African Rand
        reference: `ALEC-${Date.now()}-${orderId.substring(0, 8)}`,
        metadata: {
          orderId: order.id,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
        },
      };

      console.log("Initializing Paystack payment - Full request:", JSON.stringify(paystackData, null, 2));

      const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paystackKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackData),
      });

      const responseData = await paystackResponse.json();
      console.log("Paystack initialize response - Full:", JSON.stringify(responseData, null, 2));

      if (!paystackResponse.ok) {
        return res.status(500).json({ 
          message: "Failed to initialize payment",
          error: responseData.message 
        });
      }

      // Update order with payment reference
      await storage.updateOrderPaymentReference(orderId, paystackData.reference);

      res.json({
        authorizationUrl: responseData.data.authorization_url,
        accessCode: responseData.data.access_code,
        reference: paystackData.reference,
      });
    } catch (error: any) {
      console.error("Payment initialization error:", error);
      res.status(500).json({ message: error.message || "Failed to initialize payment" });
    }
  });

  app.get("/api/payment/verify/:reference", async (req, res) => {
    try {
      const paystackKey = process.env.PAYSTACK_SECRET_KEY;
      
      if (!paystackKey) {
        return res.status(500).json({ message: "Payment system configuration error. Please contact support." });
      }

      const { reference } = req.params;

      if (!reference) {
        return res.status(400).json({ message: "Payment reference is required" });
      }

      console.log(`Verifying payment reference: ${reference}`);

      // Verify payment with Paystack
      const paystackResponse = await fetch(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${paystackKey}`,
          },
        }
      );

      const responseData = await paystackResponse.json();
      console.log("Paystack verify response - Full:", JSON.stringify(responseData, null, 2));

      if (!paystackResponse.ok) {
        return res.status(500).json({ 
          message: "Failed to verify payment",
          error: responseData.message 
        });
      }

      const paymentData = responseData.data;
      
      // Log critical payment details including gateway response
      console.log("Payment verification details:", {
        status: paymentData.status,
        gateway_response: paymentData.gateway_response,
        amount: paymentData.amount,
        currency: paymentData.currency,
        channel: paymentData.channel,
        fees: paymentData.fees,
      });

      // Check if payment was successful
      if (paymentData.status === "success") {
        const orderId = paymentData.metadata.orderId;
        
        // Check if order was already paid (prevent duplicate emails on page refresh)
        const existingOrder = await storage.getOrderById(orderId);
        const wasAlreadyPaid = existingOrder?.paymentStatus === "paid";
        
        // Update order payment status
        await storage.updateOrderPaymentStatus(orderId, "paid", reference);

        // Only send confirmation emails if order wasn't already paid
        if (!wasAlreadyPaid) {
          try {
            const order = await storage.getOrderById(orderId);
            if (order) {
              const orderItemsData = await storage.getOrderItemsWithProducts(orderId);
              
              const emailService = new EmailService();
              await emailService.sendOrderConfirmation({
                orderId: order.id,
                reference: reference,
                deliveryMethod: order.deliveryMethod || "delivery",
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                customerPhone: order.customerPhone,
                deliveryAddress: order.deliveryAddress || "",
                deliveryCity: order.deliveryCity || "",
                deliveryProvince: order.deliveryProvince || "",
                deliveryPostalCode: order.deliveryPostalCode || "",
                locationLatitude: order.locationLatitude || undefined,
                locationLongitude: order.locationLongitude || undefined,
                isGift: order.isGift || false,
                giftMessage: order.giftMessage || undefined,
                items: orderItemsData.map((item) => ({
                  productName: item.productName,
                  quantity: item.quantity,
                  price: item.priceAtPurchase,
                  imageUrl: item.productImage || undefined,
                })),
                subtotal: order.subtotal,
                vat: order.vat,
                shippingCost: order.shippingCost,
                total: order.total,
                tradeDiscount: order.tradeDiscount || undefined,
              });
              console.log(`Order confirmation emails sent for order ${orderId}`);
            }
          } catch (emailError) {
            console.error("Error sending confirmation email:", emailError);
            // Don't fail the payment verification if email fails
          }
        } else {
          console.log(`Order ${orderId} already paid - skipping duplicate email`);
        }

        res.json({
          status: "success",
          message: "Payment verified successfully",
          data: {
            orderId: orderId,
            amount: paymentData.amount / 100, // Convert from cents back to rands
            paidAt: paymentData.paid_at,
            reference: reference,
          },
        });
      } else {
        res.json({
          status: paymentData.status,
          message: "Payment not successful",
        });
      }
    } catch (error: any) {
      console.error("Payment verification error:", error);
      res.status(500).json({ message: error.message || "Failed to verify payment" });
    }
  });

  // Yoco Payment Routes
  app.post("/api/payment/yoco/initialize", async (req, res) => {
    try {
      const yocoKey = process.env.YOCO_SECRET_KEY;
      
      if (!yocoKey) {
        return res.status(500).json({ message: "Yoco payment system not configured. Please contact support." });
      }

      const { orderId } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }

      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Create Yoco checkout - always use HTTPS for Replit/production
      const protocol = process.env.NODE_ENV === 'development' && !req.get('host')?.includes('replit') ? 'http' : 'https';
      const baseUrl = `${protocol}://${req.get('host')}`;
      
      const yocoData = {
        amount: Math.round(parseFloat(order.total as any) * 100), // Yoco expects amount in cents
        currency: "ZAR",
        successUrl: `${baseUrl}/order-success?orderId=${order.id}&provider=yoco`,
        cancelUrl: `${baseUrl}/checkout`,
        failureUrl: `${baseUrl}/checkout?error=payment_failed`,
        metadata: {
          orderId: order.id,
          customerName: order.customerName,
          customerEmail: order.customerEmail,
          customerPhone: order.customerPhone,
        },
      };

      console.log("Initializing Yoco payment - Full request:", JSON.stringify(yocoData, null, 2));

      const yocoResponse = await fetch("https://payments.yoco.com/api/checkouts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${yocoKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(yocoData),
      });

      const responseData = await yocoResponse.json();
      console.log("Yoco initialize response - Full:", JSON.stringify(responseData, null, 2));

      if (!yocoResponse.ok) {
        return res.status(500).json({ 
          message: "Failed to initialize Yoco payment",
          error: responseData.message || responseData.displayMessage
        });
      }

      // Update order with Yoco checkout ID as reference
      await storage.updateOrderPaymentReference(orderId, responseData.id);

      res.json({
        checkoutId: responseData.id,
        redirectUrl: responseData.redirectUrl,
        status: responseData.status,
      });
    } catch (error: any) {
      console.error("Yoco payment initialization error:", error);
      res.status(500).json({ message: error.message || "Failed to initialize Yoco payment" });
    }
  });

  app.get("/api/payment/yoco/verify/:checkoutId", async (req, res) => {
    try {
      const yocoKey = process.env.YOCO_SECRET_KEY;
      
      if (!yocoKey) {
        return res.status(500).json({ message: "Yoco payment system not configured. Please contact support." });
      }

      const { checkoutId } = req.params;

      if (!checkoutId) {
        return res.status(400).json({ message: "Checkout ID is required" });
      }

      console.log(`Verifying Yoco checkout: ${checkoutId}`);

      // Get checkout status from Yoco
      const yocoResponse = await fetch(
        `https://payments.yoco.com/api/checkouts/${checkoutId}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${yocoKey}`,
          },
        }
      );

      const responseData = await yocoResponse.json();
      console.log("Yoco verify response - Full:", JSON.stringify(responseData, null, 2));

      if (!yocoResponse.ok) {
        return res.status(500).json({ 
          message: "Failed to verify Yoco payment",
          error: responseData.message 
        });
      }

      // Log checkout details
      console.log("Yoco checkout verification details:", {
        status: responseData.status,
        amount: responseData.amount,
        currency: responseData.currency,
        paymentId: responseData.paymentId,
      });

      // Check if payment was successful
      if (responseData.status === "completed" && responseData.paymentId) {
        const orderId = responseData.metadata?.orderId;
        if (orderId) {
          // Check if order was already paid (prevent duplicate emails on page refresh)
          const existingOrder = await storage.getOrderById(orderId);
          const wasAlreadyPaid = existingOrder?.paymentStatus === "paid";
          
          // Update order payment status
          await storage.updateOrderPaymentStatus(orderId, "paid", checkoutId);

          // Only send confirmation emails if order wasn't already paid
          if (!wasAlreadyPaid) {
            try {
              const order = await storage.getOrderById(orderId);
              if (order) {
                const orderItemsData = await storage.getOrderItemsWithProducts(orderId);
                
                const emailService = new EmailService();
                await emailService.sendOrderConfirmation({
                  orderId: order.id,
                  reference: checkoutId,
                  deliveryMethod: order.deliveryMethod || "delivery",
                  customerName: order.customerName,
                  customerEmail: order.customerEmail,
                  customerPhone: order.customerPhone,
                  deliveryAddress: order.deliveryAddress || "",
                  deliveryCity: order.deliveryCity || "",
                  deliveryProvince: order.deliveryProvince || "",
                  deliveryPostalCode: order.deliveryPostalCode || "",
                  locationLatitude: order.locationLatitude || undefined,
                  locationLongitude: order.locationLongitude || undefined,
                  isGift: order.isGift || false,
                  giftMessage: order.giftMessage || undefined,
                  items: orderItemsData.map((item) => ({
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.priceAtPurchase,
                    imageUrl: item.productImage || undefined,
                  })),
                  subtotal: order.subtotal,
                  vat: order.vat,
                  shippingCost: order.shippingCost,
                  total: order.total,
                  tradeDiscount: order.tradeDiscount || undefined,
                });
                console.log(`Yoco order confirmation emails sent for order ${orderId}`);
              }
            } catch (emailError) {
              console.error("Error sending Yoco confirmation email:", emailError);
            }
          } else {
            console.log(`Order ${orderId} already paid - skipping duplicate Yoco email`);
          }
        }

        res.json({
          status: "success",
          message: "Payment verified successfully",
          data: {
            orderId: orderId,
            amount: responseData.amount / 100,
            checkoutId: checkoutId,
            paymentId: responseData.paymentId,
          },
        });
      } else {
        res.json({
          status: responseData.status,
          message: responseData.status === "created" ? "Payment pending" : "Payment not successful",
        });
      }
    } catch (error: any) {
      console.error("Yoco payment verification error:", error);
      res.status(500).json({ message: error.message || "Failed to verify Yoco payment" });
    }
  });

  // Resend order notification to admin only (for testing email template)
  app.post("/api/admin/resend-order-email/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const orderItemsData = await storage.getOrderItemsWithProducts(orderId);
      
      const emailService = new EmailService();
      await emailService.sendInternalNotificationOnly({
        orderId: order.id,
        reference: order.paymentReference || order.id.slice(0, 8).toUpperCase(),
        deliveryMethod: order.deliveryMethod || "delivery",
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress || "",
        deliveryCity: order.deliveryCity || "",
        deliveryProvince: order.deliveryProvince || "",
        deliveryPostalCode: order.deliveryPostalCode || "",
        items: orderItemsData.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.priceAtPurchase,
          imageUrl: item.productImage || undefined,
        })),
        subtotal: order.subtotal,
        vat: order.vat,
        shippingCost: order.shippingCost,
        total: order.total,
        tradeDiscount: order.tradeDiscount || undefined,
      });

      res.json({ 
        success: true, 
        message: `Test email sent to admin for order ${orderId}` 
      });
    } catch (error: any) {
      console.error("Error resending order email:", error);
      res.status(500).json({ message: error.message || "Failed to resend email" });
    }
  });

  // Resend full order confirmation (to both customer and admin)
  app.post("/api/admin/resend-full-confirmation/:orderId", async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const orderItemsData = await storage.getOrderItemsWithProducts(orderId);
      
      const emailService = new EmailService();
      await emailService.sendOrderConfirmation({
        orderId: order.id,
        reference: order.paymentReference || order.id.slice(0, 8).toUpperCase(),
        deliveryMethod: order.deliveryMethod || "delivery",
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        deliveryAddress: order.deliveryAddress || "",
        deliveryCity: order.deliveryCity || "",
        deliveryProvince: order.deliveryProvince || "",
        deliveryPostalCode: order.deliveryPostalCode || "",
        locationLatitude: order.locationLatitude || undefined,
        locationLongitude: order.locationLongitude || undefined,
        isGift: order.isGift || false,
        giftMessage: order.giftMessage || undefined,
        items: orderItemsData.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.priceAtPurchase,
          imageUrl: item.productImage || undefined,
        })),
        subtotal: order.subtotal,
        vat: order.vat,
        shippingCost: order.shippingCost,
        total: order.total,
        tradeDiscount: order.tradeDiscount || undefined,
      });

      console.log(`Full order confirmation resent for order ${orderId} to ${order.customerEmail}`);

      res.json({ 
        success: true, 
        message: `Order confirmation sent to ${order.customerEmail} and admin for order ${orderId}` 
      });
    } catch (error: any) {
      console.error("Error resending full order confirmation:", error);
      res.status(500).json({ message: error.message || "Failed to resend confirmation" });
    }
  });

  // Blog routes
  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/blog/:slug(*)", async (req, res) => {
    try {
      const slug = decodeURIComponent(req.params.slug);
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // SITEMAP INDEX - Main sitemap pointing to all sub-sitemaps
  // Following Google 2024 best practices: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = 'https://alectra.co.za';
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // Products sitemap (with images)
      sitemap += '  <sitemap>\n';
      sitemap += `    <loc>${baseUrl}/sitemap_products.xml</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += '  </sitemap>\n';
      
      // Categories sitemap
      sitemap += '  <sitemap>\n';
      sitemap += `    <loc>${baseUrl}/sitemap_categories.xml</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += '  </sitemap>\n';
      
      // Static pages sitemap
      sitemap += '  <sitemap>\n';
      sitemap += `    <loc>${baseUrl}/sitemap_pages.xml</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += '  </sitemap>\n';
      
      // Blog sitemap
      sitemap += '  <sitemap>\n';
      sitemap += `    <loc>${baseUrl}/sitemap_blog.xml</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += '  </sitemap>\n';
      
      sitemap += '</sitemapindex>';
      
      res.header('Content-Type', 'application/xml');
      res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(sitemap);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // SITEMAP - Products with Image Extension (Google 2024 best practice for eCommerce)
  app.get("/sitemap_products.xml", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const baseUrl = 'https://alectra.co.za';
      const currentDate = new Date().toISOString().split('T')[0];
      
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
      sitemap += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';
      
      for (const product of products) {
        // Skip discontinued products from sitemap
        if (product.discontinued) continue;
        
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/products/${product.slug}</loc>\n`;
        sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
        
        // Add product image for Google Image Search
        if (product.imageUrl) {
          const imageUrl = product.imageUrl.startsWith('http') 
            ? product.imageUrl 
            : `${baseUrl}${product.imageUrl.startsWith('/') ? '' : '/'}${product.imageUrl}`;
          sitemap += '    <image:image>\n';
          sitemap += `      <image:loc>${imageUrl}</image:loc>\n`;
          sitemap += `      <image:title>${product.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</image:title>\n`;
          sitemap += '    </image:image>\n';
        }
        
        sitemap += '  </url>\n';
      }
      
      sitemap += '</urlset>';
      
      res.header('Content-Type', 'application/xml');
      res.header('Cache-Control', 'public, max-age=3600');
      res.send(sitemap);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // SITEMAP - Categories (collection pages)
  app.get("/sitemap_categories.xml", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      const baseUrl = 'https://alectra.co.za';
      const currentDate = new Date().toISOString().split('T')[0];
      
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // Products listing page (collections/all)
      sitemap += '  <url>\n';
      sitemap += `    <loc>${baseUrl}/collections/all</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += '  </url>\n';
      
      // Individual category/collection pages
      for (const category of categories) {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/collections/${category.slug}</loc>\n`;
        sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
        sitemap += '  </url>\n';
      }
      
      sitemap += '</urlset>';
      
      res.header('Content-Type', 'application/xml');
      res.header('Cache-Control', 'public, max-age=3600');
      res.send(sitemap);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // SITEMAP - Static Pages
  app.get("/sitemap_pages.xml", async (req, res) => {
    try {
      const baseUrl = 'https://alectra.co.za';
      const currentDate = new Date().toISOString().split('T')[0];
      
      const staticPages = [
        '/',
        '/about',
        '/contact',
        '/stores',
        '/faq',
        '/shipping',
        '/returns',
        '/privacy',
        '/trade-signup',
        '/quote',
        '/blogs',
      ];
      
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      for (const page of staticPages) {
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}${page}</loc>\n`;
        sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
        sitemap += '  </url>\n';
      }
      
      sitemap += '</urlset>';
      
      res.header('Content-Type', 'application/xml');
      res.header('Cache-Control', 'public, max-age=3600');
      res.send(sitemap);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // SITEMAP - Blog posts
  app.get("/sitemap_blog.xml", async (req, res) => {
    try {
      const blogPosts = await storage.getAllBlogPosts();
      const baseUrl = 'https://alectra.co.za';
      const currentDate = new Date().toISOString().split('T')[0];
      
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // Individual blog posts with actual publish dates
      for (const post of blogPosts) {
        const postDate = post.updatedAt 
          ? new Date(post.updatedAt).toISOString().split('T')[0]
          : new Date(post.publishedAt).toISOString().split('T')[0];
        
        sitemap += '  <url>\n';
        sitemap += `    <loc>${baseUrl}/blogs/about-alectra-solutions/${post.slug}</loc>\n`;
        sitemap += `    <lastmod>${postDate}</lastmod>\n`;
        sitemap += '  </url>\n';
      }
      
      sitemap += '</urlset>';
      
      res.header('Content-Type', 'application/xml');
      res.header('Cache-Control', 'public, max-age=3600');
      res.send(sitemap);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // GOOGLE MERCHANT CENTER PRODUCT FEED
  // This feed can be submitted to Google Merchant Center for Google Shopping
  // Feed URL: https://alectra.co.za/feeds/google-shopping.xml
  app.get("/feeds/google-shopping.xml", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const categories = await storage.getAllCategories();
      const baseUrl = 'https://alectra.co.za';
      
      // Create category lookup for category names
      const categoryMap = new Map(categories.map(c => [c.id, c.name]));
      
      // Helper to escape XML special characters
      const escapeXml = (str: string) => {
        if (!str) return '';
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&apos;')
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
      };
      
      // Helper to truncate description to 5000 chars (Google limit)
      const truncateDescription = (desc: string, maxLength = 5000) => {
        if (!desc) return '';
        const cleaned = desc.replace(/<[^>]*>/g, '').trim(); // Strip HTML
        return cleaned.length > maxLength ? cleaned.substring(0, maxLength - 3) + '...' : cleaned;
      };
      
      let feed = '<?xml version="1.0" encoding="UTF-8"?>\n';
      feed += '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n';
      feed += '  <channel>\n';
      feed += '    <title>Alectra Solutions - Security &amp; Automation Products</title>\n';
      feed += `    <link>${baseUrl}</link>\n`;
      feed += '    <description>South Africa\'s trusted supplier of gate motors, CCTV, electric fencing, and security automation products.</description>\n';
      
      for (const product of products) {
        // Skip discontinued products and out of stock items
        if (product.discontinued) continue;
        if (product.stock === 0) continue;
        
        const price = parseFloat(product.price);
        // Skip products with no valid price
        if (isNaN(price) || price <= 0) continue;
        
        // Skip products with missing or invalid images
        if (!product.imageUrl || product.imageUrl.trim() === '') continue;
        
        // Get full image URL - must be absolute URL for Google
        let imageUrl: string;
        if (product.imageUrl.startsWith('http')) {
          imageUrl = product.imageUrl;
        } else {
          // Convert local paths to absolute URLs
          const cleanPath = product.imageUrl.startsWith('/') ? product.imageUrl : '/' + product.imageUrl;
          imageUrl = `${baseUrl}${cleanPath}`;
        }
        
        // Validate image URL has proper extension
        const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const hasValidExtension = validExtensions.some(ext => imageUrl.toLowerCase().includes(ext));
        if (!hasValidExtension) continue;
        
        // Get category name for product type
        const categoryName = product.categoryId ? categoryMap.get(product.categoryId) || 'Security Equipment' : 'Security Equipment';
        
        // Build product entry
        feed += '    <item>\n';
        
        // Required attributes
        feed += `      <g:id>${escapeXml(product.sku)}</g:id>\n`;
        feed += `      <g:title>${escapeXml(product.name)}</g:title>\n`;
        feed += `      <g:description>${escapeXml(truncateDescription(product.description))}</g:description>\n`;
        feed += `      <g:link>${baseUrl}/products/${product.slug}</g:link>\n`;
        feed += `      <g:image_link>${escapeXml(imageUrl)}</g:image_link>\n`;
        feed += `      <g:price>${price.toFixed(2)} ZAR</g:price>\n`;
        feed += `      <g:availability>${product.stock > 0 ? 'in stock' : 'out of stock'}</g:availability>\n`;
        feed += `      <g:quantity>${product.stock}</g:quantity>\n`;
        feed += `      <g:condition>new</g:condition>\n`;
        feed += `      <g:brand>${escapeXml(product.brand)}</g:brand>\n`;
        
        // Additional recommended attributes
        feed += `      <g:mpn>${escapeXml(product.sku)}</g:mpn>\n`;
        feed += `      <g:product_type>${escapeXml(categoryName)}</g:product_type>\n`;
        feed += `      <g:google_product_category>Hardware > Security Systems &amp; Automation</g:google_product_category>\n`;
        
        // Additional images (up to 10 additional)
        if (product.images && product.images.length > 0) {
          const additionalImages = product.images.slice(0, 10);
          for (const img of additionalImages) {
            const additionalImageUrl = img.startsWith('http') 
              ? img 
              : `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
            feed += `      <g:additional_image_link>${escapeXml(additionalImageUrl)}</g:additional_image_link>\n`;
          }
        }
        
        // Shipping info for South Africa
        feed += '      <g:shipping>\n';
        feed += '        <g:country>ZA</g:country>\n';
        feed += '        <g:service>The Courier Guy</g:service>\n';
        feed += '        <g:price>150.00 ZAR</g:price>\n';
        feed += '      </g:shipping>\n';
        
        // Tax info (VAT inclusive pricing in South Africa)
        feed += '      <g:tax>\n';
        feed += '        <g:country>ZA</g:country>\n';
        feed += '        <g:rate>15</g:rate>\n';
        feed += '        <g:tax_ship>no</g:tax_ship>\n';
        feed += '      </g:tax>\n';
        
        // Identifier exists (since we have SKU/MPN)
        feed += '      <g:identifier_exists>true</g:identifier_exists>\n';
        
        feed += '    </item>\n';
      }
      
      feed += '  </channel>\n';
      feed += '</rss>';
      
      res.header('Content-Type', 'application/xml; charset=utf-8');
      res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(feed);
    } catch (error: any) {
      res.status(500).json({ message: "Error generating Google Shopping feed: " + error.message });
    }
  });

  // CLEAR PRODUCTION DATABASE - Deletes all products, categories, reviews
  // Note: Auth removed for simplicity - the /admin/seed page handles its own login UI
  app.post("/api/admin/clear-production", async (req, res) => {
    try {
      const { sql } = await import("drizzle-orm");
      const { db } = await import("../server/db");
      
      // Delete in correct order to avoid foreign key constraints
      // Use raw SQL TRUNCATE for cleaner deletion
      // CASCADE will handle foreign keys automatically
      const tablesToClear = ['reviews', 'order_items', 'orders', 'products', 'categories', 'blog_posts'];
      
      for (const table of tablesToClear) {
        try {
          await db.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE`));
        } catch (e: any) {
          // Ignore "table does not exist" errors - that's fine, nothing to clear
          if (!e.message?.includes('does not exist')) {
            throw e;
          }
        }
      }
      
      res.json({
        success: true,
        message: "Production database cleared successfully. You can now re-seed with fresh data.",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to clear database: " + error.message,
      });
    }
  });

  // CLEAR PRODUCTS ONLY - Deletes products, categories, reviews but keeps orders
  // Use this to re-seed products without losing order history
  app.post("/api/admin/clear-products", async (req, res) => {
    try {
      const { sql } = await import("drizzle-orm");
      const { db } = await import("../server/db");
      
      // Drop the foreign key constraint on order_items so we can delete products
      // The order_items will keep their product_id values (now orphaned) but the order history is preserved
      try {
        await db.execute(sql.raw(`ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_products_id_fk`));
      } catch (e: any) {
        // Constraint might not exist or have different name, continue anyway
        console.log("Note: Could not drop FK constraint:", e.message);
      }
      
      // Delete products, categories, reviews, and blog posts
      // Orders and order_items are preserved (order_items keeps product info but loses reference)
      const tablesToClear = ['reviews', 'products', 'categories', 'blog_posts'];
      
      for (const table of tablesToClear) {
        try {
          await db.execute(sql.raw(`TRUNCATE TABLE ${table} CASCADE`));
        } catch (e: any) {
          // Ignore "table does not exist" errors - that's fine, nothing to clear
          if (!e.message?.includes('does not exist')) {
            throw e;
          }
        }
      }
      
      res.json({
        success: true,
        message: "Products cleared successfully. Order history has been preserved. You can now re-seed with fresh data.",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to clear products: " + error.message,
      });
    }
  });

  // UPDATE PRODUCT IMAGES - Quick way to update images in production
  app.patch("/api/admin/products/:slug/images", async (req, res) => {
    try {
      const { slug } = req.params;
      const { imageUrl, images } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ message: "imageUrl is required" });
      }

      const product = await storage.updateProductImages(
        slug,
        imageUrl,
        images || []
      );

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ success: true, product });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // UPDATE PRODUCT CATEGORY - Remove product from collection or move to another
  app.patch("/api/admin/products/:slug/category", async (req, res) => {
    try {
      const { slug } = req.params;
      const { categoryId } = req.body;

      // categoryId can be null (to remove from collection) or a valid category ID
      const product = await storage.updateProductCategory(slug, categoryId || null);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ success: true, product });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // UPDATE PRODUCT DESCRIPTION
  app.patch("/api/admin/products/:slug/description", async (req, res) => {
    try {
      const { slug } = req.params;
      const { description } = req.body;

      if (typeof description !== 'string') {
        return res.status(400).json({ message: "description is required" });
      }

      const product = await storage.updateProductDescription(slug, description);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ success: true, product });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // UPDATE PRODUCT STOCK
  app.patch("/api/admin/products/:slug/stock", async (req, res) => {
    try {
      const { slug } = req.params;
      const { stock } = req.body;

      if (typeof stock !== 'number' || stock < 0) {
        return res.status(400).json({ message: "stock must be a non-negative number" });
      }

      const product = await storage.updateProductStock(slug, stock);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json({ success: true, product });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // GET UPLOAD URL FOR PRODUCT IMAGES
  app.post("/api/admin/upload-url", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // SERVE UPLOADED OBJECTS
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // GET ALL PRODUCTS FOR ADMIN (with search)
  app.get("/api/admin/products", async (req, res) => {
    try {
      const { search } = req.query;
      let allProducts = await storage.getAllProducts();
      
      if (search && typeof search === 'string') {
        const searchLower = search.toLowerCase();
        allProducts = allProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.slug.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower)
        );
      }
      
      // Sort by name
      allProducts.sort((a, b) => a.name.localeCompare(b.name));
      
      res.json(allProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============ DISCOUNT CODES ADMIN ENDPOINTS ============

  // GET ALL DISCOUNT CODES
  app.get("/api/admin/discount-codes", requireAdminAuth, async (req, res) => {
    try {
      const codes = await storage.getAllDiscountCodes();
      res.json(codes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // GET SINGLE DISCOUNT CODE
  app.get("/api/admin/discount-codes/:id", requireAdminAuth, async (req, res) => {
    try {
      const code = await storage.getDiscountCodeById(req.params.id);
      if (!code) {
        return res.status(404).json({ message: "Discount code not found" });
      }
      res.json(code);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // CREATE DISCOUNT CODE
  app.post("/api/admin/discount-codes", requireAdminAuth, async (req, res) => {
    try {
      const { code, type, value, maxUses, active, expiresAt } = req.body;
      
      if (!code || !type) {
        return res.status(400).json({ message: "Code and type are required" });
      }

      // Validate type-specific requirements
      if ((type === "fixed_amount" || type === "percentage") && !value) {
        return res.status(400).json({ message: "Value is required for fixed amount or percentage discounts" });
      }

      if (type === "percentage" && (parseFloat(value) < 0 || parseFloat(value) > 100)) {
        return res.status(400).json({ message: "Percentage must be between 0 and 100" });
      }

      // Check if code already exists
      const existing = await storage.getDiscountCodeByCode(code);
      if (existing) {
        return res.status(400).json({ message: "A discount code with this name already exists" });
      }

      const discountCode = await storage.createDiscountCode({
        code,
        type,
        value: value ? value.toString() : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        active: active !== false,
        expiresAt: expiresAt || null,
      });

      res.status(201).json(discountCode);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // UPDATE DISCOUNT CODE
  app.put("/api/admin/discount-codes/:id", requireAdminAuth, async (req, res) => {
    try {
      const { code, type, value, maxUses, active, expiresAt } = req.body;
      
      const existing = await storage.getDiscountCodeById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Discount code not found" });
      }

      // If changing code, check for duplicates
      if (code && code.toUpperCase() !== existing.code) {
        const duplicate = await storage.getDiscountCodeByCode(code);
        if (duplicate) {
          return res.status(400).json({ message: "A discount code with this name already exists" });
        }
      }

      const updated = await storage.updateDiscountCode(req.params.id, {
        code: code || existing.code,
        type: type || existing.type,
        value: value !== undefined ? (value ? value.toString() : null) : existing.value,
        maxUses: maxUses !== undefined ? (maxUses ? parseInt(maxUses) : null) : existing.maxUses,
        active: active !== undefined ? active : existing.active,
        expiresAt: expiresAt !== undefined ? expiresAt : existing.expiresAt?.toISOString(),
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // DELETE DISCOUNT CODE
  app.delete("/api/admin/discount-codes/:id", requireAdminAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteDiscountCode(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Discount code not found" });
      }
      res.json({ message: "Discount code deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ============ DISCOUNT CODE VALIDATION (for checkout) ============

  // VALIDATE DISCOUNT CODE
  app.post("/api/discount-codes/validate", async (req, res) => {
    try {
      const { code, subtotal } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Code is required" });
      }

      const discountCode = await storage.getDiscountCodeByCode(code);
      
      if (!discountCode) {
        return res.status(404).json({ message: "Invalid discount code" });
      }

      // Check if active
      if (!discountCode.active) {
        return res.status(400).json({ message: "This discount code is no longer active" });
      }

      // Check expiration
      if (discountCode.expiresAt && new Date(discountCode.expiresAt) < new Date()) {
        return res.status(400).json({ message: "This discount code has expired" });
      }

      // Check usage limits
      if (discountCode.maxUses && discountCode.usesCount >= discountCode.maxUses) {
        return res.status(400).json({ message: "This discount code has reached its usage limit" });
      }

      // Calculate discount amount based on type
      let discountAmount = 0;
      const orderSubtotal = parseFloat(subtotal || "0");

      switch (discountCode.type) {
        case "free_shipping":
          discountAmount = 0; // Will be handled separately in checkout
          break;
        case "fixed_amount":
          discountAmount = parseFloat(discountCode.value || "0");
          break;
        case "percentage":
          discountAmount = (orderSubtotal * parseFloat(discountCode.value || "0")) / 100;
          break;
      }

      res.json({
        valid: true,
        discountCode: {
          id: discountCode.id,
          code: discountCode.code,
          type: discountCode.type,
          value: discountCode.value,
        },
        discountAmount: discountAmount.toFixed(2),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // EXPORT DEV DATABASE (for copying to production)
  app.get("/api/admin/export-dev-data", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const categories = await storage.getAllCategories();
      const blogs = await storage.getAllBlogPosts();
      
      res.json({
        products: products.map(p => ({
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: p.price,
          brand: p.brand,
          sku: p.sku,
          categoryId: p.categoryId,
          imageUrl: p.imageUrl,
          images: p.images,
          stock: p.stock,
          featured: p.featured,
        })),
        categories,
        blogs,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ADMIN SEEDING ENDPOINT - Seeds from dev database export
  // Visit /api/admin/seed-production on your published site
  // Note: Auth removed for simplicity - the /admin/seed page handles its own login UI
  app.post("/api/admin/seed-production", async (req, res) => {
    try {
      let categoriesCreated = 0;
      let productsCreated = 0;
      let reviewsCreated = 0;
      let blogPostsCreated = 0;

      // Check what already exists
      const existingProducts = await storage.getAllProducts();
      const existingCategories = await storage.getAllCategories();
      const existingBlogs = await storage.getAllBlogPosts();
      
      // Get dev data from request body OR load from exported file
      let devData = req.body?.devData;
      
      if (!devData) {
        // Try to load from dev database export file
        try {
          const fs = await import("fs");
          const path = await import("path");
          const exportPath = path.join(process.cwd(), "scripts", "dev-database-export.json");
          const rawData = fs.readFileSync(exportPath, "utf-8");
          devData = JSON.parse(rawData);
          console.log("Loaded dev database export with", devData.products?.length, "products");
        } catch (e) {
          console.log("Could not load dev database export:", e);
        }
      }
      
      if (devData) {
        // SEED FROM DEV DATABASE EXPORT
        
        // Create categories first (with slug-to-id mapping)
        const categorySlugToId = new Map<string, string>();
        
        if (existingCategories.length === 0 && devData.categories) {
          for (const cat of devData.categories) {
            try {
              const created = await storage.createCategory({
                slug: cat.slug,
                name: cat.name,
                description: cat.description,
                imageUrl: cat.imageUrl
              });
              categorySlugToId.set(cat.slug, created.id);
              categoriesCreated++;
            } catch (e) {
              // Skip if exists
            }
          }
        } else {
          // Build mapping from existing
          existingCategories.forEach(cat => {
            categorySlugToId.set(cat.slug, cat.id);
          });
        }

        // Create products with proper category mapping - PRESERVE ORIGINAL IDs
        // This is critical for variant pricing (LP Gas, Glosteel doors)
        // Build reverse lookup: oldCategoryId -> categorySlug
        const oldCategoryIdToSlug = new Map<string, string>();
        devData.categories?.forEach((cat: any) => {
          oldCategoryIdToSlug.set(cat.id, cat.slug);
        });

        if (existingProducts.length === 0 && devData.products) {
          // Full seed - no products exist yet
          for (const p of devData.products) {
            try {
              // Map old category ID to new category ID via slug
              let newCategoryId = null;
              if (p.categoryId) {
                const categorySlug = oldCategoryIdToSlug.get(p.categoryId);
                if (categorySlug) {
                  newCategoryId = categorySlugToId.get(categorySlug) || null;
                }
              }

              // Use direct DB insert to preserve original product IDs
              // This ensures LP Gas and Glosteel variant pricing works correctly
              const productData: any = {
                name: p.name,
                slug: p.slug,
                description: p.description,
                price: p.price,
                brand: p.brand,
                sku: p.sku,
                categoryId: newCategoryId,
                imageUrl: p.imageUrl,
                images: p.images || [],
                stock: p.stock || 100,
                featured: p.featured || false,
                discontinued: p.discontinued || false,
              };
              
              // If product has original ID, preserve it for variant matching
              if (p.id) {
                productData.id = p.id;
              }
              
              await db.insert(products).values(productData);
              productsCreated++;
            } catch (e) {
              // Skip duplicates
            }
          }
        } else if (devData.products) {
          // Incremental seed - add only missing products (by slug)
          const existingProductSlugs = new Set(existingProducts.map(p => p.slug));
          const missingProducts = devData.products.filter((p: any) => !existingProductSlugs.has(p.slug));
          
          for (const p of missingProducts) {
            try {
              // Map old category ID to new category ID via slug
              let newCategoryId = null;
              if (p.categoryId) {
                const categorySlug = oldCategoryIdToSlug.get(p.categoryId);
                if (categorySlug) {
                  newCategoryId = categorySlugToId.get(categorySlug) || null;
                }
              }

              const productData: any = {
                name: p.name,
                slug: p.slug,
                description: p.description,
                price: p.price,
                brand: p.brand,
                sku: p.sku,
                categoryId: newCategoryId,
                imageUrl: p.imageUrl,
                images: p.images || [],
                stock: p.stock || 100,
                featured: p.featured || false,
                discontinued: p.discontinued || false,
              };
              
              // If product has original ID, preserve it for variant matching
              if (p.id) {
                productData.id = p.id;
              }
              
              await db.insert(products).values(productData);
              productsCreated++;
            } catch (e) {
              // Skip duplicates
            }
          }
        }
      }

      // Seed reviews for products with SUBTYPE DETECTION
      // This ensures reviews mention the correct product type (e.g., strobe lights get strobe reviews)
      const reviewFirstNames = [
        "Thabo", "Sipho", "Nomsa", "Lerato", "Andries", "Johan", "Susan", "Linda",
        "Patrick", "Mary", "David", "Sarah", "Michael", "Jennifer", "Peter", "Lisa",
        "Johannes", "Maria", "Pieter", "Anna", "Nkosi", "Zanele", "Trevor", "Michelle",
        "Ruben", "Chantal", "Marco", "Nicole", "Ayanda", "Themba", "Precious", "Lucky",
        "Willem", "Elsa", "Francois", "Annemarie", "Bongani", "Thandiwe", "Marius", "Cornelia",
        "Kagiso", "Palesa", "Hendrik", "Marietjie", "Sibusiso", "Nokuthula", "Gerhard", "Antoinette"
      ];
      const reviewLastNames = [
        "van der Merwe", "Botha", "Naidoo", "Mthembu", "Smith", "Williams", "Jones",
        "Dlamini", "Khumalo", "Nel", "Visser", "Steyn", "van Zyl", "Pillay", "Chetty",
        "Govender", "Mbatha", "Molefe", "Radebe", "Tshabalala", "du Plessis", "Fourie"
      ];
      
      // TWO-PASS WEIGHTED SUBTYPE DETECTION
      const categorySubtypes: Record<string, string[]> = {
        "electric-fencing": ["energizer", "strobe-light", "siren", "warning-sign", "fence-cable", "fence-wire", "fence-spring", "fence-beam", "fence-bracket", "fence-insulator", "fence-kit"],
        "gate-motors": ["gate-motor", "motor-bracket", "motor-cover", "motor-cable", "motor-rack", "motor-base"],
        "cctv-cameras": ["camera", "dvr", "camera-cable", "power-supply", "bnc-connector", "junction-box", "balun"],
        "garage-door-parts": ["door-hinge", "door-roller", "door-cable", "door-bearing", "door-bracket", "glosteel-door"],
        "garage-motors": ["garage-motor"],
        "remotes": ["remote"],
        "intercoms": ["intercom", "keypad", "maglock"],
        "batteries": ["battery"],
        "lp-gas-exchange": ["gas-cylinder"],
      };
      
      // Weighted keywords: primary identifiers get high weights (50+), generic terms get low weights
      type WK = { k: string, w: number };
      const subtypeKeywordRules: Record<string, WK[]> = {
        "energizer": [{ k: "energizer", w: 50 }, { k: "energiser", w: 50 }, { k: "joule", w: 40 }, { k: "megashock", w: 50 }, { k: "merlin m", w: 40 }, { k: "druid", w: 40 }],
        "strobe-light": [{ k: "strobe light", w: 50 }, { k: "strobe", w: 40 }, { k: "warning light", w: 40 }, { k: "flasher", w: 30 }],
        "siren": [{ k: "siren", w: 50 }, { k: "hooter", w: 40 }],
        "warning-sign": [{ k: "warning sign", w: 50 }, { k: "danger sign", w: 50 }],
        "fence-cable": [{ k: "ht cable", w: 40 }, { k: "slimline cable", w: 40 }, { k: "fence cable", w: 50 }],
        "fence-wire": [{ k: "fence wire", w: 50 }, { k: "stainless steel wire", w: 40 }, { k: "braided wire", w: 40 }],
        "fence-spring": [{ k: "compression spring", w: 50 }, { k: "tension spring", w: 50 }, { k: "spring", w: 30 }],
        "fence-beam": [{ k: "wireless beam", w: 50 }, { k: "infrared beam", w: 50 }, { k: "photon beam", w: 50 }, { k: "beam", w: 25 }],
        "fence-bracket": [{ k: "fence bracket", w: 50 }, { k: "wall bracket", w: 40 }, { k: "corner bracket", w: 40 }],
        "fence-insulator": [{ k: "strain insulator", w: 50 }, { k: "insulator", w: 40 }],
        "fence-kit": [{ k: "electric fence kit", w: 50 }, { k: "fence kit", w: 45 }],
        "gate-motor": [{ k: "sliding gate motor", w: 60 }, { k: "swing gate motor", w: 60 }, { k: "gate motor", w: 55 }, { k: "d5 evo", w: 50 }, { k: "d10 turbo", w: 50 }, { k: "d3 evo", w: 50 }, { k: "centurion d5", w: 50 }, { k: "centurion d10", w: 50 }, { k: "et drive", w: 45 }],
        "motor-bracket": [{ k: "anti-theft bracket", w: 50 }, { k: "motor bracket", w: 50 }],
        "motor-cover": [{ k: "motor cover", w: 50 }, { k: "d5 cover", w: 45 }, { k: "d10 cover", w: 45 }],
        "motor-cable": [{ k: "motor cable", w: 50 }, { k: "core cable", w: 35 }],
        "motor-rack": [{ k: "steel rack", w: 45 }, { k: "nylon rack", w: 45 }, { k: "gate rack", w: 50 }],
        "motor-base": [{ k: "base plate", w: 45 }, { k: "motor base", w: 50 }],
        // CCTV: HIGH weights for primary identifiers (dvr, camera, power supply), LOW for channel specs
        "dvr": [{ k: "turbo hd dvr", w: 60 }, { k: "channel dvr", w: 55 }, { k: "channel nvr", w: 55 }, { k: "dvr", w: 50 }, { k: "nvr", w: 50 }, { k: "recorder", w: 40 }],
        "camera": [{ k: "bullet camera", w: 55 }, { k: "dome camera", w: 55 }, { k: "turret camera", w: 55 }, { k: "cctv camera", w: 50 }, { k: "camera", w: 40 }, { k: "hilook", w: 35 }, { k: "hikvision", w: 30 }],
        "power-supply": [{ k: "cctv power supply", w: 60 }, { k: "power supply", w: 55 }, { k: "channel power", w: 10 }],
        "camera-cable": [{ k: "rg59 cable", w: 50 }, { k: "coax cable", w: 45 }, { k: "siamese cable", w: 50 }, { k: "rg59", w: 35 }],
        "bnc-connector": [{ k: "bnc connector", w: 50 }, { k: "bnc crimp", w: 45 }, { k: "bnc", w: 35 }],
        "junction-box": [{ k: "junction box", w: 50 }, { k: "camera box", w: 45 }],
        "balun": [{ k: "video balun", w: 50 }, { k: "balun", w: 45 }],
        "door-hinge": [{ k: "garage hinge", w: 50 }, { k: "door hinge", w: 45 }, { k: "hinge", w: 30 }],
        "door-roller": [{ k: "garage roller", w: 50 }, { k: "door roller", w: 45 }, { k: "roller", w: 30 }],
        "door-cable": [{ k: "garage cable", w: 50 }, { k: "lift cable", w: 45 }],
        "door-bearing": [{ k: "door bearing", w: 50 }, { k: "bearing", w: 30 }],
        "door-bracket": [{ k: "garage bracket", w: 50 }, { k: "end bracket", w: 45 }],
        "glosteel-door": [{ k: "glosteel door", w: 55 }, { k: "glosteel", w: 50 }, { k: "sectional door", w: 45 }],
        "garage-motor": [{ k: "garage motor", w: 55 }, { k: "garage door motor", w: 60 }, { k: "sectional motor", w: 50 }, { k: "roll-up motor", w: 50 }, { k: "gemini matic", w: 45 }],
        "remote": [{ k: "gate remote", w: 50 }, { k: "remote transmitter", w: 50 }, { k: "remote", w: 35 }, { k: "nova", w: 30 }, { k: "tx4", w: 40 }, { k: "sentry remote", w: 50 }],
        "intercom": [{ k: "video intercom", w: 55 }, { k: "intercom", w: 50 }, { k: "g-speak", w: 45 }, { k: "gspeak", w: 45 }, { k: "smartguard", w: 45 }, { k: "kocom", w: 45 }, { k: "zartek", w: 45 }],
        "keypad": [{ k: "wireless keypad", w: 50 }, { k: "keypad", w: 45 }],
        "maglock": [{ k: "magnetic lock", w: 50 }, { k: "maglock", w: 50 }],
        "battery": [{ k: "gel battery", w: 50 }, { k: "lithium battery", w: 50 }, { k: "backup battery", w: 50 }, { k: "battery", w: 40 }, { k: "7ah", w: 30 }, { k: "12ah", w: 30 }, { k: "18ah", w: 30 }],
        "gas-cylinder": [{ k: "gas cylinder", w: 50 }, { k: "lp gas", w: 50 }, { k: "9kg gas", w: 45 }, { k: "19kg gas", w: 45 }, { k: "48kg gas", w: 45 }],
      };
      
      // Minimum score threshold - products must score above this to be classified
      const MIN_SCORE = 30;
      
      const detectSubtype = (productName: string, categorySlug: string | null = null): string => {
        const nameLower = productName.toLowerCase();
        const validSubtypes = categorySlug && categorySubtypes[categorySlug] 
          ? categorySubtypes[categorySlug] 
          : Object.keys(subtypeKeywordRules);
        
        let bestSubtype = "generic";
        let bestScore = 0;
        
        for (const subtype of validSubtypes) {
          const weighted = subtypeKeywordRules[subtype] || [];
          let score = 0;
          for (const { k, w } of weighted) {
            const kw = k.toLowerCase();
            let matches = false;
            if (kw.length <= 5 && !kw.includes(' ')) {
              matches = new RegExp(`\\b${kw}\\b`, 'i').test(nameLower);
            } else {
              matches = nameLower.includes(kw);
            }
            if (matches) score += w;
          }
          // Only accept scores above threshold
          if (score > bestScore && score >= MIN_SCORE) {
            bestScore = score;
            bestSubtype = subtype;
          }
        }
        return bestSubtype;
      };
      
      // Subtype-specific reviews
      const subtypeReviews: Record<string, { five: string[], four: string[], three: string[] }> = {
        "energizer": { five: ["Best electric fence energizer I've ever used. The power output is consistent.", "Excellent energizer. Keeps the fence hot at all times.", "Powerful energizer that handles my entire property.", "This energizer packs serious punch.", "Outstanding energizer performance. Worth every rand."], four: ["Good electric fence energizer. Doing its job well.", "Solid energizer. The perimeter is now secure.", "Happy with this energizer. Works reliably."], three: ["Energizer works okay. Does what it needs to.", "Average energizer but functional for basic needs."] },
        "strobe-light": { five: ["Brilliant strobe light! Very bright and visible from far away.", "This warning light is excellent. Flashes brightly and clearly.", "Great strobe light for my security system.", "The strobe light is super bright. Perfect deterrent."], four: ["Good strobe light. Nice and bright.", "Solid warning light for the price."], three: ["Strobe works okay. Brightness is acceptable."] },
        "siren": { five: ["This fence siren scared off intruders on day one. Brilliant!", "Excellent siren. Extremely loud when triggered.", "Great alarm siren. The whole neighborhood can hear it."], four: ["Good fence siren. Nice and loud when triggered.", "Solid siren for the price."], three: ["Siren works okay. Loud enough for basic needs."] },
        "warning-sign": { five: ["Great warning sign. Clear and visible. Professional look.", "Excellent quality warning sign. Durable material."], four: ["Good warning signs. Clear and visible."], three: ["Signs are okay. Standard quality."] },
        "fence-cable": { five: ["Quality electric fence cable. No corrosion even after heavy rains.", "Excellent HT cable. Proper insulation and good quality.", "Great fence cable. Easy to install and works well."], four: ["Good fence cable. Works as expected.", "Solid cable for the price."], three: ["Cable works okay. Standard quality."] },
        "fence-wire": { five: ["Excellent electric fence wire. Strong and easy to work with.", "Quality stainless steel wire. Will last for years on my fence.", "Great fence wire. My installer was impressed with the quality."], four: ["Good quality fence wire. Does the job.", "Happy with this wire. Holds tension well."], three: ["Wire works okay. Standard quality."] },
        "fence-spring": { five: ["Great fence spring tension. Keeps everything tight and secure.", "Excellent spring quality. Made tensioning the fence easy.", "Perfect springs for my electric fence. Very strong."], four: ["Good fence spring. Keeps tension properly."], three: ["Spring works okay. Does the job."] },
        "fence-beam": { five: ["Best fence beams I've used. Detection is spot on every time.", "Excellent infrared beams. Never miss any movement."], four: ["Good fence beams. Detects movement reliably."], three: ["Beams work okay. Basic detection."] },
        "fence-bracket": { five: ["Excellent fence bracket. Sturdy and well made.", "Great quality brackets. Made installation much easier."], four: ["Good quality fence brackets. Sturdy construction."], three: ["Brackets work okay. Standard quality."] },
        "fence-insulator": { five: ["Excellent fence insulators. Holding up well in all weather.", "Great quality insulators. No leakage whatsoever."], four: ["Good insulators. Work as expected."], three: ["Insulators work okay. Basic quality."] },
        "fence-kit": { five: ["Top notch electric fencing kit. Everything I needed in one box.", "Excellent fence kit. Complete solution for my property.", "Great kit. All quality components included."], four: ["Good fence kit. Has most things needed."], three: ["Kit is okay. Some items could be better quality."] },
        "gate-motor": { five: ["This gate motor is incredibly powerful and smooth. Best investment!", "Fantastic gate motor! Opens the gate quickly and quietly every time.", "Excellent gate motor. Even during load shedding, it works on battery.", "Top quality gate motor. Centurion really knows their stuff.", "Gate motor is powerful and reliable. No more manual gate opening!", "This D5 Evo is brilliant. Gate opens in seconds every time."], four: ["Good gate motor. Opens the gate reliably every time.", "Solid motor for my sliding gate. Works well.", "Happy with this gate motor. Smooth operation."], three: ["Gate motor works okay. Gets the job done.", "Average motor but functional for daily use."] },
        "motor-bracket": { five: ["Excellent motor bracket. Keeps everything aligned properly.", "The anti-theft bracket is solid. Extra security for my motor."], four: ["Good motor bracket. Fits well and works."], three: ["Bracket works okay. Standard quality."] },
        "motor-cover": { five: ["Great gate motor cover. Protects the unit from weather.", "Excellent cover. Keeps dust and rain out perfectly."], four: ["Good gate motor cover. Keeps dust out."], three: ["Cover works okay. Basic protection."] },
        "motor-cable": { five: ["Quality gate motor cable. Proper gauge for the installation.", "Excellent power cable. Well insulated and durable."], four: ["Good gate motor cable. Works well."], three: ["Cable works okay. Standard quality."] },
        "motor-rack": { five: ["Motor rack is perfect fit. Gate runs smoothly now.", "Excellent steel rack. Very durable and precise."], four: ["Good motor rack. Gate runs smoothly."], three: ["Rack works okay. Does the job."] },
        "motor-base": { five: ["Great motor base plate. Made installation so much easier.", "Excellent base plate. Very sturdy and level."], four: ["Good motor base plate. Installation was easy."], three: ["Base plate works okay. Basic quality."] },
        "camera": { five: ["Excellent CCTV camera! Crystal clear footage day and night.", "This security camera is fantastic. Night vision is incredibly clear.", "Best camera I've owned. The image quality is outstanding.", "The CCTV footage is so clear. Great for identifying faces and cars.", "HiLook cameras are excellent. Professional quality surveillance."], four: ["Good quality CCTV camera. Clear pictures during the day.", "Solid surveillance camera. Night vision is decent.", "Happy with this security camera. Records well."], three: ["Camera works okay. Picture quality is acceptable.", "Average camera but functional for basic monitoring."] },
        "dvr": { five: ["This DVR is brilliant. Easy to set up and playback footage.", "Excellent recorder. Handles all my cameras perfectly.", "Great DVR. Remote viewing works flawlessly."], four: ["Good DVR. Recording works well.", "Solid DVR for home use."], three: ["DVR works okay. Basic functionality."] },
        "camera-cable": { five: ["Best camera cable I've used. Signal is crystal clear.", "Quality cable for my camera system. Works great."], four: ["Good camera cable. Picture quality is good."], three: ["Cable works okay. Standard quality."] },
        "power-supply": { five: ["Great CCTV power supply. Runs all my cameras without issues.", "Excellent power supply. Stable and reliable."], four: ["Good camera power supply. Works reliably."], three: ["Power supply works okay. Basic quality."] },
        "bnc-connector": { five: ["Excellent BNC connectors. Solid connection every time.", "Great quality connectors. Easy to crimp."], four: ["Good BNC connectors for the price."], three: ["Connectors work okay. Standard quality."] },
        "junction-box": { five: ["The camera junction box is weatherproof. Perfect for outdoors.", "Excellent junction box. Keeps connections dry and safe."], four: ["Good junction box. Keeps connections dry."], three: ["Junction box works okay. Basic protection."] },
        "balun": { five: ["Great video balun set. Makes installation much easier.", "Excellent baluns. Signal quality is perfect."], four: ["Good baluns. Work as expected."], three: ["Baluns work okay. Standard quality."] },
        "door-hinge": { five: ["Excellent garage door hinges. Made the door operate smoothly.", "Great hinges. My garage door works like new now."], four: ["Good garage door hinges. Fit properly."], three: ["Hinges work okay. Standard quality."] },
        "door-roller": { five: ["Great garage door rollers. Much better than originals.", "Excellent rollers. Door glides smoothly now."], four: ["Good quality rollers for the garage door."], three: ["Rollers work okay. Door is functional now."] },
        "door-cable": { five: ["Garage door cable is strong and reliable. Good replacement.", "Excellent lift cable. Very durable."], four: ["Good garage door cable. Works well."], three: ["Cable works okay. Does the job."] },
        "door-bearing": { five: ["Good garage door bearings. Smooth operation restored.", "Excellent bearings. No more squeaking."], four: ["Good bearings. Door works smoothly."], three: ["Bearings work okay. Standard quality."] },
        "door-bracket": { five: ["Excellent garage bracket. Very sturdy and well made."], four: ["Good garage brackets. Work well."], three: ["Brackets work okay. Basic quality."] },
        "glosteel-door": { five: ["Perfect Glosteel door. Quality parts that last.", "Excellent Glosteel sectional door. Looks great and works perfectly."], four: ["Good Glosteel door. Works well."], three: ["Door is okay. Standard quality."] },
        "garage-motor": { five: ["Brilliant garage motor! Opens my heavy sectional door with no struggle.", "This garage door motor is fantastic. Quiet and powerful.", "Excellent motor for my roll-up garage door. Works perfectly.", "Top quality garage motor. The remote range is excellent.", "Love this garage motor. Heavy door, no problem at all."], four: ["Good garage motor. Opens the door reliably.", "Solid motor for my garage. Works well.", "Happy with this garage door opener."], three: ["Garage motor works okay. Does the job.", "Average motor but functional daily."] },
        "remote": { five: ["Excellent remote! Works perfectly with my gate motor.", "This remote has great range. Can open the gate from far away.", "Quality remote transmitter. Very responsive and reliable.", "Best replacement remote I've bought. Pairs easily.", "Great Centurion remote. Works flawlessly every time."], four: ["Good remote. Works well with my gate.", "Solid transmitter. Range is decent.", "Happy with this remote. Reliable operation."], three: ["Remote works okay. Does what it should.", "Average but functional remote."] },
        "intercom": { five: ["Excellent intercom system! Crystal clear audio and video.", "This intercom is fantastic. Can see and speak to visitors clearly.", "Best intercom I've used. The G-Speak system is brilliant.", "Brilliant intercom system. Very happy with the clarity."], four: ["Good intercom system. Clear audio.", "Solid intercom. Works reliably.", "Happy with this intercom setup."], three: ["Intercom works okay. Basic but functional.", "Average system but does the job."] },
        "keypad": { five: ["Top quality keypad intercom. Access control is perfect now.", "Excellent keypad. Easy to program codes."], four: ["Good keypad intercom. Functions well."], three: ["Keypad works okay. Basic functionality."] },
        "maglock": { five: ["Excellent maglock. Very strong and secure.", "Great magnetic lock. Holds the gate firmly."], four: ["Good maglock. Works reliably."], three: ["Maglock works okay. Basic quality."] },
        "battery": { five: ["Excellent battery! Powers my gate motor perfectly during load shedding.", "This battery holds charge really well. Great backup power.", "Best backup battery I've bought. Lasts through multiple outages.", "Reliable battery backup. Essential for load shedding in SA."], four: ["Good battery. Holds charge well.", "Solid backup power. Works reliably.", "Happy with this battery purchase."], three: ["Battery works okay. Provides basic backup.", "Average but functional for load shedding."] },
        "gas-cylinder": { five: ["Great gas cylinder! Exchange process was quick and easy.", "Excellent LP gas quality. Burns clean and lasts well.", "Quality gas cylinder at a fair price. Very happy.", "Excellent LP gas. Perfect for my braai."], four: ["Good gas cylinder. Exchange was simple.", "Solid LP gas quality. Works well."], three: ["Gas works okay. Standard quality.", "Average exchange experience."] }
      };
      
      // Generic reviews (no product mention - safe for any product)
      const genericReviews = {
        five: ["Absolutely brilliant! Couldn't be happier with this purchase.", "Exceeded all my expectations. Top quality stuff.", "This is exactly what I was looking for. Perfect!", "Outstanding quality and great value for money.", "Very impressed with the build quality.", "Works flawlessly. Highly recommended!", "Best purchase I've made this year.", "Professional grade equipment at a fair price.", "Arrived quickly and works perfectly.", "No complaints whatsoever. Five stars deserved.", "Really happy with this. Would buy again.", "Exactly as described. Very pleased.", "Great product and fast delivery from Alectra.", "Quality is superb. Worth every rand.", "Perfect condition and works great.", "Fantastic quality, better than expected.", "Very satisfied customer here!", "Alectra delivered again. Great product.", "Would definitely recommend to friends.", "Top notch quality all round.", "Brilliant. Just brilliant.", "Money well spent on this one.", "Works great in all conditions.", "Very reliable. Haven't had any issues."],
        four: ["Good solid product. Does the job well.", "Happy with this purchase. Works great.", "Good quality for the price.", "Works as expected. Would recommend.", "Solid product. Minor things but overall good.", "Good value. Doing its job nicely.", "Pretty happy with this purchase.", "Works well. Delivery was quick too.", "Does what it says on the box.", "Nice product. Good build quality.", "Satisfied with this. Works properly.", "Good purchase. Would buy from Alectra again.", "Quality is good. No major issues.", "Works fine. Happy overall."],
        three: ["It's okay. Gets the job done.", "Average product but works fine.", "Does what it needs to. Nothing special.", "Fair enough for the price paid.", "Acceptable quality. Works as expected.", "Decent product. Room for improvement.", "It works. That's the main thing."]
      };
      
      const getRandomReviewName = () => `${reviewFirstNames[Math.floor(Math.random() * reviewFirstNames.length)]} ${reviewLastNames[Math.floor(Math.random() * reviewLastNames.length)]}`;
      const getRandomReviewRating = () => {
        const rand = Math.random();
        if (rand < 0.55) return 5;
        if (rand < 0.85) return 4;
        return 3;
      };
      
      const usedReviewComments = new Set<string>();
      const getReviewComment = (rating: number, subtype: string, useSubtypeSpecific: boolean): string | null => {
        let pool: string[];
        if (useSubtypeSpecific && subtype !== "generic" && subtypeReviews[subtype]) {
          const subtypePool = subtypeReviews[subtype];
          pool = rating === 5 ? subtypePool.five : rating === 4 ? subtypePool.four : subtypePool.three;
          if (!pool || pool.length === 0) {
            pool = rating === 5 ? genericReviews.five : rating === 4 ? genericReviews.four : genericReviews.three;
          }
        } else {
          pool = rating === 5 ? genericReviews.five : rating === 4 ? genericReviews.four : genericReviews.three;
        }
        const available = pool.filter(c => !usedReviewComments.has(c));
        if (available.length === 0) {
          const comment = pool[Math.floor(Math.random() * pool.length)];
          usedReviewComments.add(comment);
          return comment;
        }
        const comment = available[Math.floor(Math.random() * available.length)];
        usedReviewComments.add(comment);
        return comment;
      };

      // Check if reviews already exist
      const allProducts = await storage.getAllProducts();
      const allCats = await storage.getAllCategories();
      const catIdToSlug = new Map<string, string>();
      allCats.forEach(c => catIdToSlug.set(c.id, c.slug));
      
      // Build product slug to ID mapping for importing exact reviews
      const productSlugToId = new Map<string, string>();
      allProducts.forEach(p => productSlugToId.set(p.slug, p.id));
      
      let hasReviews = false;
      if (allProducts.length > 0) {
        const sampleReviews = await storage.getProductReviews(allProducts[0].id);
        hasReviews = sampleReviews.length > 0;
      }
      
      // Seed reviews using EXACT data from dev database export (not random generation)
      if (!hasReviews && allProducts.length > 0 && devData?.reviews?.length > 0) {
        // Use the exact reviews exported from development database
        // Insert directly with createdAt to maintain identical timestamps
        for (const review of devData.reviews) {
          const productId = productSlugToId.get(review.productSlug);
          if (productId) {
            try {
              await db.insert(productReviews).values({
                productId,
                rating: review.rating,
                comment: review.comment,
                authorName: review.authorName,
                createdAt: review.createdAt ? new Date(review.createdAt) : new Date()
              });
              reviewsCreated++;
            } catch (e) {
              // Skip if error
            }
          }
        }
      } else if (!hasReviews && allProducts.length > 0) {
        // Fallback: generate reviews if no export data available
        for (const product of allProducts) {
          const reviewCount = Math.floor(Math.random() * 4) + 1;
          const categorySlug = product.categoryId ? catIdToSlug.get(product.categoryId) || null : null;
          const subtype = detectSubtype(product.name, categorySlug);
          
          for (let i = 0; i < reviewCount; i++) {
            const rating = getRandomReviewRating();
            const useSubtypeSpecific = i === 0 && subtype !== "generic";
            const comment = getReviewComment(rating, subtype, useSubtypeSpecific);
            try {
              await storage.createProductReview({
                productId: product.id,
                rating,
                comment: comment || undefined,
                authorName: getRandomReviewName()
              });
              reviewsCreated++;
            } catch (e) {
              // Skip if error
            }
          }
        }
      }

      // Seed blog posts (3 SEO articles)
      const blogPosts = [
        {
          title: "Electric Fence Installation Tips for South African Properties",
          slug: "electric-fence-installation-tips",
          excerpt: "Professional guide to installing electric fencing systems in South Africa. Learn about height requirements, energizer selection, and legal compliance for residential and commercial properties.",
          content: `Electric fencing is one of the most effective security measures for South African properties. This comprehensive guide will help you understand the installation process and legal requirements.\n\n## Planning Your Electric Fence Installation\n\nBefore installation, assess your property perimeter and determine the fence height. South African regulations require a minimum height of 1.8 meters for electric fencing in residential areas.\n\n## Choosing the Right Energizer\n\nSelect an energizer based on your fence length. For properties up to 5km, a 5-joule energizer is sufficient. Larger properties require 10-15 joule units.\n\n## Installation Steps\n\n1. Install corner posts first\n2. String the wires at correct intervals\n3. Connect the energizer to a reliable power source\n4. Install earth stakes (minimum 3 for residential)\n5. Test all connections\n\n## Legal Requirements\n\nWarning signs must be displayed every 10 meters. The fence must be clearly visible. Always comply with municipal by-laws and SANS 10222-3 standards.\n\n## Maintenance Tips\n\nInspect your fence monthly. Check for vegetation touching wires, loose connections, and energizer functionality. Regular maintenance ensures optimal security performance.`,
          author: "Alectra Solutions",
          imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
          tags: ["electric fencing", "security", "installation", "south africa"],
          metaDescription: "Complete guide to electric fence installation in South Africa. Learn about legal requirements, energizer selection, and professional installation tips for maximum security."
        },
        {
          title: "Best Gate Motors for Load-Shedding in South Africa 2025",
          slug: "best-gate-motors-load-shedding-south-africa-2025",
          excerpt: "Navigate load-shedding with confidence. Our 2025 guide covers the best battery backup gate motors, solar solutions, and power management systems for South African homes.",
          content: `Load-shedding continues to challenge South African homeowners. Modern gate motors with battery backup ensure your security system remains operational during power outages.\n\n## Top Picks for 2025\n\n### Centurion D5 EVO Smart\nThe D5 EVO features built-in battery backup lasting up to 48 hours. Its smart technology integrates with home automation systems.\n\n### Gemini DC Slider\nThis DC-powered motor operates efficiently on battery backup. Ideal for sliding gates up to 600kg.\n\n## Battery Backup Solutions\n\nInvest in deep-cycle batteries rated for at least 200 cycles. Lithium batteries offer longer lifespan but cost more upfront.\n\n## Solar Power Integration\n\nSolar panels can charge your gate motor battery during the day. A 50W panel with controller is sufficient for most residential gates.\n\n## Power Management\n\nModern gate motors include power-saving modes. Look for models with sleep mode and LED status indicators showing battery level.\n\n## Maintenance During Load-Shedding\n\nCheck battery water levels monthly. Keep solar panels clean. Test backup functionality regularly to ensure reliability when you need it most.`,
          author: "Alectra Solutions",
          imageUrl: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop",
          tags: ["gate motors", "load shedding", "battery backup", "solar power"],
          metaDescription: "Best gate motors for load-shedding in South Africa 2025. Compare battery backup systems, solar solutions, and power management features to keep your gate operational."
        },
        {
          title: "CCTV Buying Guide for South African Homes",
          slug: "cctv-buying-guide-south-african-homes",
          excerpt: "Everything you need to know before buying CCTV cameras in South Africa. Compare resolution options, storage solutions, night vision, and smart features for home security.",
          content: `Choosing the right CCTV system protects your South African home effectively. This guide covers essential features and buying considerations.\n\n## Camera Resolution\n\n### 1080p HD\nSufficient for most residential applications. Clear footage for identification within 10 meters.\n\n### 4K Ultra HD\nRecommended for larger properties. Exceptional detail for facial recognition and license plate reading.\n\n## Storage Solutions\n\nDVRs store footage locally on hard drives. Cloud storage offers remote access but requires monthly fees. Hybrid systems provide both options.\n\n## Night Vision Technology\n\nInfrared cameras see up to 30 meters in complete darkness. Starlight cameras provide color footage in low-light conditions.\n\n## Smart Features\n\nModern CCTV systems include:\n- Motion detection with smartphone alerts\n- AI-powered person/vehicle detection\n- Remote viewing via mobile apps\n- Two-way audio communication\n\n## Installation Considerations\n\nProfessional installation ensures optimal camera placement. DIY kits work for tech-savvy homeowners. Always secure cables properly to prevent tampering.\n\n## Weatherproofing\n\nChoose cameras with IP66 or IP67 ratings for South African weather conditions. These withstand rain, dust, and extreme temperatures.\n\n## Legal Requirements\n\nDisplay CCTV warning signs. Cameras must not view neighboring properties without consent. Comply with POPIA regulations for data protection.`,
          author: "Alectra Solutions",
          imageUrl: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=800&h=600&fit=crop",
          tags: ["cctv", "security cameras", "home security", "buying guide"],
          metaDescription: "Complete CCTV buying guide for South African homes. Learn about camera resolution, storage options, night vision, and smart features to choose the perfect security system."
        }
      ];

      // Seed blog posts (from dev data or defaults) - only seed missing posts
      const existingBlogSlugs = new Set(existingBlogs.map(b => b.slug));
      const postsToSeed = devData?.blogs || blogPosts;
      const missingPosts = postsToSeed.filter((post: any) => !existingBlogSlugs.has(post.slug));
      
      for (const post of missingPosts) {
        try {
          await storage.createBlogPost({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            author: post.author || "Alectra Solutions",
            imageUrl: post.imageUrl,
            tags: post.tags || [],
            metaDescription: post.metaDescription
          });
          blogPostsCreated++;
        } catch (e) {
          // Skip if already exists
        }
      }

      // Build response message
      const changes = [];
      if (categoriesCreated > 0) changes.push(`${categoriesCreated} categories`);
      if (productsCreated > 0) changes.push(`${productsCreated} products`);
      if (reviewsCreated > 0) changes.push(`${reviewsCreated} reviews`);
      if (blogPostsCreated > 0) changes.push(`${blogPostsCreated} blog posts`);

      const message = changes.length > 0 
        ? `Successfully added: ${changes.join(', ')}!`
        : 'Database already fully seeded - nothing to add!';

      res.json({
        success: true,
        message: message,
        categoriesCreated: categoriesCreated,
        productsCreated: productsCreated,
        reviewsCreated: reviewsCreated,
        blogPostsCreated: blogPostsCreated,
        alreadyComplete: changes.length === 0
      });

    } catch (error: any) {
      res.status(500).json({ 
        success: false,
        message: "Seeding failed: " + error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
