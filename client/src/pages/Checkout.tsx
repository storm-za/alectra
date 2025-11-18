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
import { MapPin, BadgePercent, User, Mail, Phone, Home, Shield, Lock, Truck, CreditCard } from "lucide-react";

const checkoutSchema = z.object({
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Invalid phone number"),
  deliveryAddress: z.string().min(5, "Address is required"),
  deliveryCity: z.string().min(2, "City is required"),
  deliveryProvince: z.string().min(1, "Province is required"),
  deliveryPostalCode: z.string().min(4, "Postal code is required"),
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
      customerName: user?.user?.name || "",
      customerEmail: user?.user?.email || "",
      customerPhone: user?.user?.phone || "",
      deliveryAddress: "",
      deliveryCity: "",
      deliveryProvince: "",
      deliveryPostalCode: "",
    },
    values: user?.user ? {
      customerName: user.user.name,
      customerEmail: user.user.email,
      customerPhone: user.user.phone || "",
      deliveryAddress: "",
      deliveryCity: "",
      deliveryProvince: "",
      deliveryPostalCode: "",
    } : undefined,
  });

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
        })),
      };

      const res = await apiRequest("POST", "/api/orders", orderData);
      return await res.json();
    },
    onSuccess: async (orderResult: { order: any; items: any[] }) => {
      try {
        const order = orderResult.order;
        const paymentRes = await apiRequest("POST", "/api/payment/initialize", {
          orderId: order.id,
        });
        const paymentData: PaystackInitializeResponse = await paymentRes.json();

        // Initialize Paystack inline payment
        const PaystackPop = (window as any).PaystackPop;
        if (!PaystackPop) {
          toast({
            title: "Payment Error",
            description: "Payment system not loaded. Please refresh and try again.",
            variant: "destructive",
          });
          return;
        }

        const handler = PaystackPop.setup({
          key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || import.meta.env.TESTING_VITE_PAYSTACK_PUBLIC_KEY,
          email: order.customerEmail,
          amount: Math.round(parseFloat(order.total) * 100),
          currency: "ZAR",
          ref: paymentData.reference,
          metadata: {
            orderId: order.id,
            customerName: order.customerName,
          },
          onClose: function() {
            toast({
              title: "Payment Cancelled",
              description: "You closed the payment window. Your order is saved and pending payment.",
              variant: "destructive",
            });
          },
          onSuccess: async function(paystackResponse: any) {
            try {
              const verifyRes = await apiRequest("GET", `/api/payment/verify/${paystackResponse.reference}`);
              const verifyData: PaystackVerifyResponse = await verifyRes.json();
              
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
            } catch (error: any) {
              toast({
                title: "Verification Error",
                description: error.message || "Failed to verify payment",
                variant: "destructive",
              });
            }
          },
        });

        handler.openIframe();
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
          <Button onClick={() => navigate("/products")} data-testid="button-browse-products">Browse Products</Button>
        </div>
      </div>
    );
  }

  const totalVatInclusive = cartItems.reduce((sum, item) => {
    return sum + parseFloat(item.product.price) * item.quantity;
  }, 0);
  
  // Apply 15% trade discount to VAT-inclusive total if approved
  const tradeDiscount = tradeStatus?.approved ? totalVatInclusive * 0.15 : 0;
  const totalAfterDiscount = totalVatInclusive - tradeDiscount;
  
  // Extract VAT from the final total (after discount)
  const subtotal = totalAfterDiscount / 1.15;
  const vat = subtotal * 0.15;
  const total = totalAfterDiscount;

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

        {/* Progress Steps */}
        <div className="mb-10" data-testid="checkout-progress">
          <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-2" data-testid="progress-step-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Delivery</span>
            </div>
            <Separator className="w-8 sm:w-16" />
            <div className="flex items-center gap-2 opacity-50" data-testid="progress-step-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-muted-foreground flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Payment</span>
            </div>
            <Separator className="w-8 sm:w-16 opacity-50" />
            <div className="flex items-center gap-2 opacity-50" data-testid="progress-step-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-muted-foreground flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Complete</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-card">
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-primary" />
                  Delivery Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {addresses && addresses.length > 0 && (
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
                        <Truck className="h-5 w-5 text-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Fast Delivery</p>
                          <p className="text-xs text-muted-foreground">Nationwide via The Courier Guy</p>
                        </div>
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
                  const displayPrice = parseFloat(item.product.price).toFixed(2);
                  const lineTotal = (parseFloat(item.product.price) * item.quantity).toFixed(2);
                  const imageUrl = item.product.imageUrl.startsWith('/') ? item.product.imageUrl : `/${item.product.imageUrl}`;

                  return (
                    <div key={item.product.id} className="flex gap-3">
                      <img
                        src={imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
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
                  <p>Payment details will be sent via email after order confirmation.</p>
                  <p className="mt-2">Delivery via The Courier Guy nationwide.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
