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