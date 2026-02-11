import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { getMetaForPath, injectMetaTags, getProductLinksForCategory, injectProductLinks } from "./seo";
import { optimizeImage, getBestImageFormat } from "./imageOptimizer";
import { renderProductSSR } from "./productSSR";

const app = express();

// Enable GZIP/Brotli compression for all responses
app.use(compression({
  level: 6, // Balance between compression ratio and speed
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress if client doesn't accept it
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use default filter (compresses text-based responses)
    return compression.filter(req, res);
  }
}));

// Enable trust proxy for correct client IP detection behind reverse proxy
// Only enable if explicitly configured (TRUST_PROXY=1) to prevent IP spoofing
// when not behind a sanitizing proxy
if (process.env.TRUST_PROXY === '1' || process.env.TRUST_PROXY === 'true') {
  app.set('trust proxy', 1); // Trust first proxy hop
  console.log('Trust proxy enabled - ensure you are behind a sanitizing reverse proxy');
}

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

const PgStore = connectPgSimple(session);
app.use(
  session({
    store: new PgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "alectra-solutions-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

// Optimized image endpoint - serves resized WebP/AVIF images with long cache
app.get('/img/*', async (req, res) => {
  try {
    // Extract the original path from /img/path/to/image.jpg
    const imagePath = req.path.replace(/^\/img\//, '');
    
    // Validate query parameters with bounds
    const rawWidth = parseInt(req.query.w as string);
    const rawQuality = parseInt(req.query.q as string);
    
    // Validate width is a reasonable number
    const width = (!isNaN(rawWidth) && rawWidth > 0 && rawWidth <= 3000) ? rawWidth : 800;
    const quality = (!isNaN(rawQuality) && rawQuality >= 10 && rawQuality <= 100) ? rawQuality : 80;
    
    // Determine best format based on Accept header
    const format = getBestImageFormat(req.headers.accept);
    
    const result = await optimizeImage(imagePath, { width, quality, format });
    
    if (!result) {
      // Return 400 for invalid paths (security) or 404 for missing files
      return res.status(400).send('Invalid image request');
    }
    
    // Set aggressive cache headers (1 year for immutable content)
    res.set({
      'Content-Type': result.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Vary': 'Accept', // Important: different formats for different browsers
    });
    
    res.send(result.buffer);
  } catch (error) {
    console.error('Image optimization error:', error);
    res.status(500).send('Error processing image');
  }
});

// Serve static assets with aggressive caching for product images (1 year)
app.use('/attached_assets', express.static('attached_assets', {
  maxAge: '1y', // 1 year browser cache for Core Web Vitals
  etag: true,
  lastModified: true,
  immutable: true,
  setHeaders: (res, filePath) => {
    // All static assets get 1 year immutable cache
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    // Add Vary header for content negotiation
    if (filePath.match(/\.(jpg|jpeg|png|webp|avif|gif)$/i)) {
      res.setHeader('Vary', 'Accept');
    }
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Product Page SSR - serve fully rendered HTML for /products/:slug
  // This runs before the generic SSR meta middleware and Vite catch-all
  app.get("/products/:slug", async (req: Request, res: Response, next: NextFunction) => {
    const slug = req.params.slug;
    if (!slug || slug.startsWith("api") || slug.match(/\.(js|css|map|json)$/)) {
      return next();
    }

    try {
      const fs = await import("fs");
      const pathModule = await import("path");
      let templateHtml: string;

      if (app.get("env") === "development") {
        const clientTemplate = pathModule.default.resolve(import.meta.dirname, "..", "client", "index.html");
        templateHtml = await fs.promises.readFile(clientTemplate, "utf-8");
      } else {
        const distPath = pathModule.default.resolve(import.meta.dirname, "public");
        const indexPath = pathModule.default.resolve(distPath, "index.html");
        templateHtml = await fs.promises.readFile(indexPath, "utf-8");
      }

      const ssrHtml = await renderProductSSR(slug, templateHtml);
      if (!ssrHtml) {
        return next();
      }

      res.status(200).set({ "Content-Type": "text/html" }).send(ssrHtml);
    } catch (error) {
      console.error("Product SSR route error:", error);
      next();
    }
  });

  // SSR Meta Tag Injection Middleware
  // Intercepts HTML responses and injects dynamic SEO meta tags for crawlers
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api') || 
        req.path.startsWith('/attached_assets') ||
        req.path.startsWith('/feeds') ||
        req.path.match(/^\/products\/[^\/]+$/) ||
        req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|map)$/)) {
      return next();
    }

    const originalEnd = res.end.bind(res);
    let processed = false;

    res.end = function(chunk?: any, encodingOrCb?: BufferEncoding | (() => void), cb?: () => void): Response {
      // Prevent double processing
      if (processed) {
        return res;
      }
      
      // Handle function overloads
      const encoding = typeof encodingOrCb === 'string' ? encodingOrCb : 'utf-8';
      const callback = typeof encodingOrCb === 'function' ? encodingOrCb : cb;

      // Only intercept HTML responses with actual content
      const contentType = res.getHeader('content-type');
      const isHtml = contentType && String(contentType).includes('text/html');
      
      if (!isHtml || !chunk) {
        // Non-HTML or empty: pass through unchanged with original arguments
        return originalEnd(chunk, encodingOrCb as BufferEncoding, cb);
      }

      processed = true;
      const htmlBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
      
      const requestPath = req.originalUrl || req.path;
      
      Promise.all([
        getMetaForPath(requestPath),
        getProductLinksForCategory(requestPath)
      ])
        .then(([meta, productLinksHtml]) => {
          let html = htmlBuffer.toString('utf-8');
          html = injectMetaTags(html, meta);
          html = injectProductLinks(html, productLinksHtml);
          res.setHeader('content-length', Buffer.byteLength(html, 'utf-8'));
          originalEnd(html, 'utf-8', callback);
        })
        .catch(e => {
          console.error('SSR injection error:', e);
          originalEnd(htmlBuffer, encoding, callback);
        });
      
      return res;
    } as typeof res.end;

    next();
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Production: Custom static serving with SSR support
    // We can't use serveStatic's sendFile because it bypasses res.end() wrapper
    const path = await import("path");
    const fs = await import("fs");
    const distPath = path.default.resolve(import.meta.dirname, "public");
    
    if (!fs.existsSync(distPath)) {
      throw new Error(`Could not find the build directory: ${distPath}`);
    }
    
    // Serve static assets normally
    app.use(express.static(distPath));
    
    // For HTML pages, read file and use res.end() to trigger SSR injection
    app.use("*", async (_req, res) => {
      try {
        const indexPath = path.default.resolve(distPath, "index.html");
        const html = await fs.promises.readFile(indexPath, "utf-8");
        res.setHeader("Content-Type", "text/html");
        res.end(html); // This triggers the SSR middleware
      } catch (e) {
        console.error("Error serving index.html:", e);
        res.status(500).send("Internal Server Error");
      }
    });
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
