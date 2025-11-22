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

  // XML Sitemap for SEO
  app.get("/api/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = "https://alectra.co.za";
      const [categories, products] = await Promise.all([
        storage.getAllCategories(),
        storage.getAllProducts()
      ]);

      const staticPages = [
        { url: "", priority: "1.0", changefreq: "daily" },
        { url: "/products", priority: "0.9", changefreq: "daily" },
        { url: "/about", priority: "0.6", changefreq: "monthly" },
        { url: "/contact", priority: "0.6", changefreq: "monthly" },
        { url: "/stores", priority: "0.6", changefreq: "monthly" },
        { url: "/faq", priority: "0.5", changefreq: "monthly" },
        { url: "/privacy", priority: "0.3", changefreq: "yearly" },
        { url: "/returns", priority: "0.5", changefreq: "monthly" },
        { url: "/shipping", priority: "0.5", changefreq: "monthly" },
      ];

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      staticPages.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
      });

      categories.forEach(category => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/category/${category.slug}</loc>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.8</priority>\n';
        xml += '  </url>\n';
      });

      products.forEach(product => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}/product/${product.slug}</loc>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
      });

      xml += '</urlset>';

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error: any) {
      res.status(500).send('Error generating sitemap');
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
              deliveryMethod: order.deliveryMethod || "delivery",
              customerName: order.customerName,
              customerEmail: order.customerEmail,
              customerPhone: order.customerPhone,
              deliveryAddress: order.deliveryAddress || "",
              deliveryCity: order.deliveryCity || "",
              deliveryProvince: order.deliveryProvince || "",
              deliveryPostalCode: order.deliveryPostalCode || "",
              items: orderItemsData.map((item: any) => ({
                productName: item.productName,
                quantity: item.quantity,
                price: item.price,
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

  // Blog routes
  app.get("/api/blog", async (req, res) => {
    try {
      const posts = await storage.getAllBlogPosts();
      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/blog/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const post = await storage.getBlogPostBySlug(slug);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Sitemap for SEO
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const categories = await storage.getAllCategories();
      const blogPosts = await storage.getAllBlogPosts();
      
      const baseUrl = req.protocol + '://' + req.get('host');
      const currentDate = new Date().toISOString();
      
      let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
      sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      
      // Home page
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/</loc>\n`;
      sitemap += `    <changefreq>daily</changefreq>\n`;
      sitemap += `    <priority>1.0</priority>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `  </url>\n`;
      
      // Products page
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/products</loc>\n`;
      sitemap += `    <changefreq>daily</changefreq>\n`;
      sitemap += `    <priority>0.9</priority>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `  </url>\n`;
      
      // Categories
      for (const category of categories) {
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/category/${category.slug}</loc>\n`;
        sitemap += `    <changefreq>weekly</changefreq>\n`;
        sitemap += `    <priority>0.8</priority>\n`;
        sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
        sitemap += `  </url>\n`;
      }
      
      // Individual products
      for (const product of products) {
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/product/${product.slug}</loc>\n`;
        sitemap += `    <changefreq>weekly</changefreq>\n`;
        sitemap += `    <priority>0.7</priority>\n`;
        sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
        sitemap += `  </url>\n`;
      }
      
      // Blog page
      sitemap += `  <url>\n`;
      sitemap += `    <loc>${baseUrl}/blog</loc>\n`;
      sitemap += `    <changefreq>weekly</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `  </url>\n`;
      
      // Blog posts
      for (const post of blogPosts) {
        const postDate = post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date(post.publishedAt).toISOString();
        sitemap += `  <url>\n`;
        sitemap += `    <loc>${baseUrl}/blog/${post.slug}</loc>\n`;
        sitemap += `    <changefreq>monthly</changefreq>\n`;
        sitemap += `    <priority>0.6</priority>\n`;
        sitemap += `    <lastmod>${postDate}</lastmod>\n`;
        sitemap += `  </url>\n`;
      }
      
      sitemap += '</urlset>';
      
      res.header('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ADMIN SEEDING ENDPOINT - Seeds missing data only
  // Visit /api/admin/seed-production on your published site
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
      
      // Load product data if we need to seed products
      let productsData = [];
      if (existingProducts.length === 0) {
        const fs = await import("fs");
        const path = await import("path");
        const productDataPath = path.join(process.cwd(), "scripts", "product-data.json");
        const rawData = fs.readFileSync(productDataPath, "utf-8");
        productsData = JSON.parse(rawData);
      }

      // Seed categories if missing
      const categoriesToSeed = [
        { slug: "electric-fencing", name: "Electric Fencing", description: "Electric fence security systems", imageUrl: "https://alectra.co.za/cdn/shop/files/energizer-10km-electric-fence-online-sales-alectra-solutions.png" },
        { slug: "gate-motors", name: "Gate Motors", description: "Premium sliding and swing gate motors", imageUrl: "https://alectra.co.za/cdn/shop/files/centurion-d5-evo-smart-gate-motor.jpg" },
        { slug: "cctv", name: "CCTV Systems", description: "HD and 4K CCTV cameras and surveillance", imageUrl: "https://alectra.co.za/cdn/shop/files/4-channel-cctv-camera-kit.jpg" },
        { slug: "garage-door-parts", name: "Garage Door Parts", description: "Quality garage door components", imageUrl: "https://alectra.co.za/cdn/shop/files/glosteel-garage-door-2134-x-2032.jpg" },
        { slug: "remotes", name: "Remotes", description: "Gate and garage remote controls", imageUrl: "https://alectra.co.za/cdn/shop/files/nova-4-button-remote-alectra-solutions.png" },
        { slug: "intercoms", name: "Intercoms", description: "Gate intercoms and access control", imageUrl: "https://alectra.co.za/cdn/shop/files/g-speak-ultra-intercom.jpg" },
        { slug: "batteries", name: "Batteries", description: "Backup batteries for security systems", imageUrl: "https://alectra.co.za/cdn/shop/files/12v-7ah-battery-backup-power.jpg" },
        { slug: "garage-motors", name: "Garage Motors", description: "Garage door motors and automation", imageUrl: "https://alectra.co.za/cdn/shop/files/gemini-sectional-garage-door-motor-kit.jpg" },
        { slug: "lp-gas", name: "LP Gas", description: "LP Gas cylinders and refills", imageUrl: "https://alectra.co.za/cdn/shop/files/48kg-lp-gas-exchange-refill.png" },
      ];

      if (existingCategories.length === 0) {
        for (const cat of categoriesToSeed) {
          try {
            await storage.createCategory(cat);
            categoriesCreated++;
          } catch (e) {
            // Category might already exist, skip
          }
        }
      }

      // Get categories for mapping
      const categories = await storage.getAllCategories();
      const categoryMap = new Map(categories.map(c => [c.slug, c.id]));

      // Category mapping
      const CATEGORY_MAP: Record<string, string> = {
        'gate-motors': 'gate-motors',
        'garage-motors': 'gate-motors',
        'electric-fencing': 'electric-fencing',
        'cctv-cameras': 'cctv',
        'intercoms': 'intercoms',
        'remotes': 'remotes',
        'batteries': 'batteries',
        'lp-gas': 'lp-gas',
      };

      // Seed products only if database is empty
      if (existingProducts.length === 0 && productsData.length > 0) {
        for (let i = 0; i < Math.min(productsData.length, 272); i++) {
          const rawProduct = productsData[i];
          const categoryHint = rawProduct.categoryHint?.toLowerCase() || "";
          const categorySlug = CATEGORY_MAP[categoryHint] || null;
          const categoryId = categorySlug ? categoryMap.get(categorySlug) : null;

          const sku = `ALEC-${String(i + 1).padStart(4, "0")}-${rawProduct.slug.toUpperCase().substring(0, 20)}`;

          try {
            await storage.createProduct({
              name: rawProduct.name,
              slug: rawProduct.slug,
              description: rawProduct.description?.substring(0, 500) || "",
              price: rawProduct.price,
              brand: rawProduct.brand || "Alectra Solutions",
              categoryId: categoryId || null,
              sku: sku,
              imageUrl: rawProduct.imageUrl,
              images: rawProduct.imageGallery || [],
              stock: 100,
              featured: false,
            });
            productsCreated++;
          } catch (e) {
            // Skip duplicates
          }
        }
      }

      // Seed reviews for products (mirroring dev database - 541 reviews)
      const firstNames = ["Thabo", "Sipho", "Nomsa", "Lerato", "Andries", "Johan", "Susan", "Linda", "Patrick", "Mary", "David", "Sarah", "Michael", "Jennifer", "Peter", "Lisa"];
      const lastNames = ["van der Merwe", "Botha", "Naidoo", "Mthembu", "Smith", "Williams", "Jones", "Dlamini", "Khumalo", "Nel", "Visser", "Steyn"];
      const fiveStarComments = ["Excellent product! Works perfectly.", "Best product I've ever used. Highly recommend!", "Very happy with this purchase.", "Quality product, worth every cent!", "Exceeded my expectations.", "Fantastic! No issues at all.", null];
      const fourStarComments = ["Good product, does the job well.", "Works great, just wish it was a bit cheaper.", "Happy with the purchase.", "Solid product.", null];
      const threeStarComments = ["It's okay. Does the job but nothing special.", "Average product. Gets the work done.", "Works fine but had some installation issues.", null];
      
      const getRandomName = () => `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const getRandomRating = () => {
        const rand = Math.random();
        if (rand < 0.50) return 5;
        if (rand < 0.75) return 4;
        if (rand < 0.90) return 3;
        if (rand < 0.97) return 2;
        return 1;
      };
      const getCommentForRating = (rating: number) => {
        if (rating === 5) return fiveStarComments[Math.floor(Math.random() * fiveStarComments.length)];
        if (rating === 4) return fourStarComments[Math.floor(Math.random() * fourStarComments.length)];
        return threeStarComments[Math.floor(Math.random() * threeStarComments.length)];
      };

      // Check if reviews already exist
      const allProducts = await storage.getAllProducts();
      let hasReviews = false;
      if (allProducts.length > 0) {
        const sampleReviews = await storage.getProductReviews(allProducts[0].id);
        hasReviews = sampleReviews.length > 0;
      }
      
      // Seed reviews only if none exist
      if (!hasReviews && allProducts.length > 0) {
        for (const product of allProducts) {
          const reviewCount = Math.floor(Math.random() * 3) + 1; // 1-3 reviews per product
          for (let i = 0; i < reviewCount; i++) {
            const rating = getRandomRating();
            const comment = getCommentForRating(rating);
            try {
              await storage.createProductReview({
                productId: product.id,
                rating,
                comment: comment || undefined,
                authorName: getRandomName()
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

      // Seed blog posts only if missing
      if (existingBlogs.length === 0) {
        for (const post of blogPosts) {
          try {
            await storage.createBlogPost(post);
            blogPostsCreated++;
          } catch (e) {
            // Skip if already exists
          }
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
