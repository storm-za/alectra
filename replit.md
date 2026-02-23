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

### Review Moderation System
- **Status Types**: `pending` (new reviews), `approved` (visible on site), `rejected` (hidden).
- **Admin Management**: Reviews tab in admin dashboard with stats cards, status filtering, and full CRUD.
- **Public Display**: Only approved reviews shown on product pages; average ratings calculated from approved reviews only.
- **Security**: All review admin endpoints use requireAdminAuth middleware.

### Product Catalog and Migration
- **Product Count**: 271 total products across 9 categories + 43 uncategorized.
- **Migration Process**: Automated scraping from Shopify's public JSON API, normalized data export, local image storage, SKU generation, and batch insertion. Includes exact review imports.
- **Data Quality**: VAT-inclusive prices, local image storage, truncated descriptions, brand detection, and default stock levels.

### Product Page SSR (Server-Side Rendering)
- **Purpose**: Pre-renders product detail pages (`/products/:slug`) on the server for faster LCP, better Core Web Vitals, and full SEO visibility for Google Shopping ads.
- **Architecture**: Express route in `server/index.ts` intercepts `/products/:slug` before Vite's catch-all. Reads the `client/index.html` template, fetches product data from DB, and injects pre-rendered HTML content, meta tags, structured data, and `window.__SSR_PRODUCT__` data.
- **Renderer**: `server/productSSR.ts` handles HTML generation including product image (with preload), breadcrumbs, name, price, stock status, description, and trust badges.
- **Client Hydration**: `client/src/main.tsx` checks for `window.__SSR_PRODUCT__` and seeds React Query cache to prevent double API fetch. SSR HTML is removed before React renders.
- **Meta Tags**: Title, description, canonical, Open Graph (including `og:type=product`), Twitter Card, and Schema.org Product JSON-LD are all set server-side in the HTML `<head>`.
- **Scope**: Only product detail pages use full SSR. All other pages use the existing SPA + SSR meta injection middleware (`server/seo.ts`).
- **Fallback**: If product not found or SSR fails, falls back to normal SPA rendering.

### Google Merchant Center Integration
- **Google Shopping Product Feed**: Dynamic RSS 2.0 feed generated from the live database, excluding discontinued/out-of-stock items, updated hourly.
- **Attributes**: Includes standard Google Shopping attributes like `g:id`, `g:title`, `g:price`, `g:availability`, `g:brand`, `g:product_type`, `g:google_product_category`.
- **SEO Features**: Schema.org Product structured data, Open Graph and Twitter Card meta tags, canonical URLs.

### Location Sharing
- **Interactive Map**: Uses Leaflet with OpenStreetMap tiles (no API key required).
- **Flow**: Browser geolocation captures initial coordinates → Interactive map appears → User drags pin or clicks to fine-tune → Coordinates saved to form and database.
- **Technical**: react-leaflet@4.2.1 for React 18 compatibility; LocationPicker lazy-loaded with Suspense; map only renders after successful geolocation.
- **Email Integration**: Order confirmation emails generate clickable Google Maps links from stored coordinates.

### Seasonal Themes
- **Christmas Theme**: Currently disabled (post-December 2025). Theme files preserved at `client/src/components/ChristmasTheme.tsx` and `client/src/styles/christmas-theme.css` for future seasonal re-activation.

### Checkout Wizard
- **Architecture**: 3-step wizard with modern, mobile-first UX designed for conversion optimization.
- **Step 1 - Method Selection**: Choose between Delivery (nationwide via The Courier Guy) or Pickup (Pretoria stores).
- **Step 2 - Your Details**: Combined contact info + address/store in one step. Placeholder-only input style (no labels above fields).
  - Contact fields: First name, Last name (side-by-side), Company (optional), Email, Phone.
  - For Delivery: Address, Apartment/suite (optional), City, Province (dropdown), Postal code. Plain text inputs only (no autocomplete).
  - For Pickup: Select between Wonderboom Store or Hatfield Store with Google Maps directions.
- **Step 3 - Payment**: Select Yoco or Paystack, apply discount codes, view order summary, and complete payment.
- **UI Components**: Uses shadcn Card components with hover-elevate patterns for selection cards; 3-step progress indicator at top.
- **Features**: Trust banner with security messaging, collapsible mobile order summary, WhatsApp support button.
- **Validation**: Zod schema requires address fields for delivery, pickup store for pickup; contact fields (first name, last name, email, phone) always required.
- **Name Handling**: First name and last name are combined into `customerName` when creating orders and abandoned cart entries.

### Discount Code System
- **Types**: Three discount types supported: `free_shipping` (applies to shipping cost), `fixed_amount` (direct rand deduction), `percentage` (0-100% of subtotal).
- **Admin Management**: Full CRUD functionality at `/admin/discount-codes` with ability to set usage limits and expiration dates.
- **Checkout Integration**: Real-time validation with visual feedback; codes stored uppercase for consistency.
- **Security**: Server-side re-validation during order creation - discount codes are verified from database (active, not expired, within usage limits) before applying to order totals.
- **Order Recording**: Discount code ID, code value, and calculated amount stored on orders; usage count automatically incremented upon successful order creation.
- **Priority**: Applied after trade discount but before final total calculation; free shipping discount code takes precedence over product-based free shipping promotions.

### Wishlist Feature
- **Database**: `wishlist_items` table stores user-product associations with timestamps.
- **Authentication**: Requires user login; unauthenticated clicks show "Sign in required" toast.
- **UI Components**:
  - `WishlistButton`: Reusable heart icon button that fills red when product is saved.
  - Appears in `ProductCard` (top-right corner with backdrop blur) and `ProductDetail` page (labeled "Save/Saved" button next to Add to Cart).
- **My Shop Page**: Displays wishlist items with product image, name, price, add-to-cart, and remove buttons. Shows item count and empty state when no items saved.
- **API Routes**: `GET /api/user/wishlist` (returns products), `GET /api/user/wishlist/ids` (returns product IDs for efficient button state), `POST/DELETE /api/user/wishlist/:productId`.
- **Cache Management**: Query invalidation on add/remove updates both wishlist and wishlist IDs queries.

### Frequently Bought Together (FBT) Admin System
- **Database**: `frequently_bought_together` table stores product-to-related-product associations with sortOrder field for display ordering.
- **Admin Management**: FBT tab in product edit dialog (AdminProducts.tsx) allows searching and selecting related products with drag-to-order functionality.
- **API Endpoints**: 
  - `GET /api/admin/products/:id/fbt` - Admin endpoint to fetch current FBT products for editing
  - `POST /api/admin/products/:id/fbt` - Admin endpoint to save FBT product associations with ordering
  - `GET /api/products/:id/fbt` - Public endpoint to fetch FBT products for product display
- **Frontend Display**: FrequentlyBoughtTogether component prioritizes curated FBT products from admin settings, falling back to same-category products or featured products if none are curated.
- **Data Integrity**: Unique constraint on (productId, relatedProductId) prevents duplicate associations.

### Product Variants System
- **Database**: `product_variants` table stores variant data with fields: `id`, `productId`, `name`, `price`, `sku`, `stock`, `sortOrder`, `image`, `createdAt`.
- **Purpose**: Allows products to have multiple variants (e.g., LP Gas cylinders in 9kg/19kg/48kg sizes, torsion springs in different tensions) each with their own price, stock level, and image.
- **Admin Management**: Variants tab in product edit dialog (AdminProducts.tsx) allows full CRUD operations on variants. Images tab shows a "Variant Images" section when variants exist, allowing selection of a variant and uploading/setting its specific image.
- **Frontend Display**: ProductDetail.tsx fetches database variants and shows a variant selector grid. Selecting a variant swaps the main product image to the variant's image (if set), updates the displayed price, and preloads all variant images for instant switching.
- **API Endpoints**:
  - `GET /api/admin/products/:productId/variants` - Admin endpoint to fetch variants for editing
  - `POST /api/admin/products/:productId/variants` - Admin endpoint to create a new variant (supports image field)
  - `PUT /api/admin/variants/:id` - Admin endpoint to update a variant (supports image field)
  - `DELETE /api/admin/variants/:id` - Admin endpoint to delete a variant
  - `GET /api/products/:productId/variants` - Public endpoint to fetch variants for product display
- **Security**: All admin endpoints protected by requireAdminAuth middleware.

### Image Optimization System
- **Server-Side Optimization**: `/img/*` endpoint using Sharp library for on-demand image resizing and format conversion.
- **Automatic Format Negotiation**: Serves WebP/AVIF based on browser Accept header (AVIF > WebP > JPEG fallback).
- **Performance Results**: 1.5MB PNG → 23KB WebP at 400px width (98.5% reduction); 53KB WebP → 6.7KB at 400px (87% reduction).
- **Responsive Images**: `ProductImage` component generates srcset with multiple widths (200, 400, 600, 800, 1000, 1200px).
- **Caching Strategy**: In-memory cache (100 images, 24hr TTL) + aggressive HTTP cache headers (1 year immutable for optimized images, 7 days for static assets).
- **Security**: Path traversal protection, allowed base directories (attached_assets only), extension whitelist (jpg/jpeg/png/webp/avif/gif), width/quality bounds validation.
- **Components Using Optimization**: ProductCard, ProductDetail, CartDrawer, FrequentlyBoughtTogether, MyShop.

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