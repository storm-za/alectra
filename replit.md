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

## Product Catalog

### Current Product Count
**273 total products** across 7 categories (as of November 2025):
- **Gate Motors**: 141 products (gate motors, PCBs, chargers, brackets, racks, accessories)
- **Electric Fencing**: 61 products (energizers, beams, springs, warning lights, cables, accessories)
- **CCTV Systems**: 31 products (cameras, DVRs, power supplies)
- **Remotes**: 16 products (Centurion Nova, Gemini, Sentry, Absolute)
- **Intercoms**: 12 products (Centurion G-Speak, E.T Nice, Kocom, Zartek)
- **Batteries**: 9 products (12V, 24V, lithium, gel batteries)
- **LP Gas**: 3 products (9kg, 19kg, 48kg cylinders)

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
- Brand, SKU, category
- Primary image URL + image gallery array
- Stock level, featured flag