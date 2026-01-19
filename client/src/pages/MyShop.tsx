import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, RotateCcw, ShoppingBag, Heart, Package, ChevronRight, Clock, Star, ShoppingCart, Trash2 } from "lucide-react";
import type { Product } from "@shared/schema";
import { SEO } from "@/components/SEO";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MyShopProps {
  onAddToCart: (product: Product, quantity?: number) => void;
}

export default function MyShop({ onAddToCart }: MyShopProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user } = useQuery<{ user: any | null }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: orders } = useQuery<any[]>({
    queryKey: ["/api/user/orders"],
    enabled: !!user?.user,
  });

  const { data: wishlistItems = [], isLoading: wishlistLoading } = useQuery<Product[]>({
    queryKey: ["/api/user/wishlist"],
    enabled: !!user?.user,
  });

  const { data: featuredProducts } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: (productId: string) => apiRequest("DELETE", `/api/user/wishlist/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/wishlist/ids"] });
      toast({
        title: "Removed from Wishlist",
        description: "Item removed from your wishlist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist",
        variant: "destructive",
      });
    },
  });

  const isLoggedIn = !!user?.user;

  return (
    <>
      <SEO 
        title="My Shop | Alectra Solutions"
        description="Quick access to your regulars, reorder previous purchases, and manage your shopping lists."
      />
      
      <div className="min-h-screen bg-muted/30 pb-24">
        <div className="bg-background border-b sticky top-0 z-40">
          <div className="px-4 py-4 space-y-3">
            <h1 className="text-2xl font-bold tracking-tight">MY SHOP</h1>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products and brands"
                className="pl-10 bg-muted/50"
                data-testid="input-myshop-search"
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-8">
          {isLoggedIn ? (
            <>
              <section>
                <Card className="overflow-hidden hover-elevate cursor-pointer bg-primary border-primary" data-testid="card-rapid-reorder">
                  <Link href="/account" data-testid="link-rapid-reorder">
                    <CardContent className="p-6 flex items-center gap-5">
                      <div className="h-14 w-14 rounded-lg bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                        <RotateCcw className="h-7 w-7 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-primary-foreground/80 font-medium">Quick Access</p>
                        <p className="font-bold text-2xl text-primary-foreground" data-testid="text-rapid-reorder">RAPID REORDER</p>
                        <p className="text-sm text-primary-foreground/70 mt-1">Reorder from your previous purchases</p>
                      </div>
                      <ChevronRight className="h-6 w-6 text-primary-foreground/60 flex-shrink-0" />
                    </CardContent>
                  </Link>
                </Card>
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                    <Heart className="h-5 w-5 text-rose-500" />
                    WISHLIST
                  </h2>
                  {wishlistItems.length > 0 && (
                    <span className="text-sm text-muted-foreground" data-testid="text-wishlist-count">
                      {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                
                {wishlistLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[1, 2].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="h-20 w-20 rounded-lg bg-muted" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-3/4" />
                            <div className="h-4 bg-muted rounded w-1/2" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : wishlistItems.length > 0 ? (
                  <div className="space-y-3">
                    {wishlistItems.map((product) => {
                      const isOutOfStock = product.stock === 0 || (product as any).discontinued === true;
                      return (
                        <Card key={product.id} className="hover-elevate" data-testid={`card-wishlist-${product.id}`}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Link href={`/products/${product.slug}`} data-testid={`link-wishlist-image-${product.id}`}>
                                <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                  <img
                                    src={product.imageUrl ? (product.imageUrl.startsWith('/') ? product.imageUrl : `/${product.imageUrl}`) : '/placeholder.svg'}
                                    alt={product.name || 'Product'}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                  />
                                </div>
                              </Link>
                              <div className="flex-1 min-w-0">
                                <Link href={`/products/${product.slug}`} data-testid={`link-wishlist-name-${product.id}`}>
                                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                                  <p className="font-medium line-clamp-2" data-testid={`text-wishlist-name-${product.id}`}>
                                    {product.name}
                                  </p>
                                  <p className="text-primary font-bold mt-1" data-testid={`text-wishlist-price-${product.id}`}>
                                    R {parseFloat(product.price).toFixed(2)}
                                  </p>
                                </Link>
                                {isOutOfStock && (
                                  <Badge variant="secondary" className="mt-1">Out of Stock</Badge>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  disabled={isOutOfStock}
                                  onClick={() => onAddToCart(product)}
                                  data-testid={`button-wishlist-add-to-cart-${product.id}`}
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-muted-foreground"
                                  onClick={() => removeFromWishlistMutation.mutate(product.id)}
                                  disabled={removeFromWishlistMutation.isPending}
                                  data-testid={`button-wishlist-remove-${product.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                      <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="font-medium">No saved items yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Items you save will appear here</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href="/collections/all">Browse Products</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </section>

              {orders && orders.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      RECENT ORDERS
                    </h2>
                    <Link href="/account" className="text-primary text-sm font-medium">View All</Link>
                  </div>
                  
                  <div className="space-y-3">
                    {orders.slice(0, 3).map((order: any) => (
                      <Card key={order.id} className="hover-elevate">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">Order #{order.orderNumber}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary">{order.status}</Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className="text-center py-12">
              <div className="max-w-sm mx-auto space-y-6">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <ShoppingBag className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">Welcome to My Shop</h2>
                  <p className="text-muted-foreground">
                    Sign in to access your order history, create shopping lists, and quickly reorder your favorite products.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button asChild size="lg" data-testid="button-signin-myshop">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button variant="outline" asChild size="lg" data-testid="button-register-myshop">
                    <Link href="/register">Create Account</Link>
                  </Button>
                </div>
                
                <Separator className="my-6" />
                
                <div className="text-left">
                  <h3 className="font-semibold mb-3 text-center">Popular Categories</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="hover-elevate">
                      <Link href="/collections/gate-motors" data-testid="link-category-gate-motors">
                        <CardContent className="p-4 text-center">
                          <p className="font-medium text-sm" data-testid="text-category-gate-motors">Gate Motors</p>
                        </CardContent>
                      </Link>
                    </Card>
                    <Card className="hover-elevate">
                      <Link href="/collections/electric-fencing" data-testid="link-category-electric-fencing">
                        <CardContent className="p-4 text-center">
                          <p className="font-medium text-sm" data-testid="text-category-electric-fencing">Electric Fencing</p>
                        </CardContent>
                      </Link>
                    </Card>
                    <Card className="hover-elevate">
                      <Link href="/collections/garage-door-motors" data-testid="link-category-garage-motors">
                        <CardContent className="p-4 text-center">
                          <p className="font-medium text-sm" data-testid="text-category-garage-motors">Garage Motors</p>
                        </CardContent>
                      </Link>
                    </Card>
                    <Card className="hover-elevate">
                      <Link href="/collections/cctv-systems" data-testid="link-category-cctv">
                        <CardContent className="p-4 text-center">
                          <p className="font-medium text-sm" data-testid="text-category-cctv">CCTV Systems</p>
                        </CardContent>
                      </Link>
                    </Card>
                  </div>
                </div>
              </div>
            </section>
          )}

          {featuredProducts && featuredProducts.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  RECOMMENDED
                </h2>
                <Link href="/collections/all" className="text-primary text-sm font-medium">See All</Link>
              </div>
              
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
                {featuredProducts.slice(0, 6).map((product) => (
                  <Card key={product.id} className="flex-shrink-0 w-40 snap-start hover-elevate">
                    <Link href={`/products/${product.slug}`}>
                      <div className="aspect-square overflow-hidden rounded-t-lg bg-muted">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground line-clamp-1">{product.brand}</p>
                        <p className="font-medium text-sm line-clamp-2 leading-tight">{product.name}</p>
                        <p className="text-primary font-bold mt-1">R {parseFloat(product.price).toFixed(2)}</p>
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
