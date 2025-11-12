# Alectra Solutions eCommerce Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based combining Shopify's eCommerce patterns with industrial B2B trust elements

**Key Principles:**
- Professional security industry aesthetic emphasizing reliability and expertise
- Conversion-optimized layouts with prominent CTAs and trust signals
- Clean product-focused design minimizing distractions
- Mobile-first responsive approach for South African market

---

## Typography System

**Headings:**
- Hero H1: Bold, 4xl-6xl (responsive), tracking-tight
- Section H2: Bold, 3xl-4xl, tracking-tight  
- Product H3: Semibold, xl-2xl
- Card Titles: Semibold, lg-xl

**Body Text:**
- Primary: Regular, base-lg for readability
- Product Descriptions: Regular, sm-base
- Pricing: Bold, lg-2xl (emphasis on value)
- CTAs: Semibold, base-lg

**Font Selection:** Use Google Fonts - Inter or Work Sans for modern, professional feel with excellent readability

---

## Layout & Spacing System

**Spacing Units:** Tailwind scale of 2, 4, 6, 8, 12, 16, 20, 24 for consistency

**Container Structure:**
- Max-width: max-w-7xl for main content
- Section Padding: py-16 md:py-24 (generous vertical rhythm)
- Inner Spacing: px-4 md:px-8 lg:px-12
- Component Gaps: gap-6 md:gap-8 for grids

**Grid Layouts:**
- Product Categories: 2-3-4 column responsive grid
- Featured Products: 2-4 column grid with cards
- Trust Badges: 4-column even distribution
- Brand Logos: 5-6 column flowing grid

---

## Component Library

### Navigation Header
- Sticky top navigation with generous padding (py-4)
- Logo left, main nav center, cart/account icons right
- Phone number and "Request Quote" CTA in top bar
- Mobile: Hamburger menu with slide-out drawer
- Cart badge with item count indicator

### Hero Section
- Full-width background image (gate motor installation/security scene)
- Large centered headline with subheadline below
- Two prominent CTAs: "Shop Now" (primary) and "Request Quote" (secondary)
- Trust badges row below CTAs (icons with text)
- Height: 70vh-90vh responsive

### Product Cards
- Clean white card with subtle shadow (hover: elevated shadow)
- Product image (16:9 aspect ratio) with "New" or "Special" badges
- Title, brand, price (VAT inc.) clearly displayed
- "Add to Cart" button + "View Details" link
- Wishlist icon top-right corner

### Category Tiles
- Large clickable tiles (min-h-48)
- Category image background with overlay
- Category name overlay (bold, large text)
- Product count subtitle
- 2-3 column grid on desktop, single column mobile

### Shopping Cart
- Slide-out drawer from right side
- Line items with thumbnail, name, quantity controls, price
- Subtotal, VAT breakdown, total clearly separated
- Prominent "Checkout" button
- "Continue Shopping" secondary action

### Checkout Flow
- Multi-step indicator (Cart → Details → Payment → Confirmation)
- Single column form layout (max-w-2xl)
- Grouped sections: Contact, Delivery, Payment
- Order summary sticky sidebar on desktop
- Trust seals near payment section

### Footer
- 4-column layout: Company, Shop, Support, Contact
- Payment method icons row
- Brand logo showcase
- Social media icons
- Copyright and legal links
- Newsletter signup form (email + button)

---

## Page-Specific Layouts

### Homepage
1. Hero with dual CTAs
2. Trust badges (4-icon row)
3. Category tiles (6-tile grid)
4. Featured/Bestseller carousel (4-6 products)
5. Trusted brands logo grid
6. Why Choose section (icon + text blocks)
7. Bundle/Special offer banner
8. Google Reviews showcase
9. Newsletter + WhatsApp CTA
10. Rich footer

### Product Listing Page
- Breadcrumb navigation
- Filter sidebar (collapsible on mobile)
- Sort dropdown (Price, Name, Newest)
- 3-4 column product grid
- Pagination at bottom
- "Load More" option for smoother UX

### Product Detail Page
- Breadcrumb navigation
- 2-column: Image gallery left (60%), Details right (40%)
- Image: Main image + 4-5 thumbnail gallery below
- Details: Title, brand, SKU, price (VAT), stock status
- Quantity selector + "Add to Cart" primary button
- Tabs: Description, Specifications, Reviews
- "Related Products" carousel at bottom

---

## Images

**Hero Section:** Professional image of installed gate motor or security system in upscale South African home (residential security context). Image should convey reliability and quality.

**Category Tiles:** High-quality product photography on clean backgrounds - gate motors, CCTV cameras, batteries, intercoms in use

**Product Images:** Clean white background studio shots (primary), lifestyle installation shots (secondary gallery images)

**Trust Section:** Icon-based graphics for service highlights (no photos needed)

**Brand Logos:** Actual brand logos (Centurion, Gemini, Hikvision, etc.) on transparent backgrounds

---

## Trust & Conversion Elements

**Trust Indicators (always visible):**
- Secure checkout badge in header
- "4.5★ Google Rating - 49 Reviews" near CTAs
- Free delivery threshold messaging
- Payment method icons (Visa, Mastercard, EFT)

**Urgency Elements:**
- "Limited Stock" badges on low inventory
- Bundle offer countdown timer
- "X people viewing" on popular products

**Social Proof:**
- Google Reviews widget with star rating
- Customer photos in testimonials
- Installer testimonials separate section

---

## Accessibility & Performance

- All interactive elements min-h-11 (touch-friendly)
- High contrast text throughout
- Focus states on all interactive elements
- Image lazy loading for products
- Skeleton loaders during product fetch
- Optimized images (WebP format, responsive srcset)