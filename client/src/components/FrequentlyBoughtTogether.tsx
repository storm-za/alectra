import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronRight } from "lucide-react";
import type { Product } from "@shared/schema";

interface FrequentlyBoughtTogetherProps {
  currentProductId: string;
  categorySlug: string | null;
}

interface ProductsResponse {
  products: Product[];
  totalPages: number;
  currentPage: number;
}

export function FrequentlyBoughtTogether({ currentProductId, categorySlug }: FrequentlyBoughtTogetherProps) {
  // Fetch related products from same category
  const { data: categoryData, isLoading: categoryLoading } = useQuery<ProductsResponse>({
    queryKey: ['/api/products', 'related', categorySlug],
    queryFn: async () => {
      const response = await fetch(`/api/products?categorySlug=${categorySlug}&limit=8`);
      if (!response.ok) throw new Error('Failed to fetch related products');
      return response.json();
    },
    enabled: !!categorySlug,
  });
  
  // Fallback: fetch featured products if no category
  const { data: featuredData, isLoading: featuredLoading } = useQuery<ProductsResponse>({
    queryKey: ['/api/products', 'featured', 'fallback'],
    queryFn: async () => {
      const response = await fetch(`/api/products?featured=true&limit=8`);
      if (!response.ok) throw new Error('Failed to fetch featured products');
      return response.json();
    },
    enabled: !categorySlug,
  });
  
  const isLoading = categorySlug ? categoryLoading : featuredLoading;
  const relatedProducts = categorySlug ? (categoryData?.products || []) : (featuredData?.products || []);

  // Filter out current product and limit to 6 items
  const filteredProducts = relatedProducts
    .filter(p => p.id !== currentProductId)
    .slice(0, 6);

  // Don't render if no related products found at all
  if (!isLoading && filteredProducts.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-8 border-t" data-testid="section-frequently-bought">
        <h2 className="text-xl font-bold mb-6">Frequently Bought Together</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 border-t" data-testid="section-frequently-bought">
      <h2 className="text-xl font-bold mb-6">Frequently Bought Together</h2>
      
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {filteredProducts.map((product) => {
            const imageUrl = product.imageUrl.startsWith('/') ? product.imageUrl : `/${product.imageUrl}`;
            return (
            <CarouselItem
              key={product.id}
              className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4"
              data-testid={`related-product-${product.slug}`}
            >
              <Link href={`/products/${product.slug}`}>
                <Card className="h-full hover-elevate cursor-pointer overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-square overflow-hidden bg-muted">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-3">
                      <h3 className="font-medium text-sm line-clamp-2 mb-2" data-testid="text-product-name">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-primary" data-testid="text-product-price">
                          R{parseFloat(product.price).toFixed(2)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
            );
          })}
        </CarouselContent>
        {filteredProducts.length > 4 && (
          <>
            <CarouselPrevious className="-left-3 md:-left-5 bg-background/90 backdrop-blur-sm" />
            <CarouselNext className="-right-3 md:-right-5 bg-background/90 backdrop-blur-sm" />
          </>
        )}
      </Carousel>
    </section>
  );
}
