import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Search, X, Filter, ChevronDown, ChevronUp } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { Product, Category } from "@shared/schema";

interface CategoryPageProps {
  onAddToCart: (product: Product) => void;
}

export default function CategoryPage({ onAddToCart }: CategoryPageProps) {
  const [, params] = useRoute("/category/:slug");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [brand, setBrand] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories", params?.slug],
    enabled: !!params?.slug,
  });

  const { data: brands } = useQuery<string[]>({
    queryKey: ["/api/brands"],
  });

  const buildQueryKey = () => {
    const queryParams = new URLSearchParams();
    if (params?.slug) queryParams.append("categorySlug", params.slug);
    if (search) queryParams.append("search", search);
    if (brand && brand !== "all") queryParams.append("brand", brand);
    if (priceRange[0] > 0) queryParams.append("minPrice", priceRange[0].toString());
    if (priceRange[1] < 10000) queryParams.append("maxPrice", priceRange[1].toString());
    if (sortBy) queryParams.append("sort", sortBy);
    
    const queryString = queryParams.toString();
    return queryString ? `/api/products?${queryString}` : "/api/products";
  };

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: [buildQueryKey()],
    enabled: !!params?.slug,
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setSearch("");
    setSearchInput("");
    setBrand("all");
    setPriceRange([0, 10000]);
  };

  const hasActiveFilters = search || (brand && brand !== "all") || priceRange[0] > 0 || priceRange[1] < 10000;
  const isLoading = categoryLoading || productsLoading;

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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4" />
          Back to Home
        </Link>

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
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {products?.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
