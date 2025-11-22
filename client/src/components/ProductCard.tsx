import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { StarRating } from "@/components/StarRating";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const displayPrice = parseFloat(product.price).toFixed(2);
  const isDiscontinued = (product as any).discontinued === true;
  const isLowStock = product.stock > 0 && product.stock <= 5 && !isDiscontinued;
  const isOutOfStock = product.stock === 0 || isDiscontinued;

  const imageUrl = product.imageUrl.startsWith('/') ? product.imageUrl : `/${product.imageUrl}`;

  // Fetch rating data for this product
  const { data: ratingData } = useQuery<{ averageRating: number; totalReviews: number }>({
    queryKey: ["/api/products", product.slug, "rating"],
  });

  return (
    <Card className="group overflow-hidden hover-elevate active-elevate-2 flex flex-col h-full" data-testid={`card-product-${product.id}`}>
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
          {product.featured && (
            <Badge className="absolute top-3 left-3" data-testid="badge-featured">
              Featured
            </Badge>
          )}
          {isLowStock && !isOutOfStock && (
            <Badge variant="destructive" className="absolute top-3 right-3" data-testid="badge-low-stock">
              Low Stock
            </Badge>
          )}
          {isDiscontinued && (
            <Badge variant="secondary" className="absolute top-3 right-3" data-testid="badge-discontinued">
              Discontinued
            </Badge>
          )}
          {isOutOfStock && !isDiscontinued && (
            <Badge variant="secondary" className="absolute top-3 right-3" data-testid="badge-out-of-stock">
              Out of Stock
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="flex-1 p-2 sm:p-4 space-y-1 sm:space-y-2">
        <div className="text-xs text-muted-foreground font-medium line-clamp-1">{product.brand}</div>
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-semibold text-sm sm:text-base line-clamp-2 hover:text-primary transition-colors" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
        </Link>
        {ratingData && ratingData.totalReviews > 0 && (
          <div data-testid={`rating-${product.id}`}>
            <StarRating
              rating={ratingData.averageRating}
              size="sm"
              showNumber
              totalReviews={ratingData.totalReviews}
            />
          </div>
        )}
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2">
          <span className="text-lg sm:text-2xl font-bold text-foreground" data-testid={`text-price-${product.id}`}>
            R {displayPrice}
          </span>
          <span className="text-xs text-muted-foreground">VAT inc.</span>
        </div>
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
        <Link href={`/product/${product.slug}`} className="w-full">
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
