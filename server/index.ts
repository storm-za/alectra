import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { getMetaForPath, injectMetaTags } from "./seo";

const app = express();

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

// Serve static assets (product images, etc.)
app.use('/attached_assets', express.static('attached_assets'));

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

  // SSR Meta Tag Injection Middleware
  // Intercepts HTML responses and injects dynamic SEO meta tags
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    // Skip API routes and static assets
    if (req.path.startsWith('/api') || 
        req.path.startsWith('/attached_assets') ||
        req.path.startsWith('/feeds') ||
        req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp|map)$/)) {
      return next();
    }

    // Store original end method
    const originalEnd = res.end.bind(res);
    let htmlBuffer: Buffer | null = null;

    // Override end to capture HTML
    res.end = function(chunk?: any, encodingOrCb?: BufferEncoding | (() => void), cb?: () => void): Response {
      const encoding = typeof encodingOrCb === 'string' ? encodingOrCb : undefined;
      const callback = typeof encodingOrCb === 'function' ? encodingOrCb : cb;

      // Check if this is an HTML response
      const contentType = res.getHeader('content-type');
      if (contentType && String(contentType).includes('text/html') && chunk) {
        htmlBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
        
        // Process HTML async and send
        (async () => {
          try {
            const html = htmlBuffer!.toString('utf-8');
            const meta = await getMetaForPath(req.originalUrl || req.path);
            const modifiedHtml = injectMetaTags(html, meta);
            
            // Update content-length header
            res.setHeader('content-length', Buffer.byteLength(modifiedHtml, 'utf-8'));
            originalEnd(modifiedHtml, 'utf-8', callback);
          } catch (e) {
            console.error('SSR meta injection error:', e);
            // Fall back to original HTML on error
            originalEnd(htmlBuffer, encoding || 'utf-8', callback);
          }
        })();
        
        return res;
      }

      // Non-HTML responses pass through unchanged
      return originalEnd(chunk, encoding as BufferEncoding, callback);
    } as typeof res.end;

    next();
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
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
