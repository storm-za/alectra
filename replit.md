# Alectra Solutions eCommerce Platform

## Overview

Alectra Solutions is a B2B/B2C eCommerce platform specializing in security and automation products for the South African market. The platform serves both retail customers and professional installers, offering gate motors, batteries, remotes, CCTV systems, intercoms, and related security equipment. The application features a full-stack TypeScript implementation with a modern React frontend and Express backend, designed for conversion-optimized shopping experiences with professional security industry aesthetics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**UI Component System**: Utilizes shadcn/ui components (Radix UI primitives) following the "new-york" style variant. The design system is built on Tailwind CSS with a custom configuration emphasizing:
- Professional security industry aesthetics (slate/blue color palette)
- Mobile-first responsive design for the South African market
- Conversion-optimized layouts with prominent CTAs
- Custom spacing system using Tailwind scale (2, 4, 6, 8, 12, 16, 20, 24)
- Inter font family for modern, professional typography

**State Management**: 
- React Query (TanStack Query) for server state management with custom query client configuration
- Local React state (useState) for UI state like cart management, mobile menus, and form inputs
- Shopping cart state is managed at the App component level and passed down to child components

**Routing**: Wouter for client-side routing, chosen for its lightweight footprint compared to React Router.

**Key Design Patterns**:
- Component composition with prop drilling for cart functionality
- Custom hooks for reusable logic (toast notifications, mobile detection)
- Form handling with React Hook Form and Zod validation
- Responsive layouts using CSS Grid and Flexbox with Tailwind utilities

### Backend Architecture

**Server Framework**: Express.js with TypeScript, running in ESM mode.

**API Design**: RESTful API structure with route handlers organized by resource type:
- `/api/categories` - Category listing and detail endpoints
- `/api/products` - Product catalog with filtering by category and featured status
- `/api/orders` - Order creation with items

**Database Access Layer**: Storage abstraction pattern using an `IStorage` interface implemented by `DatabaseStorage` class. This provides:
- Clear separation between business logic and data access
- Type-safe database operations
- Easy testability and potential for multiple storage implementations

**Request/Response Flow**:
1. Express middleware for JSON parsing with raw body preservation (for webhook verification)
2. Custom logging middleware for API requests
3. Route handlers delegate to storage layer
4. Error handling with appropriate HTTP status codes
5. Vite development middleware for serving frontend in development

**Session Management**: Uses `connect-pg-simple` for PostgreSQL-backed session storage, though session implementation details are not fully visible in provided code.

### Data Storage Solutions

**Database**: PostgreSQL via Neon serverless driver with WebSocket support for serverless environments.

**ORM**: Drizzle ORM chosen for:
- Type-safe query building
- Lightweight footprint
- Excellent TypeScript integration
- Migration support via drizzle-kit

**Schema Design**:
- `categories` - Product categorization with slug-based routing and product counts
- `products` - Full product catalog with pricing, inventory, images, and featured flags
- `orders` - Customer orders with delivery information and status tracking
- `order_items` - Line items linking orders to products with quantities and prices

**Key Design Decisions**:
- UUIDs for primary keys using PostgreSQL's `gen_random_uuid()`
- Decimal type for monetary values to maintain precision
- Array type for product image galleries
- Slug-based routing for SEO-friendly URLs
- Timestamps for order tracking

### Authentication and Authorization

No authentication system is currently implemented. The application appears to support anonymous shopping with checkout requiring customer information but not account creation.

## External Dependencies

### Payment Processing
- **Stripe**: Integration prepared with `@stripe/stripe-js` and `@stripe/react-stripe-js` for payment processing, though implementation details are not visible in provided code.

### Database Service
- **Neon**: Serverless PostgreSQL database with WebSocket support for real-time capabilities and serverless deployment compatibility.

### Development Tools
- **Vite**: Build tool and development server with HMR support
- **Replit plugins**: Development banner, cartographer, and runtime error overlay for Replit environment
- **TSX**: TypeScript execution for development server

### UI Component Libraries
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives (accordion, dialog, dropdown, popover, etc.)
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography
- **class-variance-authority**: Utility for creating variant-based component APIs
- **cmdk**: Command palette component

### Form Handling
- **React Hook Form**: Performant form state management
- **Zod**: TypeScript-first schema validation
- **@hookform/resolvers**: Integration layer between React Hook Form and Zod

### Delivery Service
- **The Courier Guy**: Referenced as the delivery provider for nationwide shipping in South Africa (integration not visible in code).

### Third-Party Brands
The platform partners with major security brands including Centurion, ET Nice, Digidoor, Gemini, DTS, Hansa, Nemtek, IDS, Sentry, Hilook, and Hikvision.