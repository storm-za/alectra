import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CartItem, UserAddress, PaystackInitializeResponse, PaystackVerifyResponse } from "@shared/schema";
import { MapPin, BadgePercent, User, Mail, Phone, Home, Shield, Lock, Truck, CreditCard, Gift, Snowflake, Star } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const checkoutSchema = z.object({
  deliveryMethod: z.enum(["delivery", "pickup"]),
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Invalid phone number"),
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryProvince: z.string().optional(),
  deliveryPostalCode: z.string().optional(),
  isGift: z.boolean().default(false),
  giftMessage: z.string().optional(),
}).refine((data) => {
  if (data.deliveryMethod === "delivery") {
    return !!(data.deliveryAddress && data.deliveryCity && data.deliveryProvince && data.deliveryPostalCode);
  }
  return true;
}, {
  message: "Delivery address is required when delivery method is selected",
  path: ["deliveryAddress"],
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutProps {
  cartItems: CartItem[];
  onClearCart: () => void;
}

export default function Checkout({ cartItems, onClearCart }: CheckoutProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");

  const { data: user } = useQuery<{ user: any | null }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: addresses } = useQuery<UserAddress[]>({
    queryKey: ["/api/user/addresses"],
    enabled: !!user?.user,
  });

  const { data: tradeStatus } = useQuery<{
    hasApplication: boolean;
    approved: boolean;
  }>({
    queryKey: ["/api/trade/status"],
    enabled: !!user?.user,
  });

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      deliveryMethod: "delivery",
      customerName: user?.user?.name || "",
      customerEmail: user?.user?.email || "",
      customerPhone: user?.user?.phone || "",
      deliveryAddress: "",
      deliveryCity: "",
      deliveryProvince: "",
      deliveryPostalCode: "",
      isGift: false,
      giftMessage: "",
    },
    values: user?.user ? {
      deliveryMethod: "delivery",
      customerName: user.user.name,
      customerEmail: user.user.email,
      customerPhone: user.user.phone || "",
      deliveryAddress: "",
      deliveryCity: "",
      deliveryProvince: "",
      deliveryPostalCode: "",
      isGift: false,
      giftMessage: "",
    } : undefined,
  });

  const deliveryMethod = form.watch("deliveryMethod");
  const isGift = form.watch("isGift");

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId);
    const address = addresses?.find((a) => a.id === addressId);
    if (address) {
      form.setValue("deliveryAddress", address.addressLine);
      form.setValue("deliveryCity", address.city);
      form.setValue("deliveryProvince", address.province);
      form.setValue("deliveryPostalCode", address.postalCode);
    }
  };

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const orderData = {
        ...data,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          variant: item.variant,
          variantPrice: item.variantPrice,
        })),
      };

      const res = await apiRequest("POST", "/api/orders", orderData);
      return await res.json();
    },
    onSuccess: async (orderResult: { order: any; items: any[] }) => {
      try {
        const order = orderResult.order;

        // Initialize payment via backend (required for 3D Secure)
        const initResponse = await apiRequest("POST", "/api/payment/initialize", {
          orderId: order.id,
        });
        const initData = await initResponse.json();

        if (!initData.accessCode) {
          toast({
            title: "Payment Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Use Paystack Popup with newTransaction (this properly fires onSuccess callback)
        const PaystackPop = (window as any).PaystackPop;
        if (!PaystackPop) {
          toast({
            title: "Payment Error",
            description: "Payment system not loaded. Please refresh and try again.",
            variant: "destructive",
          });
          return;
        }

        const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
        if (!publicKey) {
          toast({
            title: "Configuration Error",
            description: "Payment system not configured. Please contact support.",
            variant: "destructive",
          });
          return;
        }

        const popup = new PaystackPop();
        popup.newTransaction({
          key: publicKey,
          email: order.customerEmail,
          amount: Math.round(parseFloat(order.total as any) * 100), // Paystack expects kobo (cents)
          currency: "ZAR",
          reference: initData.reference,
          onSuccess: (paystackResponse: any) => {
            // Verify payment on backend
            apiRequest("GET", `/api/payment/verify/${paystackResponse.reference}`)
              .then(verifyRes => verifyRes.json())
              .then((verifyData: PaystackVerifyResponse) => {
                if (verifyData.status === "success" && verifyData.data) {
                  toast({
                    title: "Payment Successful!",
                    description: "Your order has been confirmed and paid.",
                  });
                  onClearCart();
                  navigate(`/order-success?reference=${paystackResponse.reference}&orderId=${verifyData.data.orderId}`);
                } else {
                  toast({
                    title: "Payment Failed",
                    description: verifyData.message || "Payment verification failed. Please contact support.",
                    variant: "destructive",
                  });
                }
              })
              .catch((error: any) => {
                toast({
                  title: "Verification Error",
                  description: error.message || "Failed to verify payment",
                  variant: "destructive",
                });
              });
          },
          onCancel: () => {
            toast({
              title: "Payment Cancelled",
              description: "You closed the payment window. Your order is saved and pending payment.",
              variant: "destructive",
            });
          },
        });
      } catch (error: any) {
        toast({
          title: "Payment Error",
          description: error.message || "Failed to initialize payment",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-4">Add some products to checkout</p>
          <Button onClick={() => navigate("/collections/all")} data-testid="button-browse-products">Browse Products</Button>
        </div>
      </div>
    );
  }

  // Helper to get item price (variant price or regular price)
  const getItemPrice = (item: CartItem) => {
    return item.variantPrice ? parseFloat(item.variantPrice) : parseFloat(item.product.price);
  };
  
  const totalVatInclusive = cartItems.reduce((sum, item) => {
    return sum + getItemPrice(item) * item.quantity;
  }, 0);
  
  // Apply 15% trade discount to VAT-inclusive total if approved
  const tradeDiscount = tradeStatus?.approved ? totalVatInclusive * 0.15 : 0;
  const totalAfterDiscount = totalVatInclusive - tradeDiscount;
  
  // Extract VAT from the final total (after discount)
  const subtotal = totalAfterDiscount / 1.15;
  const vat = subtotal * 0.15;
  
  // Check if cart contains products with custom delivery fees (e.g., heavy items like Glosteel garage doors)
  const customDeliveryFees = cartItems
    .filter((item) => item.product.deliveryFee !== null && item.product.deliveryFee !== undefined)
    .map((item) => parseFloat(item.product.deliveryFee as string));
  
  // Check if cart contains 48KG LP Gas product (special promotion: FREE delivery)
  const has48kgLPGas = cartItems.some(
    (item) => item.product.id === '51891f80-9f0b-4817-9a2c-c5ff57f44905'
  );
  
  // Check if cart contains LP Gas products (Pretoria only, R50 delivery)
  // LP Gas category ID: e110c296-9deb-457b-9a4d-edfa9aa529e0
  const hasLPGas = cartItems.some(
    (item) => item.product.categoryId === 'e110c296-9deb-457b-9a4d-edfa9aa529e0'
  );
  
  // Calculate shipping cost priority:
  // 1. If pickup is selected, shipping is FREE
  // 2. If cart has products with custom delivery fees, use the highest custom fee
  // 3. If cart contains 48KG LP Gas, FREE delivery (special promotion)
  // 4. If cart contains other LP Gas products, R50 (Pretoria only delivery)
  // 5. FREE if order total is R2500+
  // 6. Otherwise, R110 standard delivery fee
  let shippingCost = 110;
  if (deliveryMethod === "pickup") {
    shippingCost = 0;
  } else if (customDeliveryFees.length > 0) {
    shippingCost = Math.max(...customDeliveryFees);
  } else if (has48kgLPGas) {
    shippingCost = 0; // Special promotion: FREE delivery on 48kg LP Gas
  } else if (hasLPGas) {
    shippingCost = 50; // LP Gas products: R50 Pretoria delivery only
  } else if (totalAfterDiscount >= 2500) {
    shippingCost = 0;
  }
  
  // Final total includes shipping
  const total = totalAfterDiscount + shippingCost;

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Secure Checkout</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Your information is safe and secure
          </p>
        </div>

        {/* Delivery Method Selector */}
        <div className="mb-10 max-w-2xl mx-auto" data-testid="delivery-method-selector">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => form.setValue("deliveryMethod", "delivery")}
              className={`p-6 rounded-lg border-2 transition-all ${
                deliveryMethod === "delivery"
                  ? "border-primary bg-primary/5"
                  : "border-border hover-elevate"
              }`}
              data-testid="button-delivery-method-delivery"
            >
              <Truck className={`h-8 w-8 mx-auto mb-3 ${deliveryMethod === "delivery" ? "text-primary" : "text-muted-foreground"}`} />
              <h3 className="font-semibold text-lg mb-1">Delivery</h3>
              <p className="text-sm text-muted-foreground">We deliver nationwide</p>
            </button>
            
            <button
              type="button"
              onClick={() => form.setValue("deliveryMethod", "pickup")}
              className={`p-6 rounded-lg border-2 transition-all ${
                deliveryMethod === "pickup"
                  ? "border-primary bg-primary/5"
                  : "border-border hover-elevate"
              }`}
              data-testid="button-delivery-method-pickup"
            >
              <Home className={`h-8 w-8 mx-auto mb-3 ${deliveryMethod === "pickup" ? "text-primary" : "text-muted-foreground"}`} />
              <h3 className="font-semibold text-lg mb-1">Pickup</h3>
              <p className="text-sm text-muted-foreground">Collect from our shop</p>
            </button>
          </div>
          
          {deliveryMethod === "pickup" && (
            <Alert className="mt-4 bg-primary/5 border-primary">
              <MapPin className="h-4 w-4" />
              <AlertDescription className="font-medium">
                Pickup Location: Alectra Solutions, Wonderboom, Pretoria, 0182
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-card">
                <CardTitle className="flex items-center gap-2">
                  {deliveryMethod === "pickup" ? (
                    <>
                      <Home className="h-5 w-5 text-primary" />
                      Pickup Information
                    </>
                  ) : (
                    <>
                      <Truck className="h-5 w-5 text-primary" />
                      Delivery Information
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {deliveryMethod === "delivery" && addresses && addresses.length > 0 && (
                  <div className="mb-6">
                    <label className="text-sm font-medium mb-2 block">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      Use Saved Address
                    </label>
                    <Select value={selectedAddressId} onValueChange={handleAddressSelect}>
                      <SelectTrigger data-testid="select-saved-address">
                        <SelectValue placeholder="Select a saved address" />
                      </SelectTrigger>
                      <SelectContent>
                        {addresses.map((address) => (
                          <SelectItem key={address.id} value={address.id} data-testid={`select-item-address-${address.id}`}>
                            {address.addressLine}, {address.city} ({address.isDefault ? "Default" : "Saved"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createOrderMutation.mutate(data))} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            Full Name
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} data-testid="input-name" className="h-11" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="customerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              Phone
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="0123456789" {...field} data-testid="input-phone" className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {deliveryMethod === "delivery" && (
                      <>
                        <FormField
                          control={form.control}
                          name="deliveryAddress"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-muted-foreground" />
                                Delivery Address
                              </FormLabel>
                              <FormControl>
                                <Textarea placeholder="123 Main Street, Apartment 4B" {...field} data-testid="input-address" className="min-h-[80px]" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="deliveryCity"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                  <Input placeholder="Pretoria" {...field} data-testid="input-city" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="deliveryProvince"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Province</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-province">
                                      <SelectValue placeholder="Select province" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Gauteng" data-testid="select-item-province-gauteng">Gauteng</SelectItem>
                                    <SelectItem value="Western Cape" data-testid="select-item-province-western-cape">Western Cape</SelectItem>
                                    <SelectItem value="KwaZulu-Natal" data-testid="select-item-province-kwazulu-natal">KwaZulu-Natal</SelectItem>
                                    <SelectItem value="Eastern Cape" data-testid="select-item-province-eastern-cape">Eastern Cape</SelectItem>
                                    <SelectItem value="Free State" data-testid="select-item-province-free-state">Free State</SelectItem>
                                    <SelectItem value="Limpopo" data-testid="select-item-province-limpopo">Limpopo</SelectItem>
                                    <SelectItem value="Mpumalanga" data-testid="select-item-province-mpumalanga">Mpumalanga</SelectItem>
                                    <SelectItem value="Northern Cape" data-testid="select-item-province-northern-cape">Northern Cape</SelectItem>
                                    <SelectItem value="North West" data-testid="select-item-province-north-west">North West</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="deliveryPostalCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="0001" {...field} data-testid="input-postal-code" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}

                    {/* Christmas Gift Section - Festive styling to stand apart */}
                    <div className="relative mt-8 mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-green-600 rounded-xl opacity-10" />
                      <div className="relative border-2 border-red-200 dark:border-red-900 rounded-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-red-700 via-red-600 to-green-700 px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="bg-white/20 p-2 rounded-full">
                                <Gift className="h-5 w-5 text-white" />
                              </div>
                              <div className="text-white">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                  Christmas Gift
                                  <Star className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                                </h3>
                                <p className="text-sm text-white/80">Make it extra special this festive season!</p>
                              </div>
                            </div>
                            <div className="absolute top-3 right-12 opacity-20">
                              <Snowflake className="h-8 w-8 text-white animate-pulse" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-b from-red-50 to-white dark:from-red-950/30 dark:to-background p-5">
                          <FormField
                            control={form.control}
                            name="isGift"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-4 space-y-0">
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    data-testid="switch-is-gift"
                                    className="data-[state=checked]:bg-red-600"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-base font-semibold cursor-pointer">
                                    This order is a Christmas gift
                                  </FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    When selected we'll include a beautiful gift bag for your products, on us!
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                        </div>
                      </div>
                    </div>

                    {/* Trust Signals */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-3" data-testid="trust-signals">
                      <div className="flex items-center gap-3" data-testid="trust-secure-payment">
                        <Lock className="h-5 w-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Secure Payment</p>
                          <p className="text-xs text-muted-foreground">256-bit SSL encryption protects your data</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3" data-testid="trust-paystack">
                        <CreditCard className="h-5 w-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Powered by Paystack</p>
                          <p className="text-xs text-muted-foreground">Safe and trusted payment processing</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3" data-testid="trust-delivery">
                        {deliveryMethod === "pickup" ? (
                          <>
                            <Home className="h-5 w-5 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">Convenient Pickup</p>
                              <p className="text-xs text-muted-foreground">
                                Collect from Alectra Solutions, Wonderboom, Pretoria
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <Truck className="h-5 w-5 text-primary flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium">Fast Delivery</p>
                              <p className="text-xs text-muted-foreground">
                                Nationwide via The Courier Guy • Free shipping on orders R2500+
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-12 text-base font-semibold" 
                      disabled={createOrderMutation.isPending} 
                      data-testid="button-place-order"
                    >
                      {createOrderMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                          Processing Order...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Proceed to Secure Payment
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24 shadow-lg">
              <CardHeader className="border-b bg-card">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {cartItems.map((item) => {
                  const itemPrice = getItemPrice(item);
                  const lineTotal = (itemPrice * item.quantity).toFixed(2);
                  const imageUrl = item.product.imageUrl.startsWith('/') ? item.product.imageUrl : `/${item.product.imageUrl}`;
                  const itemKey = item.variant ? `${item.product.id}-${item.variant}` : item.product.id;

                  return (
                    <div key={itemKey} className="flex gap-3">
                      <img
                        src={imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          {item.variant && (
                            <Badge variant="secondary" className="text-xs">
                              {item.variant === 'exchange' ? 'Exchange' : 'New'}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-semibold">R {lineTotal}</p>
                      </div>
                    </div>
                  );
                })}

                <Separator />

                {tradeStatus?.approved && (
                  <Alert className="bg-primary/10 border-primary">
                    <BadgePercent className="h-4 w-4" />
                    <AlertDescription className="text-sm font-medium text-primary">
                      Trade Pricing Applied: 15% discount
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal (excl. VAT)</span>
                    <span data-testid="text-summary-subtotal">R {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT (15%)</span>
                    <span data-testid="text-summary-vat">R {vat.toFixed(2)}</span>
                  </div>
                  {tradeStatus?.approved && tradeDiscount > 0 && (
                    <div className="flex justify-between text-sm text-primary font-medium">
                      <span>Trade Discount (15%)</span>
                      <span data-testid="text-summary-trade-discount">- R {tradeDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryMethod === "delivery" && (
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span data-testid="text-summary-shipping" className={shippingCost === 0 ? "text-primary font-medium" : ""}>
                        {shippingCost === 0 ? "FREE" : `R ${shippingCost.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span data-testid="text-summary-total">R {total.toFixed(2)}</span>
                  </div>
                  {tradeStatus?.approved && (
                    <div className="text-xs text-primary font-medium">
                      You saved R {tradeDiscount.toFixed(2)} with trade pricing
                    </div>
                  )}
                </div>

                <div className="text-xs text-muted-foreground pt-4">
                  {deliveryMethod === "pickup" ? (
                    <p>Pickup from: Alectra Solutions, Wonderboom, Pretoria, 0182</p>
                  ) : (
                    <p>Delivery via The Courier Guy nationwide.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
