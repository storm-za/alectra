# Alectra Solutions eCommerce Platform

## Overview
Alectra Solutions is a B2B/B2C eCommerce platform for security and automation products in South Africa, targeting both retail and professional installers. The platform aims to provide a conversion-optimized shopping experience with a professional security industry aesthetic. It features a full-stack TypeScript implementation using React for the frontend and Express for the backend. The platform includes a comprehensive product catalog, authentication, an admin dashboard, and integrates with Google Merchant Center for product feeds.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI Component System**: shadcn/ui (Radix UI primitives) styled with Tailwind CSS, emphasizing professional security aesthetics, mobile-first responsiveness, and conversion-optimized layouts.
- **State Management**: React Query for server state, local React state for UI and cart management.
- **Routing**: Wouter for client-side routing.
- **Key Design Patterns**: Component composition, custom hooks, React Hook Form with Zod validation.

### Backend
- **Server Framework**: Express.js with TypeScript (ESM mode).
- **API Design**: RESTful API for authentication, categories, products, and orders.
- **Database Access Layer**: `IStorage` interface implemented by `DatabaseStorage` for separation of concerns and type-safe operations.
- **Session Management**: PostgreSQL-backed sessions using `connect-pg-simple` and `express-session`, configured for 30-day persistence.

### Data Storage
- **Database**: PostgreSQL via Neon serverless driver.
- **ORM**: Drizzle ORM for type-safe query building.
- **Schema Design**: Includes `users`, `categories`, `products`, `orders`, and `order_items` tables with UUIDs for primary keys, decimal types for monetary values, and array types for image galleries.

### Authentication and Authorization
- **Implementation**: Session-based authentication with bcrypt password hashing and PostgreSQL-backed sessions.
- **Security Features**: Bcrypt hashing, server-side session storage, HttpOnly cookies, duplicate email prevention, guest checkout support.
- **User Roles**: `customer`, `installer`, `admin`.

### Admin Dashboard
- **Access**: Password-protected dashboard at `/admin` and `/admin/seed`.
- **Security**: Bcrypt password verification, timing-safe comparison, rate limiting (5 attempts/min, 15-min lockout), IP-based rate tracking.
- **Admin Endpoints**: For login, logout, status check, statistics, order summaries, and database seeding/clearing.

### Product Catalog and Migration
- **Product Count**: 271 total products across 9 categories + 43 uncategorized.
- **Migration Process**: Automated scraping from Shopify's public JSON API, normalized data export, local image storage, SKU generation, and batch insertion. Includes exact review imports.
- **Data Quality**: VAT-inclusive prices, local image storage, truncated descriptions, brand detection, and default stock levels.

### Google Merchant Center Integration
- **Google Shopping Product Feed**: Dynamic RSS 2.0 feed generated from the live database, excluding discontinued/out-of-stock items, updated hourly.
- **Attributes**: Includes standard Google Shopping attributes like `g:id`, `g:title`, `g:price`, `g:availability`, `g:brand`, `g:product_type`, `g:google_product_category`.
- **SEO Features**: Schema.org Product structured data, Open Graph and Twitter Card meta tags, canonical URLs.

### Seasonal Themes
- **Christmas Theme**: Active for December 2025, featuring subtle snowfall animation and corner decorations.

## External Dependencies

### Payment Processing
- **Stripe**

### Database Service
- **Neon** (PostgreSQL)

### UI/UX Libraries
- **shadcn/ui** (Radix UI primitives)
- **Tailwind CSS**
- **Lucide React** (icons)

### Form Handling & Validation
- **React Hook Form**
- **Zod**
- **@hookform/resolvers**

### Image Optimization
- **Sharp** (for WebP optimization)

### Delivery Service
- **The Courier Guy** (referenced for nationwide delivery)

### Third-Party Brands
- Partners with Centurion, ET Nice, Digidoor, Gemini, DTS, Hansa, Nemtek, IDS, Sentry, Hilook, Hikvision.