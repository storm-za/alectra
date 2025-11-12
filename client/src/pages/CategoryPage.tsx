import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useState } from "react";
import ProductCard from "@/components/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product, Category } from "@shared/schema";

interface CategoryPageProps {
  onAddToCart: (product: Product) => void;
}

export default function CategoryPage({ onAddToCart }: CategoryPageProps) {
  const [, params] = useRoute("/category/:slug");
  const [sortBy, setSortBy] = useState("name");

  const { data: category, isLoading: categoryLoading } = useQuery<Category>({
    queryKey: ["/api/categories", params?.slug],
    enabled: !!params?.slug,
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/categories", params?.slug, "products"],
    enabled: !!params?.slug,
  });

  const sortedProducts = products
    ? [...products].sort((a, b) => {
        if (sortBy === "price-asc") {
          return parseFloat(a.price) - parseFloat(b.price);
        } else if (sortBy === "price-desc") {
          return parseFloat(b.price) - parseFloat(a.price);
        } else {
          return a.name.localeCompare(b.name);
        }
      })
    : [];

  const isLoading = categoryLoading || productsLoading;

  if (!isLoading && !category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Category not found</h1>
          <Link href="/">
            <a className="text-primary hover:underline">Back to home</a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        {/* Breadcrumb */}
        <Link href="/">
          <a className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ChevronLeft className="h-4 w-4" />
            Back to Home
          </a>
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
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

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
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
  );
}
