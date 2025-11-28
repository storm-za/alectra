import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, X } from "lucide-react";
import { Link } from "wouter";
import type { CartItem, ProductVariant } from "@shared/schema";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, variant?: ProductVariant) => void;
  onRemoveItem: (productId: string, variant?: ProductVariant) => void;
}

// Helper to get unique key for cart item
const getCartItemKey = (item: CartItem) => {
  return item.variant ? `${item.product.id}-${item.variant}` : item.product.id;
};

// Helper to get display price (variant price or product price)
const getItemPrice = (item: CartItem) => {
  return item.variantPrice ? parseFloat(item.variantPrice) : parseFloat(item.product.price);
};

export default function CartDrawer({
  open,
  onOpenChange,
  items,
  onUpdateQuantity,
  onRemoveItem,
}: CartDrawerProps) {
  const total = items.reduce((sum, item) => {
    const price = getItemPrice(item);
    return sum + price * item.quantity;
  }, 0);

  const vat = total * (15 / 115);
  const subtotal = total - vat;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Shopping Cart ({items.length})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => onOpenChange(false)} data-testid="button-continue-shopping-empty">
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-6 space-y-4">
              {items.map((item) => {
                const itemKey = getCartItemKey(item);
                const itemPrice = getItemPrice(item);
                const lineTotal = (itemPrice * item.quantity).toFixed(2);
                const imageUrl = item.product.imageUrl.startsWith('/') ? item.product.imageUrl : `/${item.product.imageUrl}`;

                return (
                  <div key={itemKey} className="flex gap-4" data-testid={`cart-item-${itemKey}`}>
                    <img
                      src={imageUrl}
                      alt={item.product.name}
                      className="w-20 h-20 object-cover rounded-md bg-muted"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2" data-testid={`text-cart-item-name-${itemKey}`}>
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">{item.product.brand}</p>
                        {item.variant && (
                          <Badge variant="secondary" className="text-xs">
                            {item.variant === 'exchange' ? 'Exchange' : 'New Cylinder'}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border rounded-md">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.variant)}
                            data-testid={`button-decrease-quantity-${itemKey}`}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm" data-testid={`text-quantity-${itemKey}`}>
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.variant)}
                            disabled={item.quantity >= item.product.stock}
                            data-testid={`button-increase-quantity-${itemKey}`}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <span className="font-semibold text-sm" data-testid={`text-line-total-${itemKey}`}>
                          R {lineTotal}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRemoveItem(item.product.id, item.variant)}
                      data-testid={`button-remove-item-${itemKey}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span data-testid="text-subtotal">R {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>VAT (15%)</span>
                <span data-testid="text-vat">R {vat.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span data-testid="text-total">R {total.toFixed(2)}</span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link href="/checkout">
                  <a className="w-full">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => onOpenChange(false)}
                      data-testid="button-checkout"
                    >
                      Proceed to Checkout
                    </Button>
                  </a>
                </Link>
                <Button 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  data-testid="button-continue-shopping"
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
