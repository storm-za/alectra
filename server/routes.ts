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

  // ONE-TIME ADMIN SEEDING ENDPOINT
  // Visit /api/admin/seed-production once on your published site
  app.post("/api/admin/seed-production", async (req, res) => {
    try {
      // Security check - only allow in production when database is empty
      const existingProducts = await storage.getAllProducts();
      
      if (existingProducts.length > 0) {
        return res.status(400).json({ 
          message: "Database already has products. Seeding already complete!",
          count: existingProducts.length 
        });
      }

      // Load product data from the seeding script
      const fs = await import("fs");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      
      const productDataPath = path.join(process.cwd(), "scripts", "product-data.json");
      const rawData = fs.readFileSync(productDataPath, "utf-8");
      const productsData = JSON.parse(rawData);

      // Seed categories first
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

      let categoryCount = 0;
      for (const cat of categoriesToSeed) {
        try {
          await storage.createCategory(cat);
          categoryCount++;
        } catch (e) {
          // Category might already exist, skip
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

      // Seed products
      let productsCreated = 0;
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

      res.json({
        success: true,
        message: "Production database seeded successfully!",
        categoriesCreated: categoryCount,
        productsCreated: productsCreated
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
