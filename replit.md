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

## External Dependencies

### Payment Processing
- **Stripe**: Integrated for payment processing.

### Database Service
- **Neon**: Serverless PostgreSQL database.

### Development Tools
- **Vite**: Build tool and development server.
- **Replit plugins**: For Replit environment enhancements.
- **TSX**: TypeScript execution for development.

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
- `scripts/export-dev-database.ts` - Exports dev database to JSON
- `scripts/dev-database-export.json` - Complete snapshot (272 products, 9 categories, 3 blog posts)
- `server/routes.ts` - `/api/admin/seed-production` endpoint reads export file

**Deployment Workflow**:
1. **Export dev database** (already done, kept in source control):
   ```bash
   tsx scripts/export-dev-database.ts
   ```
   Creates `scripts/dev-database-export.json` (266KB)

2. **Republish the website** to include the export file

3. **Seed production database**:
   - Visit `https://your-published-url.replit.app/admin/seed`
   - Click "Seed Production Database"
   - Backend reads `dev-database-export.json` directly from filesystem
   - Smart seeding: only adds missing data, safe to run multiple times

**Key Features**:
- ✅ Preserves exact product-category mappings via slug-based matching
- ✅ Includes all 58 uncategorized products
- ✅ No request size limits (reads from filesystem, not HTTP POST)
- ✅ Idempotent: safe to run multiple times
- ✅ Automatically seeds 500+ reviews across all products

**Production Seeding Endpoint**: `POST /api/admin/seed-production`
- Reads `scripts/dev-database-export.json` from filesystem
- Creates categories first (slug → ID mapping)
- Maps products to categories via slug lookup
- Generates reviews with South African names
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