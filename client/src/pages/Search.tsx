import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import ProductCard from "@/components/ProductCard";
import { SEO } from "@/components/SEO";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search as SearchIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "wouter";
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

interface SearchProps {
  onAddToCart: (product: Product) => void;
}

export default function Search({ onAddToCart }: SearchProps) {
  const [location, navigate] = useLocation();
  
  const getQueryFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("q") || "";
  };
  
  const [searchInput, setSearchInput] = useState(getQueryFromUrl);
  const [search, setSearch] = useState(getQueryFromUrl);
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [page, setPage] = useState(1);
  const limit = 24;

  useEffect(() => {
    const newQuery = getQueryFromUrl();
    if (newQuery !== search) {
      setSearch(newQuery);
      setSearchInput(newQuery);
      setPage(1);
    }
  }, [location]);

  const buildQueryKey = () => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (sortBy) params.append("sort", sortBy);
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    
    return `/api/products?${params.toString()}`;
  };

  const { data, isLoading } = useQuery<ProductsResponse>({
    queryKey: [buildQueryKey()],
    enabled: !!search,
  });

  const products = data?.products;
  const pagination = data?.pagination;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = searchInput.trim();
    if (trimmedQuery) {
      setSearch(trimmedQuery);
      setPage(1);
      navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, sortBy]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={search ? `Search: ${search} | Alectra Solutions` : "Search Products | Alectra Solutions"}
        description={`Search results for "${search}" - Find security and automation products at Alectra Solutions.`}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">
            {search ? `Search Results for "${search}"` : "Search Products"}
          </h1>
          {search && pagination && (
            <p className="text-muted-foreground">
              {pagination.total === 0 
                ? "No products found" 
                : `${pagination.total} product${pagination.total === 1 ? '' : 's'} found`}
            </p>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-2" data-testid="form-search">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <Button type="submit" data-testid="button-search-submit">
            Search
          </Button>
        </form>

        {search && (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]" data-testid="select-sort">
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

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={onAddToCart}
                    />
                  ))}
                </div>

                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      data-testid="button-prev-page"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Page {page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                      data-testid="button-next-page"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="text-muted-foreground mb-4">
                  <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-lg">No products found for "{search}"</p>
                  <p className="text-sm mt-2">Try a different search term or browse our categories</p>
                </div>
                <Link href="/collections/all">
                  <Button variant="outline" className="mt-4" data-testid="button-browse-all">
                    Browse All Products
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}

        {!search && (
          <div className="text-center py-16">
            <div className="text-muted-foreground mb-4">
              <SearchIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Enter a search term to find products</p>
              <p className="text-sm mt-2">Search for gate motors, CCTV cameras, electric fencing, and more</p>
            </div>
            <Link href="/collections/all">
              <Button variant="outline" className="mt-4" data-testid="button-browse-all-empty">
                Browse All Products
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
