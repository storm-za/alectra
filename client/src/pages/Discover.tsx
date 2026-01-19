import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Tag, TrendingUp, Zap, ChevronRight } from "lucide-react";
import { SEO } from "@/components/SEO";
import type { Category, Product } from "@shared/schema";

export default function Discover() {
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: featuredProducts, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  // Get recommended products (featured products)
  const recommendedProducts = Array.isArray(featuredProducts) ? featuredProducts.slice(0, 8) : [];

  return (
    <>
      <SEO 
        title="Discover | Alectra Solutions"
        description="Explore our latest products, deals, and trending security solutions."
      />
      
      <div className="min-h-screen bg-muted/30 pb-24">
        {/* Sticky Header with Search */}
        <div className="bg-background border-b sticky top-0 z-40">
          <div className="px-4 py-4 space-y-3">
            <h1 className="text-2xl font-bold tracking-tight">Discover</h1>
            
            <Link href="/search" data-testid="link-search-bar">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products and brands"
                  className="pl-10 bg-muted/50 cursor-pointer"
                  readOnly
                  data-testid="input-discover-search"
                />
              </div>
            </Link>
          </div>
        </div>

        <div className="space-y-0">
          {/* Categories List */}
          <section className="bg-background">
            {categoriesLoading ? (
              <div className="divide-y">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="px-4 py-3 flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-5 w-5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y">
                {categories?.map((category) => {
                  const imageUrl = category.imageUrl?.startsWith('/') 
                    ? category.imageUrl 
                    : `/${category.imageUrl}`;
                  
                  return (
                    <Link 
                      key={category.id} 
                      href={`/collections/${category.slug}`}
                      data-testid={`link-category-${category.slug}`}
                    >
                      <div className="px-4 py-3 flex items-center gap-4 hover-elevate">
                        <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                          {category.imageUrl ? (
                            <img 
                              src={imageUrl}
                              alt={category.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-primary/10" />
                          )}
                        </div>
                        <span className="font-medium flex-1" data-testid={`text-category-${category.slug}`}>
                          {category.name}
                        </span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick Action Buttons */}
          <section className="px-4 py-6 bg-muted/30">
            <div className="grid grid-cols-4 gap-2">
              <Card className="hover-elevate">
                <Link href="/collections/all?sort=popular" data-testid="link-trending">
                  <CardContent className="p-3 text-center">
                    <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="font-medium text-xs" data-testid="text-trending">Trending</p>
                  </CardContent>
                </Link>
              </Card>
              <Card className="hover-elevate">
                <Link href="/collections/all?filter=deals" data-testid="link-deals">
                  <CardContent className="p-3 text-center">
                    <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-2">
                      <Tag className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="font-medium text-xs" data-testid="text-deals">Deals</p>
                  </CardContent>
                </Link>
              </Card>
              <Card className="hover-elevate">
                <Link href="/collections/all?sort=newest" data-testid="link-new-arrivals">
                  <CardContent className="p-3 text-center">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-2">
                      <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="font-medium text-xs" data-testid="text-new-arrivals">New</p>
                  </CardContent>
                </Link>
              </Card>
              <Card className="hover-elevate">
                <Link href="/search" data-testid="link-search">
                  <CardContent className="p-3 text-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-2">
                      <Search className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="font-medium text-xs" data-testid="text-search">Search</p>
                  </CardContent>
                </Link>
              </Card>
            </div>
          </section>

          {/* Recommended Products */}
          <section className="px-4 py-6 bg-background">
            <h2 className="text-lg font-bold mb-4" data-testid="text-recommended-heading">
              Recommended for You
            </h2>
            
            {productsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[...Array(4)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-3">
                      <Skeleton className="aspect-square w-full mb-2 rounded-lg" />
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recommendedProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-products">
                <p>No products available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recommendedProducts.map((product) => {
                  const imageUrl = product.imageUrl?.startsWith('/') 
                    ? product.imageUrl 
                    : `/${product.imageUrl}`;
                  
                  return (
                    <Card key={product.id} className="overflow-hidden hover-elevate">
                      <Link href={`/products/${product.slug}`} data-testid={`link-product-${product.id}`}>
                        <CardContent className="p-0">
                          <div className="aspect-square bg-muted overflow-hidden">
                            <img 
                              src={imageUrl}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="p-3">
                            <p className="font-medium text-sm line-clamp-2 leading-tight mb-1" data-testid={`text-product-name-${product.id}`}>
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground mb-1" data-testid={`text-product-brand-${product.id}`}>{product.brand}</p>
                            <p className="font-bold text-sm" data-testid={`text-product-price-${product.id}`}>
                              R {(typeof product.price === 'number' ? product.price : Number(product.price) || 0).toFixed(2)}
                            </p>
                          </div>
                        </CardContent>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
