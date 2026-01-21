import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useCallback, useRef, useEffect } from "react";
import { WishlistButton } from "@/components/WishlistButton";
import { ProductImage, getOptimizedImageUrl } from "@/components/OptimizedImage";
import { FREE_SHIPPING_PRODUCT_IDS, type Product } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

// Cache for preloaded images to avoid repeated allocations
const preloadedImages = new Map<string, boolean>();

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const displayPrice = parseFloat(product.price).toFixed(2);
  const priceValue = parseFloat(product.price);
  const isDiscontinued = (product as any).discontinued === true || priceValue === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5 && !isDiscontinued;
  const isOutOfStock = product.stock === 0 || isDiscontinued;
  const hasFreeShipping = FREE_SHIPPING_PRODUCT_IDS.includes(product.id);

  const imageUrl = product.imageUrl.startsWith('/') ? product.imageUrl : `/${product.imageUrl}`;
  const prefetchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const isMountedRef = useRef(true);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);

  // Prefetch product data and image on hover for instant navigation
  const prefetchProduct = useCallback((e?: React.PointerEvent | React.MouseEvent) => {
    // On touch devices, only prefetch on tap (not scroll)
    if (e && 'pointerType' in e && e.pointerType === 'touch') {
      return;
    }
    
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }
    
    // Small delay to avoid prefetching on quick mouse passes
    prefetchTimeoutRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      
      // Prefetch product data for instant navigation
      queryClient.prefetchQuery({
        queryKey: ["/api/products", product.slug],
        staleTime: 60000,
      });
      
      // Preload the main product image at large size
      const largeImageUrl = getOptimizedImageUrl(imageUrl, 800);
      if (!preloadedImages.has(largeImageUrl)) {
        preloadedImages.set(largeImageUrl, true);
        const img = new Image();
        img.src = largeImageUrl;
      }
    }, 150);
  }, [product.slug, imageUrl]);

  const cancelPrefetch = useCallback(() => {
    if (prefetchTimeoutRef.current) {
      clearTimeout(prefetchTimeoutRef.current);
    }
  }, []);

  return (
    <Card 
      className="group overflow-hidden hover-elevate active-elevate-2 flex flex-col h-full" 
      data-testid={`card-product-${product.id}`}
      onPointerEnter={prefetchProduct}
      onPointerLeave={cancelPrefetch}
    >
      <div className="relative">
        <Link href={`/products/${product.slug}`}>
          <div className="relative aspect-square overflow-hidden bg-muted">
            <ProductImage
              src={imageUrl}
              alt={product.name}
              size="medium"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
            />
            {product.featured && (
              <Badge className="absolute top-3 left-3" data-testid="badge-featured">
                Featured
              </Badge>
            )}
            {isLowStock && !isOutOfStock && (
              <Badge variant="destructive" className="absolute top-3 right-12" data-testid="badge-low-stock">
                Low Stock
              </Badge>
            )}
            {isDiscontinued && (
              <Badge variant="secondary" className="absolute top-3 right-12" data-testid="badge-discontinued">
                Discontinued
              </Badge>
            )}
            {isOutOfStock && !isDiscontinued && (
              <Badge variant="secondary" className="absolute top-3 right-12" data-testid="badge-out-of-stock">
                Out of Stock
              </Badge>
            )}
          </div>
        </Link>
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton 
            productId={product.id} 
            className="bg-background/80 backdrop-blur-sm"
          />
        </div>
      </div>

      <CardContent className="flex-1 p-2 sm:p-4 space-y-1 sm:space-y-2">
        <div className="text-xs text-muted-foreground font-medium line-clamp-1">{product.brand}</div>
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2">
          <span className="text-lg sm:text-2xl font-bold text-foreground" data-testid={`text-price-${product.id}`}>
            R {displayPrice}
          </span>
          <span className="text-xs text-muted-foreground">VAT inc.</span>
        </div>
        {hasFreeShipping && (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 w-fit" data-testid={`badge-free-shipping-${product.id}`}>
            Free Shipping
          </Badge>
        )}
      </CardContent>

      <CardFooter className="p-2 sm:p-4 pt-0 flex flex-col gap-2">
        <Button
          onClick={(e) => {
            e.preventDefault();
            onAddToCart(product);
          }}
          disabled={isOutOfStock}
          className="w-full"
          data-testid={`button-add-to-cart-${product.id}`}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isDiscontinued ? 'Discontinued' : isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
        <Link href={`/products/${product.slug}`} className="w-full">
          <Button 
            variant="outline" 
            className="w-full"
            data-testid={`button-view-details-${product.id}`}
          >
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
