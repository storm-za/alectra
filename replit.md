# Alectra Solutions eCommerce Platform

## Overview

Alectra Solutions is a B2B/B2C eCommerce platform for security and automation products in South Africa, targeting both retail and professional installers. The platform aims to provide a conversion-optimized shopping experience with a professional security industry aesthetic, featuring a full-stack TypeScript implementation with React and Express.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript and Vite.
**UI Component System**: shadcn/ui (Radix UI primitives) styled with Tailwind CSS, emphasizing professional security aesthetics, mobile-first responsiveness, and conversion-optimized layouts. Uses the Inter font family.
**State Management**: React Query for server state, local React state for UI and cart management.
**Routing**: Wouter for client-side routing.
**Key Design Patterns**: Component composition, custom hooks, React Hook Form with Zod validation, responsive layouts using CSS Grid and Flexbox.

### Backend Architecture

**Server Framework**: Express.js with TypeScript (ESM mode).
**API Design**: RESTful API for authentication, categories, products, and orders.
**Database Access Layer**: `IStorage` interface implemented by `DatabaseStorage` for separation of concerns and type-safe operations.
**Request/Response Flow**: Express middleware for JSON parsing, logging, and error handling.
**Session Management**: PostgreSQL-backed sessions using `connect-pg-simple` and `express-session`, configured for 30-day persistence with secure cookie settings.

### Data Storage Solutions

**Database**: PostgreSQL via Neon serverless driver.
**ORM**: Drizzle ORM for type-safe query building and TypeScript integration.
**Schema Design**: Includes `users`, `categories`, `products`, `orders`, and `order_items` tables. Key design decisions include UUIDs for primary keys, decimal types for monetary values, array types for image galleries, and slug-based routing.

### Authentication and Authorization

**Implementation**: Session-based authentication with bcrypt password hashing (12 salt rounds) and PostgreSQL-backed sessions.
**Auth Endpoints**: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
**Security Features**: Bcrypt hashing, server-side session storage, HttpOnly cookies with SameSite protection, 30-day session lifetime, duplicate email prevention, guest checkout support.
**User Roles**: `customer` (default), `installer`, `admin`.

### Admin Dashboard Security

**Access**: Password-protected admin dashboard at `/admin` and `/admin/seed`.

**Environment Variables** (required for admin access):
- `ADMIN_PASSWORD_HASH` (recommended): Bcrypt hash of the admin password. Generate with:
  ```bash
  node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YOUR_PASSWORD', 12).then(h => console.log(h));"
  ```
- `ADMIN_PASSWORD` (fallback): Plain-text password. Only for development - not recommended for production.

**Security Features**:
- Bcrypt password verification (when using ADMIN_PASSWORD_HASH)
- Timing-safe comparison (when using plain-text fallback)
- Rate limiting: 5 attempts per minute, 15-minute lockout after exceeding
- IP-based rate limit tracking using socket remote address
- Protected endpoints: All `/api/admin/*` routes require authentication
- Session-based admin state with automatic 401 handling on frontend

**Proxy Configuration** (for rate limiting behind reverse proxy):
- Set `TRUST_PROXY=1` environment variable only when behind a sanitizing reverse proxy
- Without this, rate limiting uses socket remote address directly
- With this, rate limiting uses req.ip which trusts the first proxy hop

**Admin Endpoints**:
- `POST /api/admin/login` - Authenticate admin
- `POST /api/admin/logout` - End admin session
- `GET /api/admin/check` - Check admin status
- `GET /api/admin/stats` - Traffic/visit statistics
- `GET /api/admin/stats/range` - Date range statistics
- `GET /api/admin/orders-summary` - Orders overview
- `POST /api/admin/seed-production` - Seed production database
- `POST /api/admin/clear-production` - Clear production database

## External Dependencies

### Payment Processing
- **Stripe**: Integrated for payment processing.

### Database Service
- **Neon**: Serverless PostgreSQL database.

### Development Tools
- **Vite**: Build tool and development server.
- **Replit plugins**: For Replit environment enhancements.
- **TSX**: TypeScript execution for development.
- **Sharp**: Image processing for WebP optimization.

### Image Optimization

**Purpose**: Improve PageSpeed Performance by converting large PNG/JPG images to optimized WebP format.

**Files**:
- `scripts/optimize-images.ts` - Converts source images to optimized WebP
- `attached_assets/optimized/` - Output directory for optimized images

**Optimized Assets** (96% average size reduction):
- Hero backgrounds: `hero-background-desktop.webp`, `hero-background-mobile.webp`
- Logo: `logo.webp`
- Category images: `{category-slug}-category.webp` (9 total)

**How to Add New Optimized Images**:
1. Add entry to `imagesToOptimize` array in `scripts/optimize-images.ts`
2. Run: `npx tsx scripts/optimize-images.ts`
3. Import in component: `import img from "@assets/optimized/filename.webp"`

**Frontend Integration**:
- `Hero.tsx` - Uses desktop/mobile WebP backgrounds
- `CategoryGrid.tsx` - Maps category slugs to optimized images with fallback to database URL

### UI Component Libraries
- **Radix UI**: Accessible, unstyled UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide React**: Icon library.
- **class-variance-authority**: For variant-based component APIs.
- **cmdk**: Command palette component.

### Form Handling
- **React Hook Form**: Form state management.
- **Zod**: TypeScript-first schema validation.
- **@hookform/resolvers**: Integration with Zod.

### Delivery Service
- **The Courier Guy**: Referenced as the nationwide delivery provider in South Africa.

### Third-Party Brands
Partners with Centurion, ET Nice, Digidoor, Gemini, DTS, Hansa, Nemtek, IDS, Sentry, Hilook, and Hikvision.

## Deployment & Production Database Sync

### Dev to Production Database Synchronization

**Critical Requirement**: Development and production must have identical product catalogs.

**Solution**: Automated dev database export system that captures exact product-category mappings.

**Files**:
- `scripts/export-dev-database.ts` - Exports dev database to JSON (products, categories, blogs, reviews)
- `scripts/dev-database-export.json` - Complete snapshot (274 products, 9 categories, 41 blog posts, 677 reviews)
- `scripts/seed-all-blog-posts.ts` - Seeds all 41 SEO blog posts to database
- `server/routes.ts` - `/api/admin/seed-production` endpoint reads export file

**Deployment Workflow**:
1. **Export dev database** (already done, kept in source control):
   ```bash
   tsx scripts/export-dev-database.ts
   ```
   Creates `scripts/dev-database-export.json` (278KB) with remote Shopify CDN URLs

2. **Republish the website** to include the export file

3. **Seed production database**:
   - Visit `https://your-published-url.replit.app/admin/seed`
   - **If needed:** Click "Clear Production Database" to remove stale data
   - Click "Seed Production Database"
   - Backend reads `dev-database-export.json` directly from filesystem
   - Smart seeding: only adds missing data, safe to run multiple times

**Key Features**:
- ✅ Preserves exact product-category mappings via slug-based matching
- ✅ Includes all 58 uncategorized products
- ✅ No request size limits (reads from filesystem, not HTTP POST)
- ✅ Idempotent: safe to run multiple times
- ✅ **Imports exact reviews from development** (675 reviews with identical author names, ratings, comments, and timestamps)

**Production Seeding Endpoint**: `POST /api/admin/seed-production`
- Reads `scripts/dev-database-export.json` from filesystem
- Creates categories first (slug → ID mapping)
- Maps products to categories via slug lookup
- **Imports exact reviews** via product slug mapping (not random generation)
- Seeds blog posts

## Product Catalog

### Current Product Count
**271 total products** across 9 categories + 43 uncategorized (as of November 2025):

**Categorized Products (228):**
- **Electric Fencing**: 80 products (energizers, beams, springs, sirens, warning lights, cables, accessories)
- **Gate Motors**: 39 products (gate motors, anti-theft brackets, base plates, racks, covers, cables)
- **CCTV Systems**: 30 products (cameras, DVRs, power supplies, cables, junction boxes, BNC connectors, baluns)
- **Garage Door Parts**: 20 products (Glosteel doors, hinges, bearings, cables, rollers, brackets, screws)
- **Remotes**: 17 products (Centurion Nova, Gemini, Sentry, Absolute)
- **Intercoms**: 13 products (Centurion G-Speak SmartGuard keypads, E.T Nice, Kocom, Zartek, maglocks)
- **Batteries**: 12 products (12V, 24V, lithium, gel batteries)
- **Garage Motors**: 12 products (sectional, roll-up, tilt-up garage motors)
- **LP Gas**: 5 products (9kg, 19kg, 48kg cylinders)

**Uncategorized Products (43):**
Products that exist on alectra.co.za but are not in specific categories (available in "All Products" only):
- Centurion PCBs and chargers (D3, D5, D6/D10 models)
- Gemini accessories (PCB V.90, Gemlink, anti-theft bracket, HEX coupling, power supply)
- DTS gate wheels (60mm, 80mm variants)
- General electrical supplies (PVC conduit, junction boxes, plugs, extension boxes, cables)

### Product Migration Process
Product data is sourced from alectra.co.za using an automated Shopify scraper:

1. **Scraper** (`scripts/scrape-alectra-products.ts`): 
   - Uses Shopify's public JSON API endpoints (`/collections/{handle}/products.json`)
   - Supports pagination (250 products per page)
   - Automatic brand extraction from product titles
   - Exports normalized data to `scripts/product-data.json`

2. **Migration** (`scripts/migrate-all-products.ts`):
   - Loads products from scraped JSON data
   - Downloads and stores product images locally in `attached_assets/products/`
   - Maps Shopify collection names to database categories
   - Generates unique SKUs (format: `ALEC-XXXX-{SLUG}`)
   - Duplicate detection to prevent re-insertion
   - Batch insertion with error handling

3. **Data Quality**:
   - All product prices are VAT-inclusive (15% South African VAT)
   - Product images downloaded and stored locally
   - Descriptions extracted from Shopify HTML (cleaned and truncated to 500 chars)
   - Brand detection from vendor field or product title
   - Default stock level: 100 units per product

### Product Data Schema
Products include:
- Name, slug, description
- Price (VAT-inclusive), compare-at price (optional)
- Brand, SKU, category (nullable for uncategorized products)
- Primary image URL + image gallery array
- Stock level, featured flag

### Future Considerations
- Add automated tests to assert category counts plus uncategorized totals match alectra.co.za
- Consider exposing an explicit "Uncategorized" filter in the UI for visibility into the 43 uncategorized items
- Monitor analytics to ensure uncategorized products remain discoverable at historical rates

## Google Merchant Center Integration

### Google Shopping Product Feed

The site generates a dynamic Google Shopping product feed for integration with Google Merchant Center.

**Feed URL**: `https://alectra.co.za/feeds/google-shopping.xml`

**Feed Specifications**:
- Format: RSS 2.0 with Google Shopping namespace (`xmlns:g="http://base.google.com/ns/1.0"`)
- Auto-generated from live database
- Excludes discontinued products and out-of-stock items
- Updates every hour (cached)

**Included Product Attributes**:
- `g:id` - Product SKU (unique identifier)
- `g:title` - Product name
- `g:description` - Product description (HTML stripped, max 5000 chars)
- `g:link` - Product page URL
- `g:image_link` - Primary product image
- `g:additional_image_link` - Up to 10 additional images
- `g:price` - Price in ZAR (VAT inclusive)
- `g:availability` - "in stock" or "out of stock"
- `g:condition` - "new"
- `g:brand` - Product brand
- `g:mpn` - Manufacturer Part Number (uses SKU)
- `g:product_type` - Category name
- `g:google_product_category` - "Hardware > Security Systems & Automation"
- `g:shipping` - Standard delivery via The Courier Guy (R150)
- `g:tax` - 15% VAT for South Africa
- `g:identifier_exists` - true

**Setup Instructions**:
1. Go to [Google Merchant Center](https://merchants.google.com)
2. Create a Merchant Center account if not already done
3. Navigate to **Products** → **Feeds** → **Add primary feed**
4. Select **Scheduled fetch** as the feed type
5. Enter the feed URL: `https://alectra.co.za/feeds/google-shopping.xml`
6. Set fetch frequency to daily
7. Complete verification and submit for review

**URL Structure**:
- Main products page: `/collections/all`
- Individual product pages: `/products/:slug`
- Category pages: `/collections/:category-slug`

**SEO Features**:
- Product pages include Schema.org Product structured data
- Aggregate ratings and review counts included in structured data
- Open Graph and Twitter Card meta tags for social sharing
- Canonical URLs for all product pages