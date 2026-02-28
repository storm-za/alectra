import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, X, ShoppingCart, Trash2, ShieldCheck, Truck, PartyPopper } from "lucide-react";
import { Link } from "wouter";
import { ProductImage } from "@/components/OptimizedImage";
import type { CartItem, CartVariantType, TorsionSpringVariant } from "@shared/schema";
import { TORSION_SPRING_VARIANTS } from "@shared/schema";

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number, variant?: CartVariantType) => void;
  onRemoveItem: (productId: string, variant?: CartVariantType) => void;
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
  const FREE_SHIPPING_THRESHOLD = 2500;

  const total = items.reduce((sum, item) => {
    const price = getItemPrice(item);
    return sum + price * item.quantity;
  }, 0);

  const vat = total * (15 / 115);
  const subtotal = total - vat;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const progress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);
  const hasUnlockedFreeShipping = total >= FREE_SHIPPING_THRESHOLD;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b bg-muted/30">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Basket
            <Badge variant="secondary" className="ml-1">{items.length}</Badge>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <ShoppingCart className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Your basket is empty</h3>
            <p className="text-muted-foreground text-sm mb-6">Add items to get started</p>
            <Button onClick={() => onOpenChange(false)} size="lg" data-testid="button-continue-shopping-empty">
              Start Shopping
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {items.map((item) => {
                const itemKey = getCartItemKey(item);
                const itemPrice = getItemPrice(item);
                const lineTotal = (itemPrice * item.quantity).toFixed(2);
                const imageUrl = item.product.imageUrl.startsWith('/') ? item.product.imageUrl : `/${item.product.imageUrl}`;

                return (
                  <Card key={itemKey} className="overflow-hidden" data-testid={`cart-item-${itemKey}`}>
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          <ProductImage
                            src={imageUrl}
                            alt={item.product.name}
                            size="small"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm line-clamp-2 leading-tight" data-testid={`text-cart-item-name-${itemKey}`}>
                              {item.product.name}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveItem(item.product.id, item.variant)}
                              data-testid={`button-remove-item-${itemKey}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <p className="text-xs text-muted-foreground">{item.product.brand}</p>
                            {item.variant && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {item.variant === 'exchange' ? 'Exchange' : 
                                 item.variant === 'new' ? 'New Cylinder' :
                                 /^\d{4}mm-(smooth|woodgrain)$/.test(item.variant as string) 
                                   ? `${(item.variant as string).split('-')[0]} / ${(item.variant as string).split('-')[1] === 'smooth' ? 'Smooth' : 'Woodgrain'}`
                                   : TORSION_SPRING_VARIANTS[item.variant as TorsionSpringVariant] 
                                   ? `${TORSION_SPRING_VARIANTS[item.variant as TorsionSpringVariant].weight} ${TORSION_SPRING_VARIANTS[item.variant as TorsionSpringVariant].winding === 'left' ? 'Left' : 'Right'}`
                                   : item.variant}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center border rounded-lg bg-muted/50">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.variant)}
                                data-testid={`button-decrease-quantity-${itemKey}`}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-6 text-center text-sm font-medium" data-testid={`text-quantity-${itemKey}`}>
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.variant)}
                                disabled={item.quantity >= item.product.stock}
                                data-testid={`button-increase-quantity-${itemKey}`}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <span className="font-bold whitespace-nowrap" data-testid={`text-line-total-${itemKey}`}>
                              R&nbsp;{lineTotal}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Free shipping progress */}
            <div
              className="px-4 py-3 border-t"
              style={{
                background: hasUnlockedFreeShipping
                  ? "linear-gradient(135deg, rgba(21,128,61,0.12) 0%, rgba(22,163,74,0.07) 100%)"
                  : "linear-gradient(135deg, rgba(37,99,235,0.07) 0%, rgba(29,78,216,0.04) 100%)",
                borderColor: hasUnlockedFreeShipping ? "rgba(21,128,61,0.25)" : "rgba(37,99,235,0.12)",
              }}
              data-testid="free-shipping-progress"
            >
              {hasUnlockedFreeShipping ? (
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-full"
                    style={{ width: 32, height: 32, background: "rgba(21,128,61,0.15)" }}
                  >
                    <PartyPopper className="h-4 w-4" style={{ color: "#16a34a" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#15803d" }}>
                      You've unlocked FREE delivery!
                    </p>
                    <p className="text-xs" style={{ color: "#166534" }}>
                      Enjoy free nationwide delivery on this order.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground">You're almost there!</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                      R&nbsp;{remaining.toFixed(2)} away
                    </span>
                  </div>

                  <div className="relative h-2.5 rounded-full overflow-hidden bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${progress}%`,
                        background: "linear-gradient(90deg, #2563eb 0%, #1d4ed8 60%, #7c3aed 100%)",
                        boxShadow: progress > 5 ? "0 0 8px rgba(37,99,235,0.45)" : "none",
                      }}
                      data-testid="free-shipping-bar"
                    />
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${progress}%`,
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)",
                        backgroundSize: "200% 100%",
                        animation: progress > 0 && progress < 100 ? "shimmer 2s infinite" : "none",
                      }}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground" data-testid="free-shipping-message">
                    Add&nbsp;<span className="font-semibold text-foreground whitespace-nowrap">R&nbsp;{remaining.toFixed(2)}</span>&nbsp;more for{" "}
                    <span className="font-semibold text-primary">FREE delivery</span>
                  </p>
                </div>
              )}
            </div>

            <div className="border-t bg-muted/30 px-6 py-4 space-y-4">
              <div className="flex items-center gap-4 text-xs text-muted-foreground pb-2">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Secure checkout</span>
                </div>
                <div className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" />
                  <span>Fast delivery</span>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="whitespace-nowrap" data-testid="text-subtotal">R&nbsp;{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (15%)</span>
                  <span className="whitespace-nowrap" data-testid="text-vat">R&nbsp;{vat.toFixed(2)}</span>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold whitespace-nowrap" data-testid="text-total">R&nbsp;{total.toFixed(2)}</span>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Link href="/checkout">
                  <a className="w-full">
                    <Button 
                      className="w-full h-12 text-base font-semibold" 
                      size="lg"
                      onClick={() => onOpenChange(false)}
                      data-testid="button-checkout"
                    >
                      Checkout
                    </Button>
                  </a>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={() => onOpenChange(false)}
                  className="text-muted-foreground"
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
