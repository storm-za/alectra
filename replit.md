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

### Location Sharing
- **Interactive Map**: Uses Leaflet with OpenStreetMap tiles (no API key required).
- **Flow**: Browser geolocation captures initial coordinates → Interactive map appears → User drags pin or clicks to fine-tune → Coordinates saved to form and database.
- **Technical**: react-leaflet@4.2.1 for React 18 compatibility; LocationPicker lazy-loaded with Suspense; map only renders after successful geolocation.
- **Email Integration**: Order confirmation emails generate clickable Google Maps links from stored coordinates.

### Seasonal Themes
- **Christmas Theme**: Currently disabled (post-December 2025). Theme files preserved at `client/src/components/ChristmasTheme.tsx` and `client/src/styles/christmas-theme.css` for future seasonal re-activation.

### Checkout Wizard
- **Architecture**: 4-step wizard with modern, mobile-first UX designed for conversion optimization.
- **Step 1 - Method Selection**: Choose between Delivery (nationwide via The Courier Guy) or Pickup (Pretoria stores).
- **Step 2 - Contact Information**: Full name, email, phone fields with validation.
- **Step 3 - Address/Store**: 
  - For Delivery: "Use My Current Location" (GPS + interactive map) or "Let Me Enter My Address" (manual form with address search via Nominatim API).
  - For Pickup: Select between Wonderboom Store (107A Dassiebos Ave) or Hatfield Store (1234 Burnett St) with Google Maps directions.
- **Step 4 - Payment**: Select Yoco or Paystack, apply discount codes, view order summary, and complete payment.
- **UI Components**: Uses shadcn Card components with hover-elevate patterns for selection cards; 4-step progress indicator at top.
- **Features**: Trust banner with security messaging, collapsible mobile order summary, WhatsApp support button.
- **Validation**: Zod schema requires address fields for delivery, pickup store for pickup; contact fields always required.

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