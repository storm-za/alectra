import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createOrderRequestSchema, registerSchema, loginSchema, insertUserAddressSchema, insertProductReviewSchema, insertTradeApplicationSchema } from "@shared/schema";
import { hashPassword, verifyPassword, requireAuth } from "./auth";
import { EmailService } from "./email";

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

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: "Error fetching categories: " + error.message });
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
      const { search, brand, minPrice, maxPrice, categorySlug, sort } = req.query;
      
      if (search || brand || minPrice || maxPrice || categorySlug || sort) {
        const products = await storage.searchProducts({
          search: search as string,
          brand: brand as string,
          minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
          categorySlug: categorySlug as string,
          sort: sort as any,
        });
        return res.json(products);
      }
      
      const products = await storage.getAllProducts();
      res.json(products);
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

  // Payment routes
  app.post("/api/payment/initialize", async (req, res) => {
    try {
      // Use test key if available, otherwise use production key
      const paystackKey = process.env.TESTING_PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY;
      const keyType = process.env.TESTING_PAYSTACK_SECRET_KEY ? "TEST" : "PRODUCTION";
      
      console.log(`Using ${keyType} Paystack key (starts with: ${paystackKey?.substring(0, 7)}...)`);
      
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

      console.log("Initializing Paystack payment:", { 
        amount: paystackData.amount, 
        currency: paystackData.currency,
        email: paystackData.email 
      });

      const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${paystackKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paystackData),
      });

      const responseData = await paystackResponse.json();
      console.log("Paystack response:", { 
        status: paystackResponse.status, 
        success: responseData.status,
        message: responseData.message 
      });

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
      // Use test key if available, otherwise use production key
      const paystackKey = process.env.TESTING_PAYSTACK_SECRET_KEY || process.env.PAYSTACK_SECRET_KEY;
      
      if (!paystackKey) {
        return res.status(500).json({ message: "Payment system configuration error. Please contact support." });
      }

      const { reference } = req.params;

      if (!reference) {
        return res.status(400).json({ message: "Payment reference is required" });
      }

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

      if (!paystackResponse.ok) {
        return res.status(500).json({ 
          message: "Failed to verify payment",
          error: responseData.message 
        });
      }

      const paymentData = responseData.data;

      // Check if payment was successful
      if (paymentData.status === "success") {
        // Update order payment status
        const orderId = paymentData.metadata.orderId;
        await storage.updateOrderPaymentStatus(orderId, "paid", reference);

        // Send confirmation emails
        try {
          const order = await storage.getOrderById(orderId);
          if (order) {
            const orderItemsData = await storage.getOrderItems(orderId);
            
            const emailService = new EmailService();
            await emailService.sendOrderConfirmation({
              orderId: order.id,
              reference: reference,
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              customerPhone: order.customerPhone,
              deliveryAddress: order.deliveryAddress,
              deliveryCity: order.deliveryCity,
              deliveryProvince: order.deliveryProvince,
              deliveryPostalCode: order.deliveryPostalCode,
              items: orderItemsData.map((item: any) => ({
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
              })),
              subtotal: order.subtotal,
              vat: order.vat,
              total: order.total,
            });
            console.log(`Order confirmation emails sent for order ${orderId}`);
          }
        } catch (emailError) {
          console.error("Error sending confirmation email:", emailError);
          // Don't fail the payment verification if email fails
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

  const httpServer = createServer(app);
  return httpServer;
}
