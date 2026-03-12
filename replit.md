# Alectra Solutions eCommerce Platform

## Overview
Alectra Solutions is a B2B/B2C eCommerce platform for security and automation products in South Africa, targeting both retail and professional installers. The platform aims to provide a conversion-optimized shopping experience with a professional security industry aesthetic. It features a full-stack TypeScript implementation using React for the frontend and Express for the backend, including a comprehensive product catalog, authentication, an admin dashboard, and integration with Google Merchant Center for product feeds.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript and Vite.
- **UI Component System**: shadcn/ui (Radix UI primitives) styled with Tailwind CSS, focusing on professional security aesthetics, mobile-first responsiveness, and conversion-optimized layouts.
- **State Management**: React Query for server state, local React state for UI and cart management.
- **Routing**: Wouter for client-side routing.
- **Design Patterns**: Component composition, custom hooks, React Hook Form with Zod validation.

### Backend
- **Server Framework**: Express.js with TypeScript (ESM mode).
- **API Design**: RESTful API for authentication, categories, products, and orders.
- **Database Access Layer**: `IStorage` interface implemented by `DatabaseStorage` for separation of concerns and type-safe operations.
- **Session Management**: PostgreSQL-backed sessions using `connect-pg-simple` and `express-session`, configured for 30-day persistence.

### Data Storage
- **Database**: PostgreSQL via Neon serverless driver.
- **ORM**: Drizzle ORM for type-safe query building.
- **Schema Design**: Includes `users`, `categories`, `products`, `orders`, `order_items`, `wishlist_items`, `product_variants`, and `frequently_bought_together` tables.

### Authentication and Authorization
- **Implementation**: Session-based authentication with bcrypt password hashing and PostgreSQL-backed sessions.
- **Security Features**: Bcrypt hashing, server-side session storage, HttpOnly cookies, duplicate email prevention, guest checkout support.
- **User Roles**: `customer`, `installer`, `admin`.

### Admin Dashboard
- **Access**: Password-protected dashboard at `/admin`.
- **Security**: Bcrypt password verification, timing-safe comparison, rate limiting, IP-based rate tracking.
- **Features**: Statistics, order summaries, database seeding, review moderation, discount code management, and FBT configuration.

### Product Catalog and Migration
- **Product Count**: Supports a large catalog of products.
- **Migration Process**: Automated scraping, data normalization, local image storage, SKU generation, and batch insertion with exact review imports.

### Product Page SSR (Server-Side Rendering)
- **Purpose**: Pre-renders product detail pages (`/products/:slug`) for faster LCP, better Core Web Vitals, and full SEO visibility.
- **Architecture**: Express route intercepts product detail pages, fetches data from DB, and injects pre-rendered HTML content, meta tags, structured data, and `window.__SSR_PRODUCT__` data.
- **Client Hydration**: `client/src/main.tsx` checks for `window.__SSR_PRODUCT__` and seeds React Query cache to prevent double API fetch.

### Checkout Wizard
- **Architecture**: 3-step wizard with modern, mobile-first UX for conversion optimization.
- **Steps**: Method Selection (Delivery/Pickup), Your Details (contact info, address/store), Payment (Yoco/Paystack, discount codes, order summary).
- **Features**: Trust banner, collapsible mobile order summary, WhatsApp support button.
- **Validation**: Zod schema for required fields based on delivery or pickup.

### Discount Code System
- **Types**: `free_shipping`, `fixed_amount`, `percentage`.
- **Admin Management**: Full CRUD functionality with usage limits and expiration dates.
- **Checkout Integration**: Real-time validation and server-side re-validation during order creation.

### Wishlist Feature
- **Database**: `wishlist_items` table stores user-product associations.
- **Authentication**: Requires user login.
- **UI Components**: `WishlistButton` (heart icon) on product cards and detail pages; "My Shop" page displays wishlist items.

### Gas Articles / Blog System
- **Tag-based filtering**: Allows filtering articles by tags like 'gas'.
- **Specific Gas Article Page**: `/blogs/gas/:slug` with unique breadcrumbs and Schema.org `Article` structured data.
- **Carousel**: `GasArticlesCarousel` component displayed on relevant category pages.

### Frequently Bought Together (FBT) Admin System
- **Database**: `frequently_bought_together` table stores product-to-related-product associations with sort ordering.
- **Admin Management**: FBT tab in product edit dialog for searching, selecting, and ordering related products.
- **Frontend Display**: Prioritizes curated FBT products, falling back to same-category or featured products.

### Product Variants System
- **Database**: `product_variants` table stores variant data (price, stock, SKU, image).
- **Purpose**: Allows products to have multiple variants, each with its own attributes.
- **Admin Management**: Variants tab in product edit dialog for full CRUD operations and image assignment.
- **Frontend Display**: Variant selector grid on product detail pages, updating main image and price upon selection.

### Image Optimization System
- **Server-Side Optimization**: `/img/*` endpoint using Sharp library for on-demand image resizing and format conversion.
- **Automatic Format Negotiation**: Serves WebP/AVIF based on browser Accept header.
- **Responsive Images**: Generates srcset with multiple widths for `ProductImage` component.
- **Caching Strategy**: In-memory cache and aggressive HTTP cache headers.
- **Security**: Path traversal protection, allowed base directories, extension whitelist, width/quality bounds validation.

## External Dependencies

### Payment Processing
- Stripe

### Database Service
- Neon (PostgreSQL)

### UI/UX Libraries
- shadcn/ui (Radix UI primitives)
- Tailwind CSS
- Lucide React (icons)

### Form Handling & Validation
- React Hook Form
- Zod

### Image Optimization
- Sharp

### Delivery Service
- The Courier Guy

### Third-Party Brands
- Centurion, ET Nice, Digidoor, Gemini, DTS, Hansa, Nemtek, IDS, Sentry, Hilook, Hikvision.

### Android App (Tauri v2)
- **Architecture**: WebView wrapper loading `https://alectra.co.za` via Tauri v2.
- **Bundle ID**: `co.za.alectra.app`
- **Build**: GitHub Actions workflow (`.github/workflows/android-build.yml`) produces a signed AAB on push to `main`.
- **Icons**: Generated from `client/public/favicon.png` into `src-tauri/icons/` (desktop) and `src-tauri/android-res/` (Android mipmap densities + adaptive foreground).
- **Config**: `src-tauri/tauri.conf.json` for Tauri settings, `src-tauri/Cargo.toml` for Rust dependencies.
- **Signing**: Requires 4 GitHub Secrets: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`.
- **Documentation**: `PLAY_STORE.md` covers keystore generation, secret setup, and Play Store submission.

### PWA Support
- **Manifest**: `client/public/manifest.json` with 192px and 512px icons.
- **Theme**: `#FF9800` (orange), standalone display mode.
- **Apple**: `apple-touch-icon` linked in `client/index.html`.