import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { X, Search, Filter, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ProductsProps {
  onAddToCart: (product: Product) => void;
}

export default function Products({ onAddToCart }: ProductsProps) {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [brand, setBrand] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 24;

  const { data: brands } = useQuery<string[]>({
    queryKey: ["/api/brands"],
  });

  const buildQueryKey = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (brand && brand !== "all") params.append("brand", brand);
    if (priceRange[0] > 0) params.append("minPrice", priceRange[0].toString());
    if (priceRange[1] < 10000) params.append("maxPrice", priceRange[1].toString());
    if (sortBy) params.append("sort", sortBy);
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    
    const queryString = params.toString();
    return queryString ? `/api/products?${queryString}` : `/api/products?page=${page}&limit=${limit}`;
  };

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: [buildQueryKey()],
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

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Products - Security & Automation | Alectra Solutions"
        description="Browse our complete range of security and automation products. Gate motors, electric fencing, CCTV cameras, remotes, batteries, and more. Fast nationwide delivery across South Africa."
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            All Products
          </h1>
          <p className="text-muted-foreground">
            {pagination ? `${pagination.total} products available` : 'Loading...'}
          </p>
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
                  placeholder="Search products..."
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
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {products?.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={onAddToCart}
                      priority={index < 4}
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
      </div>
    </div>
  );
}
