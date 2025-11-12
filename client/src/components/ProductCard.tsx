import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const priceWithVAT = (parseFloat(product.price) * 1.15).toFixed(2);
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  return (
    <Card className="group overflow-hidden hover-elevate active-elevate-2 flex flex-col h-full" data-testid={`card-product-${product.id}`}>
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
          {isOutOfStock && (
            <Badge variant="secondary" className="absolute top-3 right-3" data-testid="badge-out-of-stock">
              Out of Stock
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="flex-1 p-4 space-y-2">
        <div className="text-xs text-muted-foreground font-medium">{product.brand}</div>
        <Link href={`/product/${product.slug}`}>
          <h3 className="font-semibold text-base line-clamp-2 hover:text-primary transition-colors" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h3>
        </Link>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground" data-testid={`text-price-${product.id}`}>
            R {priceWithVAT}
          </span>
          <span className="text-xs text-muted-foreground">VAT inc.</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-2">
        <Link href={`/product/${product.slug}`} className="flex-1">
          <Button 
            variant="outline" 
            className="w-full"
            data-testid={`button-view-details-${product.id}`}
          >
            View Details
          </Button>
        </Link>
        <Button
          onClick={(e) => {
            e.preventDefault();
            onAddToCart(product);
          }}
          disabled={isOutOfStock}
          className="flex-1"
          data-testid={`button-add-to-cart-${product.id}`}
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </CardFooter>
    </Card>
  );
}
