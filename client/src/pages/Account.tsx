import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, MapPin, Package, RotateCcw, Truck, Clock, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserAddressSchema, type UserAddress, type Order, type OrderItem, type Product } from "@shared/schema";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

interface AccountProps {
  onAddToCart?: (product: Product, quantity?: number) => void;
}

export default function Account({ onAddToCart }: AccountProps) {
  const { toast } = useToast();
  const [location] = useLocation();
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [trackingOrder, setTrackingOrder] = useState<(Order & { items: OrderItem[] }) | null>(null);
  
  // Get initial tab from URL query parameter
  const getInitialTab = () => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["profile", "orders", "addresses"].includes(tab)) {
      return tab;
    }
    return "profile";
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab);
  
  // Update tab when URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && ["profile", "orders", "addresses"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [location]);

  const { data: user, isLoading: userLoading } = useQuery<{ user: any }>({
    queryKey: ["/api/auth/me"],
  });

  const { data: addresses, isLoading: addressesLoading } = useQuery<UserAddress[]>({
    queryKey: ["/api/user/addresses"],
    enabled: !!user?.user,
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Array<Order & { items: OrderItem[] }>>({
    queryKey: ["/api/user/orders"],
    enabled: !!user?.user,
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.user?.name || "",
      email: user?.user?.email || "",
      phone: user?.user?.phone || "",
    },
    values: user?.user ? {
      name: user.user.name,
      email: user.user.email,
      phone: user.user.phone || "",
    } : undefined,
  });

  const addressForm = useForm<z.infer<typeof insertUserAddressSchema>>({
    resolver: zodResolver(insertUserAddressSchema),
    defaultValues: {
      addressLine: "",
      city: "",
      province: "",
      postalCode: "",
      isDefault: false,
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/user/addresses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/addresses"] });
      toast({
        title: "Address deleted",
        description: "Address has been removed from your account",
      });
    },
  });

  const createAddressMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertUserAddressSchema>) => {
      const res = await apiRequest("POST", "/api/user/addresses", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/addresses"] });
      setIsAddressDialogOpen(false);
      addressForm.reset();
      toast({
        title: "Address added",
        description: "Your new address has been saved",
      });
    },
  });

  const onCreateAddress = (data: z.infer<typeof insertUserAddressSchema>) => {
    createAddressMutation.mutate(data);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "processing":
        return "default";
      case "shipped":
        return "default";
      case "delivered":
        return "default";
      default:
        return "secondary";
    }
  };

  const handleReorder = async (order: Order & { items: OrderItem[] }) => {
    if (!onAddToCart) {
      toast({
        title: "Unable to reorder",
        description: "Cart functionality is not available",
        variant: "destructive",
      });
      return;
    }

    let addedCount = 0;
    for (const item of order.items) {
      if (item.productId) {
        try {
          const res = await fetch(`/api/products/id/${item.productId}`);
          if (res.ok) {
            const product = await res.json();
            if (product && product.stock > 0) {
              onAddToCart(product, item.quantity);
              addedCount++;
            }
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        }
      }
    }

    if (addedCount > 0) {
      toast({
        title: "Added to cart",
        description: `${addedCount} item${addedCount !== 1 ? 's' : ''} added to your cart`,
      });
    } else {
      toast({
        title: "No items added",
        description: "The products from this order may no longer be available",
        variant: "destructive",
      });
    }
  };

  if (userLoading) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-12 w-48 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user?.user) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Account Access Required</CardTitle>
            <CardDescription>Please log in to view your account</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6" data-testid="heading-account">My Account</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3" data-testid="tabs-account">
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">Order History</TabsTrigger>
          <TabsTrigger value="addresses" data-testid="tab-addresses">Saved Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-name" disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-email" disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-phone" disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <p className="text-sm text-muted-foreground">
                    Profile editing will be available soon. Contact support to update your details.
                  </p>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Danger Zone - Account Deletion (POPIA Compliance) */}
          <Card className="mt-6 border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                In accordance with the Protection of Personal Information Act (POPIA), you have the right to request deletion of your personal data. 
                Deleting your account will remove your profile, saved addresses, wishlist items, and anonymize your order history.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" data-testid="button-delete-account">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete My Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-destructive">Delete Account Permanently?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. All your personal data will be permanently deleted including:
                    </DialogDescription>
                  </DialogHeader>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 my-4">
                    <li>Your profile and login credentials</li>
                    <li>All saved addresses</li>
                    <li>Your wishlist items</li>
                    <li>Trade application (if applicable)</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mb-4">
                    Order history will be anonymized for business records but personal details will be removed.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => {}}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={async () => {
                        try {
                          const response = await fetch('/api/user/account', { method: 'DELETE' });
                          if (response.ok) {
                            toast({
                              title: "Account Deleted",
                              description: "Your account has been permanently deleted.",
                            });
                            queryClient.clear();
                            window.location.href = '/';
                          } else {
                            const data = await response.json();
                            toast({
                              title: "Error",
                              description: data.message || "Failed to delete account",
                              variant: "destructive",
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to delete account. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                      data-testid="button-confirm-delete-account"
                    >
                      Yes, Delete My Account
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order History
              </CardTitle>
              <CardDescription>View your past orders and their status</CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : !orders || orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-orders">
                  No orders yet. Start shopping!
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 space-y-3"
                      data-testid={`order-${order.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm" data-testid={`order-id-${order.id}`}>
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("en-ZA", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <Badge variant={getStatusBadgeVariant(order.status)} data-testid={`status-${order.id}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        {order.items.map((item: any) => {
                          const imageUrl = item.productImage?.startsWith('/') 
                            ? item.productImage 
                            : item.productImage ? `/${item.productImage}` : null;
                          
                          return (
                            <div key={item.id} className="flex items-center gap-3" data-testid={`order-item-${item.id}`}>
                              {imageUrl && (
                                <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                  <img 
                                    src={imageUrl} 
                                    alt={item.productName || 'Product'} 
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm line-clamp-1" data-testid={`order-item-name-${item.id}`}>
                                  {item.productName || 'Unknown Product'}
                                </p>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">
                                  Qty: {item.quantity} ×&nbsp;R&nbsp;{item.priceAtPurchase}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <Separator />

                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span className="whitespace-nowrap" data-testid={`total-${order.id}`}>R&nbsp;{order.total}</span>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p>Deliver to: {order.customerName}</p>
                        <p>{order.deliveryAddress}, {order.deliveryCity}</p>
                        <p>{order.deliveryProvince}, {order.deliveryPostalCode}</p>
                      </div>

                      <div className="flex gap-2 mt-2">
                        <Button 
                          variant="outline" 
                          className={order.paymentStatus !== 'pending' ? "flex-1" : "w-full"}
                          onClick={() => handleReorder(order)}
                          data-testid={`button-reorder-${order.id}`}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Re order
                        </Button>
                        {order.paymentStatus !== 'pending' && (
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => setTrackingOrder(order)}
                            data-testid={`button-track-${order.id}`}
                          >
                            <Truck className="h-4 w-4 mr-2" />
                            Track order
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Saved Addresses
                  </CardTitle>
                  <CardDescription>Manage your delivery addresses</CardDescription>
                </div>
                <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-address">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Address
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Address</DialogTitle>
                      <DialogDescription>Add a new delivery address to your account</DialogDescription>
                    </DialogHeader>
                    <Form {...addressForm}>
                      <form onSubmit={addressForm.handleSubmit(onCreateAddress)} className="space-y-4">
                        <FormField
                          control={addressForm.control}
                          name="addressLine"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Street Address</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="123 Main Street" data-testid="input-address-line" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={addressForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Johannesburg" data-testid="input-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={addressForm.control}
                          name="province"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Province</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Gauteng" data-testid="input-province" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={addressForm.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="2000" data-testid="input-postal-code" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={addressForm.control}
                          name="isDefault"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-4 w-4"
                                  data-testid="checkbox-default"
                                />
                              </FormControl>
                              <FormLabel className="!mt-0">Set as default address</FormLabel>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" className="w-full" disabled={createAddressMutation.isPending} data-testid="button-save-address">
                          {createAddressMutation.isPending ? "Saving..." : "Save Address"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {addressesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : !addresses || addresses.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground" data-testid="text-no-addresses">
                  No saved addresses. Add your first address above.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className="border rounded-lg p-4 space-y-3"
                      data-testid={`address-${address.id}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {address.isDefault && (
                            <Badge className="mb-2" data-testid={`badge-default-${address.id}`}>Default</Badge>
                          )}
                          <p className="font-medium">{address.addressLine}</p>
                          <p className="text-sm text-muted-foreground">
                            {address.city}, {address.province}
                          </p>
                          <p className="text-sm text-muted-foreground">{address.postalCode}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteAddressMutation.mutate(address.id)}
                          disabled={deleteAddressMutation.isPending}
                          data-testid={`button-delete-${address.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Track Order Dialog */}
      <Dialog open={!!trackingOrder} onOpenChange={(open) => !open && setTrackingOrder(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Track Your Order
            </DialogTitle>
            <DialogDescription>
              Order #{trackingOrder?.id.slice(0, 8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Order Status Badge */}
            <div className="flex justify-center">
              <Badge 
                variant={getStatusBadgeVariant(trackingOrder?.status || 'pending')} 
                className="text-sm px-4 py-1"
              >
                {trackingOrder?.status ? trackingOrder.status.charAt(0).toUpperCase() + trackingOrder.status.slice(1) : 'Pending'}
              </Badge>
            </div>

            {/* Status Timeline */}
            <div className="relative">
              <div className="flex justify-between items-center mb-2">
                <div className="flex flex-col items-center flex-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    trackingOrder?.status ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Package className="h-4 w-4" />
                  </div>
                  <span className="text-xs mt-1 text-center">Received</span>
                </div>
                <div className="flex-1 h-0.5 bg-muted mx-1">
                  <div className={`h-full transition-all ${
                    ['processing', 'shipped', 'delivered'].includes(trackingOrder?.status || '') ? 'bg-primary w-full' : 'w-0'
                  }`} />
                </div>
                <div className="flex flex-col items-center flex-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    ['processing', 'shipped', 'delivered'].includes(trackingOrder?.status || '') ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <span className="text-xs mt-1 text-center">Processing</span>
                </div>
                <div className="flex-1 h-0.5 bg-muted mx-1">
                  <div className={`h-full transition-all ${
                    ['shipped', 'delivered'].includes(trackingOrder?.status || '') ? 'bg-primary w-full' : 'w-0'
                  }`} />
                </div>
                <div className="flex flex-col items-center flex-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    ['shipped', 'delivered'].includes(trackingOrder?.status || '') ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <Truck className="h-4 w-4" />
                  </div>
                  <span className="text-xs mt-1 text-center">Shipped</span>
                </div>
                <div className="flex-1 h-0.5 bg-muted mx-1">
                  <div className={`h-full transition-all ${
                    trackingOrder?.status === 'delivered' ? 'bg-primary w-full' : 'w-0'
                  }`} />
                </div>
                <div className="flex flex-col items-center flex-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    trackingOrder?.status === 'delivered' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="text-xs mt-1 text-center">Delivered</span>
                </div>
              </div>
            </div>

            <Separator />

            {trackingOrder?.trackingLink ? (
              // Order has tracking link
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Truck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Your order is on the way!</p>
                    <p className="text-sm text-muted-foreground">
                      Track your shipment using the link below
                    </p>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  asChild
                  data-testid="button-tracking-link"
                >
                  <a href={trackingOrder.trackingLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Tracking Details
                  </a>
                </Button>
              </div>
            ) : (
              // Order is still processing
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">Your order was received</p>
                    <p className="text-sm text-muted-foreground">
                      We are processing your order and will update you when it ships
                    </p>
                  </div>
                </div>
                
                <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
                  <p>You will receive an email with tracking information once your order is dispatched.</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
