import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useState, useEffect, useMemo } from "react";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ChevronLeft, ChevronRight, Search, X, Filter, ChevronDown, ChevronUp, MapPin, ChevronDownIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Product, Category } from "@shared/schema";

// Brand banners for gate-motors category
import centurionBanner from "@assets/optimized/centurion-banner.webp";
import geminiBanner from "@assets/optimized/gemini-banner.webp";
import dtsBanner from "@assets/optimized/dts-banner.webp";

interface BrandSection {
  brand: string;
  banner: string | null;
  products: Product[];
}

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CategoryPageProps {
  onAddToCart: (product: Product) => void;
  slug?: string;
}

export default function CategoryPage({ onAddToCart, slug: propSlug }: CategoryPageProps) {
  const [, categoryParams] = useRoute("/category/:slug");
  const [, collectionsParams] = useRoute("/collections/:slug");
  const slug = propSlug || categoryParams?.slug || collectionsParams?.slug;
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [brand, setBrand] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 24;

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories", slug],
    enabled: !!slug,
  });

  const { data: brands } = useQuery<string[]>({
    queryKey: ["/api/brands"],
  });

  // Check if we should use brand sections layout (gate-motors without filters)
  const shouldUseBrandSections = slug === 'gate-motors' && !search && brand === 'all' && priceRange[0] === 0 && priceRange[1] === 10000;

  const buildQueryKey = () => {
    const queryParams = new URLSearchParams();
    if (slug) queryParams.append("categorySlug", slug);
    if (search) queryParams.append("search", search);
    if (brand && brand !== "all") queryParams.append("brand", brand);
    if (priceRange[0] > 0) queryParams.append("minPrice", priceRange[0].toString());
    if (priceRange[1] < 10000) queryParams.append("maxPrice", priceRange[1].toString());
    if (sortBy) queryParams.append("sort", sortBy);
    
    // For gate-motors brand sections, fetch all products (no pagination)
    if (shouldUseBrandSections) {
      queryParams.append("limit", "500"); // Fetch all products for brand sections
    } else {
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
    }
    
    const queryString = queryParams.toString();
    return queryString ? `/api/products?${queryString}` : `/api/products?page=${page}&limit=${limit}`;
  };

  const { data, isLoading: productsLoading } = useQuery<ProductsResponse>({
    queryKey: [buildQueryKey()],
    enabled: !!slug,
  });

  const products = data?.products;
  const pagination = data?.pagination;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setBrand("all");
    setPriceRange([0, 10000]);
    setSortBy("name-asc");
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
  }, [search, brand, priceRange, sortBy]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const hasActiveFilters = search || (brand && brand !== "all") || priceRange[0] > 0 || priceRange[1] < 10000;
  const isLoading = categoryLoading || productsLoading;

  // Gate Motors FAQ data for SEO
  const gateMotorsFAQ = [
    {
      question: "What size gate motor do I need for my sliding gate?",
      answer: "The motor size depends on your gate's weight: For gates up to 300kg, a Centurion D3 or ET Nice Drive 300 is ideal. Gates 300-500kg need a D5 Evo Smart or ET Nice Drive 500. For heavy gates 500-800kg, choose a Centurion D6 Smart. Extra-heavy gates 800kg+ require a Centurion D10 Smart. Always add 20% extra capacity for safety margin."
    },
    {
      question: "Which is better: Centurion or Gemini gate motors?",
      answer: "Both are excellent South African brands. Centurion motors (D3, D5, D6, D10) offer advanced smart features, battery backup, and integration with home automation. They're ideal for frequent use and premium installations. Gemini motors are more budget-friendly while still reliable, making them perfect for residential properties with standard requirements. For commercial or high-traffic gates, Centurion is recommended."
    },
    {
      question: "Do gate motors work during load shedding?",
      answer: "Yes! All our gate motors include or support battery backup systems. Centurion Smart motors have built-in battery charging and can operate for 50+ cycles during power outages. We recommend a 7Ah battery for residential use and 18Ah for commercial applications to ensure uninterrupted access during load shedding."
    },
    {
      question: "How long does gate motor installation take?",
      answer: "Professional installation typically takes 3-5 hours for a standard sliding gate motor. This includes mounting the motor, laying the rack, electrical connections, programming remotes, and safety testing. Swing gate motor installation usually takes 4-6 hours as it requires precise alignment. We recommend professional installation to ensure warranty validity."
    },
    {
      question: "What's included in a gate motor full kit?",
      answer: "Our full kits include everything for installation: the motor unit, 4-6 meters of nylon/steel rack, mounting hardware, 2 remote controls, anti-theft bracket, battery (where specified), and installation manual. Premium kits also include battery backup systems and extended warranties. Motor-only options are available if you already have existing infrastructure."
    },
    {
      question: "Can I control my gate motor from my phone?",
      answer: "Yes! Centurion Smart motors are compatible with the Centurion Smart app, allowing you to open/close your gate, monitor status, and receive alerts from anywhere. You'll need a Centurion Smart Hub (sold separately) to enable smartphone control. This also integrates with home automation systems like Google Home and Amazon Alexa."
    }
  ];

  // Create structured data for gate-motors category
  const gateMotorsStructuredData = slug === 'gate-motors' ? {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `https://alectra.co.za/collections/gate-motors`,
        "name": "Gate Motors South Africa - Sliding & Swing Gate Automation",
        "description": "Shop premium gate motors from Centurion, Gemini & ET Nice. Sliding gate motors, swing gate openers, full installation kits with battery backup. Free delivery on orders over R1000.",
        "url": "https://alectra.co.za/collections/gate-motors",
        "isPartOf": {
          "@type": "WebSite",
          "@id": "https://alectra.co.za/#website",
          "name": "Alectra Solutions",
          "url": "https://alectra.co.za"
        },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://alectra.co.za" },
            { "@type": "ListItem", "position": 2, "name": "Gate Motors", "item": "https://alectra.co.za/collections/gate-motors" }
          ]
        }
      },
      {
        "@type": "FAQPage",
        "mainEntity": gateMotorsFAQ.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      },
      {
        "@type": "ItemList",
        "itemListElement": (products ?? []).slice(0, 10).map((product, index) => ({
          "@type": "ListItem",
          "position": index + 1,
          "item": {
            "@type": "Product",
            "name": product.name,
            "url": `https://alectra.co.za/products/${product.slug}`,
            "image": product.imageUrl?.startsWith('http') ? product.imageUrl : `https://alectra.co.za/${(product.imageUrl || '').replace(/^\/+/, '')}`,
            "offers": {
              "@type": "Offer",
              "price": product.price,
              "priceCurrency": "ZAR",
              "availability": (product.stock ?? 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
            }
          }
        }))
      }
    ]
  } : null;

  // Brand banners configuration for gate-motors category
  // Centurion, Gemini, and DTS have banners
  // DTS section will also include all remaining products
  const brandBanners: Record<string, string> = {
    "Centurion": centurionBanner,
    "Gemini": geminiBanner,
    "DTS": dtsBanner,
  };

  // Custom sorting for Centurion products: D3, D5, D6, D10, Vantage, then parts
  const getCenturionSortGroup = (product: Product): number => {
    const name = product.name.toLowerCase();
    if (name.includes('d3')) return 1;
    if (name.includes('d5')) return 2;
    if (name.includes('d6')) return 3;
    if (name.includes('d10')) return 4;
    if (name.includes('vantage')) return 5;
    return 6; // Parts and accessories
  };

  const sortCenturionProducts = (products: Product[]): Product[] => {
    return [...products].sort((a, b) => {
      const groupA = getCenturionSortGroup(a);
      const groupB = getCenturionSortGroup(b);
      if (groupA !== groupB) return groupA - groupB;
      return parseFloat(a.price) - parseFloat(b.price);
    });
  };

  // Organize products by brand for gate-motors category (only when no filters active)
  const brandSections = useMemo((): BrandSection[] | null => {
    if (!shouldUseBrandSections || !products) {
      return null;
    }

    const brandsWithBanners = Object.keys(brandBanners);
    const sections: BrandSection[] = [];
    const otherProducts: Product[] = [];

    // Group products by brand
    const productsByBrand: Record<string, Product[]> = {};
    products.forEach(product => {
      const productBrand = product.brand || 'Other';
      if (!productsByBrand[productBrand]) {
        productsByBrand[productBrand] = [];
      }
      productsByBrand[productBrand].push(product);
    });

    // Add sections for brands with banners first
    brandsWithBanners.forEach(brandName => {
      if (productsByBrand[brandName]) {
        // Use custom sorting for Centurion, default price sorting for others
        const sortedProducts = brandName === 'Centurion'
          ? sortCenturionProducts(productsByBrand[brandName])
          : [...productsByBrand[brandName]].sort(
              (a, b) => parseFloat(a.price) - parseFloat(b.price)
            );
        sections.push({
          brand: brandName,
          banner: brandBanners[brandName],
          products: sortedProducts,
        });
      }
    });

    // Collect remaining products (brands without banners) - these go to DTS section
    Object.entries(productsByBrand).forEach(([brandName, brandProducts]) => {
      if (!brandsWithBanners.includes(brandName)) {
        otherProducts.push(...brandProducts);
      }
    });

    // Add remaining products to DTS section (merge with existing DTS products if any)
    if (otherProducts.length > 0) {
      // Find existing DTS section and add remaining products to it
      const dtsSection = sections.find(s => s.brand === 'DTS');
      if (dtsSection) {
        dtsSection.products = [...dtsSection.products, ...otherProducts].sort(
          (a, b) => parseFloat(a.price) - parseFloat(b.price)
        );
      } else {
        // Create DTS section with remaining products
        sections.push({
          brand: 'DTS',
          banner: brandBanners['DTS'],
          products: otherProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)),
        });
      }
    }

    return sections;
  }, [shouldUseBrandSections, products]);

  if (!isLoading && !category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Category not found</h1>
          <Link href="/" className="text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  // SEO title and description for gate-motors
  const getSEOTitle = () => {
    if (slug === 'gate-motors') {
      return "Gate Motors South Africa | Centurion, Gemini & ET Nice | Best Prices";
    }
    return `${category?.name || 'Category'} - Security Products`;
  };

  const getSEODescription = () => {
    if (slug === 'gate-motors') {
      return "Shop gate motors from R2,499. Centurion D3, D5, D6, D10 Smart motors. Gemini & ET Nice sliding gate motors. Full kits with battery backup. Free delivery over R1000. Load shedding ready.";
    }
    return category?.description || `Browse our ${category?.name || 'security'} products. Quality security and automation solutions for South African homes and businesses.`;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={getSEOTitle()}
        description={getSEODescription()}
        image={category?.imageUrl || undefined}
        structuredData={gateMotorsStructuredData || undefined}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: category?.name || "Category", href: `/collections/${slug}` },
          ]}
        />

        <div className="mb-8">
          {isLoading ? (
            <>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-6 w-32" />
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
                {category?.name}
              </h1>
              <p className="text-muted-foreground">
                {products?.length || 0} {products?.length === 1 ? 'product' : 'products'}
              </p>
              
              {/* LP Gas Pretoria-only delivery notice */}
              {category?.slug === 'lp-gas-exchange' && (
                <Alert className="mt-4 border-primary/50 bg-primary/5">
                  <MapPin className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    <strong>Pretoria Delivery Only:</strong> LP Gas products are only delivered within Pretoria at a flat rate of R50. Nationwide delivery is not available for LP Gas.
                    <br /><br />
                    <strong>Same-Day Delivery:</strong> Orders placed before 12:00 will be delivered the same day. Orders placed after 12:00 will be scheduled for the next business day. If the next day is a public holiday, delivery will be on the following business day.
                  </AlertDescription>
                </Alert>
              )}

              {/* Gate Motors SEO Intro Content */}
              {slug === 'gate-motors' && (
                <div className="mt-6 prose prose-sm max-w-none text-muted-foreground">
                  <p>
                    Find the perfect <strong>gate motor</strong> for your home or business. We stock South Africa's leading brands including 
                    <strong> Centurion</strong> (D3, D5, D6, D10 Smart), <strong>Gemini</strong>, and <strong>ET Nice</strong> sliding gate motors. 
                    All our gate motors are <strong>load shedding ready</strong> with battery backup options, ensuring your property stays secure 
                    during power outages. Choose from motor-only units or complete installation kits with rack, remotes, and anti-theft brackets.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Filter Toggle Button */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full sm:w-auto"
            data-testid="button-toggle-filters"
          >
            <Filter className="h-4 w-4 mr-2" />
            {filtersOpen ? 'Hide Filters' : 'Show Filters'}
            {filtersOpen ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
          </Button>
          {hasActiveFilters && !filtersOpen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-2"
              data-testid="button-clear-filters-compact"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          {filtersOpen && (
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Filters</h2>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 px-2"
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>

            {/* Search */}
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <Input
                  id="search"
                  placeholder="Search..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  data-testid="input-search"
                />
                <Button type="submit" size="icon" data-testid="button-search">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger id="brand" data-testid="select-brand">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands?.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <Label>Price Range</Label>
              <div className="px-2">
                <Slider
                  min={0}
                  max={10000}
                  step={100}
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                  data-testid="slider-price"
                />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span data-testid="text-min-price">R{priceRange[0]}</span>
                <span data-testid="text-max-price">R{priceRange[1]}</span>
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger id="sort" data-testid="select-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  <SelectItem value="newest">Newest First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          )}

          {/* Products Grid */}
          <div className={filtersOpen ? "lg:col-span-3" : "lg:col-span-4"}>
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products && products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No products found</p>
                {hasActiveFilters && (
                  <Button onClick={clearFilters} variant="outline" data-testid="button-clear-no-results">
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : brandSections ? (
              /* Brand-organized layout for gate-motors */
              (<div className="space-y-12">
                {brandSections.map((section) => (
                  <div key={section.brand} data-testid={`brand-section-${section.brand.toLowerCase().replace(/\s+/g, '-')}`}>
                    {/* Brand Banner */}
                    {section.banner && (
                      <div className="mb-6 rounded-lg overflow-hidden">
                        <img
                          src={section.banner}
                          alt={`${section.brand} products`}
                          className="w-full h-auto object-cover"
                          data-testid={`banner-${section.brand.toLowerCase()}`}
                        />
                      </div>
                    )}
                    {/* Brand Section Header (only for sections without banners) */}
                    {!section.banner && (
                      <h2 className="text-2xl font-bold mb-6" data-testid={`heading-${section.brand.toLowerCase().replace(/\s+/g, '-')}`}>
                        {section.brand}
                      </h2>
                    )}
                    {/* Products Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {section.products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onAddToCart={onAddToCart}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>)
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {products?.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>

                {/* Pagination Controls */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="min-w-[40px]"
                            data-testid={`button-page-${pageNum}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                      data-testid="button-next-page"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Gate Motors FAQ Section for SEO */}
        {slug === 'gate-motors' && (
          <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions About Gate Motors</h2>
            <Accordion type="single" collapsible className="w-full" data-testid="accordion-faq">
              {gateMotorsFAQ.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} data-testid={`accordion-item-faq-${index}`}>
                  <AccordionTrigger className="text-left font-medium" data-testid={`accordion-trigger-faq-${index}`}>
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground" data-testid={`accordion-content-faq-${index}`}>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Additional SEO Content */}
            <div className="mt-8 prose prose-sm max-w-none text-muted-foreground">
              <h3 className="text-lg font-semibold text-foreground">Gate Motor Buying Guide</h3>
              <p>
                Choosing the right gate motor ensures reliable, secure access to your property for years to come. 
                Here's what to consider when shopping for a sliding gate motor or swing gate motor in South Africa:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Gate Weight:</strong> Measure your gate's weight to select an appropriately powered motor. Undersized motors fail prematurely.</li>
                <li><strong>Usage Frequency:</strong> High-traffic commercial properties need heavy-duty motors like the Centurion D10.</li>
                <li><strong>Battery Backup:</strong> Essential for load shedding - all our motors support backup batteries.</li>
                <li><strong>Smart Features:</strong> Centurion Smart motors offer app control, status monitoring, and home automation integration.</li>
                <li><strong>Warranty:</strong> We offer manufacturer warranties on all gate motors. Professional installation is recommended.</li>
              </ul>
              <p className="mt-4">
                <strong>Need help choosing?</strong> Contact us at <a href="mailto:info@alectra.co.za" className="text-primary hover:underline">info@alectra.co.za</a> for 
                personalized recommendations based on your gate specifications.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
