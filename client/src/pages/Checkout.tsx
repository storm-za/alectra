import { useState, lazy, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const LocationPicker = lazy(() => import("@/components/LocationPicker"));
import AddressSearch, { type ParsedAddress } from "@/components/AddressSearch";
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
import { FREE_SHIPPING_PRODUCT_IDS, TORSION_SPRING_VARIANTS, type CartItem, type UserAddress, type PaystackInitializeResponse, type PaystackVerifyResponse, type TorsionSpringVariant } from "@shared/schema";
import { MapPin, BadgePercent, User, Mail, Phone, Home, Shield, Lock, Truck, CreditCard, Wallet, ShoppingCart, Navigation, Check, Loader2, Search, PenLine } from "lucide-react";
import { SiVisa, SiMastercard, SiApplepay, SiGooglepay } from "react-icons/si";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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
  locationLatitude: z.string().optional(),
  locationLongitude: z.string().optional(),
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

type PaymentMethod = "paystack" | "yoco";

type AddressEntryMode = "search" | "manual";

export default function Checkout({ cartItems, onClearCart }: CheckoutProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("yoco");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [addressEntryMode, setAddressEntryMode] = useState<AddressEntryMode>("search");
  const [searchedAddress, setSearchedAddress] = useState<ParsedAddress | null>(null);

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
      locationLatitude: "",
      locationLongitude: "",
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
      locationLatitude: "",
      locationLongitude: "",
      isGift: false,
      giftMessage: "",
    } : undefined,
  });

  const handleShareLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location sharing",
        variant: "destructive",
      });
      return;
    }

    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValue("locationLatitude", position.coords.latitude.toString());
        form.setValue("locationLongitude", position.coords.longitude.toString());
        setLocationStatus("success");
        toast({
          title: "Location pinned",
          description: "Your GPS coordinates have been saved for accurate delivery",
        });
      },
      (error) => {
        setLocationStatus("idle");
        let title = "Location unavailable";
        let message = "Could not detect your location. You can still complete checkout without it.";
        if (error.code === error.PERMISSION_DENIED) {
          title = "Permission needed";
          message = "Please allow location access in your browser, then try again.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          title = "Location unavailable";
          message = "Your device couldn't detect your location. Make sure GPS is enabled.";
        } else if (error.code === error.TIMEOUT) {
          title = "Location timeout";
          message = "Taking too long to get location. Please try again or continue without it.";
        }
        toast({
          title,
          description: message,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

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

  const handleSearchAddressSelect = (parsedAddress: ParsedAddress) => {
    setSearchedAddress(parsedAddress);
    form.setValue("deliveryAddress", parsedAddress.streetAddress);
    form.setValue("deliveryCity", parsedAddress.city);
    form.setValue("deliveryProvince", parsedAddress.province);
    form.setValue("deliveryPostalCode", parsedAddress.postalCode);
    form.setValue("locationLatitude", parsedAddress.latitude.toString());
    form.setValue("locationLongitude", parsedAddress.longitude.toString());
    setLocationStatus("success");
    toast({
      title: "Address found",
      description: "Confirm the pin location on the map, then review your details below.",
    });
  };

  const handleMapLocationChange = (lat: number, lng: number) => {
    form.setValue("locationLatitude", lat.toString());
    form.setValue("locationLongitude", lng.toString());
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

        if (paymentMethod === "yoco") {
          // Yoco payment flow - redirect based
          const initResponse = await apiRequest("POST", "/api/payment/yoco/initialize", {
            orderId: order.id,
          });
          const initData = await initResponse.json();

          if (!initData.redirectUrl) {
            toast({
              title: "Payment Error",
              description: "Failed to initialize Yoco payment. Please try again.",
              variant: "destructive",
            });
            return;
          }

          // Store orderId in sessionStorage so we can clear cart on success page
          sessionStorage.setItem('pendingYocoOrderId', order.id);
          
          // Redirect to Yoco checkout page (cart will be cleared on success)
          window.location.href = initData.redirectUrl;
        } else {
          // Paystack payment flow - popup based
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

          // Use Paystack Popup with newTransaction
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
            amount: Math.round(parseFloat(order.total as any) * 100),
            currency: "ZAR",
            reference: initData.reference,
            onSuccess: (paystackResponse: any) => {
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
        }
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
  
  // Glosteel garage door slugs - very heavy items requiring R1900 shipping per door
  const GLOSTEEL_SLUGS = [
    'glosteel-garage-door-safari-brown',
    'glosteel-garage-door',
    'glosteel-garage-door-african-cream'
  ];
  
  // Calculate Glosteel shipping: R1900 per door × quantity
  const glosteelItems = cartItems.filter(item => GLOSTEEL_SLUGS.includes(item.product.slug));
  const glosteelQuantity = glosteelItems.reduce((sum, item) => sum + item.quantity, 0);
  const glosteelShipping = glosteelQuantity * 1900;
  const hasGlosteelDoors = glosteelQuantity > 0;
  
  // Check if cart contains products with custom delivery fees (e.g., heavy items like Glosteel garage doors)
  const customDeliveryFees = cartItems
    .filter((item) => item.product.deliveryFee !== null && item.product.deliveryFee !== undefined)
    .map((item) => parseFloat(item.product.deliveryFee as string));
  
  // Check if cart contains 48KG LP Gas product (special promotion: FREE delivery)
  const has48kgLPGas = cartItems.some(
    (item) => item.product.slug === '48kg-exchange'
  );
  
  // Check if cart contains LP Gas products (Pretoria only, R50 delivery)
  // LP Gas products have slugs containing 'exchange' (cylinders) or starting with 'lp-gas' (regulators)
  const LP_GAS_SLUG_PATTERNS = ['9kg-exchange', '19kg-exchange', '48kg-exchange', 'lp-gas-regulator'];
  const hasLPGas = cartItems.some(
    (item) => LP_GAS_SLUG_PATTERNS.some(pattern => item.product.slug.includes(pattern))
  );
  
  // Check if cart contains products with FREE shipping promotion
  const hasFreeShippingProduct = cartItems.some(
    (item) => FREE_SHIPPING_PRODUCT_IDS.includes(item.product.id)
  );
  
  // Calculate shipping cost priority:
  // 1. If pickup is selected, shipping is FREE
  // 2. If cart has Glosteel garage doors, R1900 per door (very heavy items - takes priority)
  // 3. If cart has products with custom delivery fees, use the highest custom fee
  // 4. If cart contains FREE shipping products, FREE delivery (promotion)
  // 5. If cart contains 48KG LP Gas, FREE delivery (special promotion)
  // 6. If cart contains other LP Gas products, R50 (Pretoria only delivery)
  // 7. FREE if order total is R2500+
  // 8. Otherwise, R110 standard delivery fee
  let shippingCost = 110;
  if (deliveryMethod === "pickup") {
    shippingCost = 0;
  } else if (hasGlosteelDoors) {
    shippingCost = glosteelShipping; // R1900 per garage door - heavy items take priority
  } else if (customDeliveryFees.length > 0) {
    shippingCost = Math.max(...customDeliveryFees);
  } else if (hasFreeShippingProduct) {
    shippingCost = 0; // FREE shipping promotion for specific products
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
    <div className="min-h-screen bg-gradient-to-b from-muted/50 via-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 lg:py-12">
        {/* Enterprise Header with Progress Indicator */}
        <div className="mb-10 lg:mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Checkout</h1>
              <p className="text-muted-foreground mt-1">Complete your order securely</p>
            </div>
            <div className="flex items-center gap-2 text-sm bg-primary/5 border border-primary/20 rounded-full px-4 py-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">SSL Secured</span>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="hidden sm:flex items-center justify-center gap-0 max-w-xl mx-auto">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">1</div>
              <span className="text-sm font-medium">Cart</span>
            </div>
            <div className="h-0.5 w-16 lg:w-24 bg-primary mx-2" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">2</div>
              <span className="text-sm font-medium">Details</span>
            </div>
            <div className="h-0.5 w-16 lg:w-24 bg-muted mx-2" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold">3</div>
              <span className="text-sm text-muted-foreground">Payment</span>
            </div>
          </div>
        </div>

        {/* Delivery Method Selector */}
        <div className="mb-10 max-w-3xl mx-auto" data-testid="delivery-method-selector">
          <h2 className="text-lg font-semibold mb-4 text-center">How would you like to receive your order?</h2>
          <div className="grid grid-cols-2 gap-6">
            <button
              type="button"
              onClick={() => form.setValue("deliveryMethod", "delivery")}
              className={`relative p-6 lg:p-8 rounded-xl border-2 transition-all duration-200 group ${
                deliveryMethod === "delivery"
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/50 hover:shadow-md"
              }`}
              data-testid="button-delivery-method-delivery"
            >
              {deliveryMethod === "delivery" && (
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className={`inline-flex items-center justify-center h-14 w-14 rounded-xl mb-4 transition-colors ${
                deliveryMethod === "delivery" ? "bg-primary/10" : "bg-muted group-hover:bg-primary/5"
              }`}>
                <Truck className={`h-7 w-7 ${deliveryMethod === "delivery" ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"}`} />
              </div>
              <h3 className="font-bold text-lg mb-1">Delivery</h3>
              <p className="text-sm text-muted-foreground">Nationwide shipping via The Courier Guy</p>
            </button>
            
            <button
              type="button"
              onClick={() => form.setValue("deliveryMethod", "pickup")}
              className={`relative p-6 lg:p-8 rounded-xl border-2 transition-all duration-200 group ${
                deliveryMethod === "pickup"
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border bg-card hover:border-primary/50 hover:shadow-md"
              }`}
              data-testid="button-delivery-method-pickup"
            >
              {deliveryMethod === "pickup" && (
                <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                  <svg className="h-4 w-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className={`inline-flex items-center justify-center h-14 w-14 rounded-xl mb-4 transition-colors ${
                deliveryMethod === "pickup" ? "bg-primary/10" : "bg-muted group-hover:bg-primary/5"
              }`}>
                <Home className={`h-7 w-7 ${deliveryMethod === "pickup" ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"}`} />
              </div>
              <h3 className="font-bold text-lg mb-1">Pickup</h3>
              <p className="text-sm text-muted-foreground">Collect from our Pretoria store</p>
            </button>
          </div>
          
          {deliveryMethod === "pickup" && (
            <div className="mt-6 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Pickup Location</p>
                <p className="text-sm text-muted-foreground">Alectra Solutions, Wonderboom, Pretoria, 0182</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-xl border-0 bg-card">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-muted/30 rounded-t-lg">
                <CardTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    {deliveryMethod === "pickup" ? (
                      <Home className="h-5 w-5 text-primary" />
                    ) : (
                      <Truck className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <span className="text-lg">{deliveryMethod === "pickup" ? "Pickup Information" : "Delivery Information"}</span>
                    <p className="text-sm font-normal text-muted-foreground mt-0.5">Enter your contact details</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 lg:p-8">
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
                        {/* Address Entry Mode Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-2">
                          <span className="text-sm font-medium text-muted-foreground">How would you like to enter your address?</span>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={addressEntryMode === "search" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setAddressEntryMode("search")}
                              className="gap-2"
                              data-testid="button-address-mode-search"
                            >
                              <Search className="h-4 w-4" />
                              Search Address
                            </Button>
                            <Button
                              type="button"
                              variant={addressEntryMode === "manual" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setAddressEntryMode("manual")}
                              className="gap-2"
                              data-testid="button-address-mode-manual"
                            >
                              <PenLine className="h-4 w-4" />
                              Enter Manually
                            </Button>
                          </div>
                        </div>

                        {/* Search Address Mode */}
                        {addressEntryMode === "search" && (
                          <div className="space-y-4">
                            <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
                              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
                              <div className="relative p-5 space-y-4">
                                <div className="flex items-start gap-4">
                                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-lg">
                                    <Search className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-base">Search Your Address</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      Type your address to find it on the map, then confirm the location
                                    </p>
                                  </div>
                                </div>
                                
                                <AddressSearch
                                  onAddressSelect={handleSearchAddressSelect}
                                  placeholder="Start typing your address (e.g., 123 Main Street, Pretoria)"
                                />
                              </div>
                            </div>

                            {/* Map Preview after search */}
                            {searchedAddress && locationStatus === "success" && form.watch("locationLatitude") && form.watch("locationLongitude") && (
                              <div className="relative overflow-hidden rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/5 via-green-500/10 to-emerald-500/5">
                                <div className="relative p-5 space-y-4">
                                  <div className="flex items-start gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                                      <Check className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-base">Confirm Your Location</h4>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Drag the pin to fine-tune your exact delivery location
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <Suspense fallback={
                                    <div className="w-full h-[200px] rounded-lg bg-muted/50 flex items-center justify-center">
                                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                  }>
                                    <LocationPicker
                                      latitude={parseFloat(form.watch("locationLatitude") || "0")}
                                      longitude={parseFloat(form.watch("locationLongitude") || "0")}
                                      onLocationChange={handleMapLocationChange}
                                    />
                                  </Suspense>
                                  <p className="text-xs text-center text-muted-foreground">
                                    Click or drag the pin to adjust your exact delivery location
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Address Details (always visible, auto-filled after search) */}
                            <div className="space-y-4 pt-2">
                              {searchedAddress && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="h-4 w-4 text-green-500" />
                                  <span>Address auto-filled from your search. You can edit if needed:</span>
                                </div>
                              )}
                              
                              <FormField
                                  control={form.control}
                                  name="deliveryAddress"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="flex items-center gap-2">
                                        <Home className="h-4 w-4 text-muted-foreground" />
                                        Street Address
                                      </FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="123 Main Street, Apartment 4B" {...field} data-testid="input-address" className="min-h-[60px]" />
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
                                        <Select onValueChange={field.onChange} value={field.value}>
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
                              </div>
                          </div>
                        )}

                        {/* Manual Entry Mode */}
                        {addressEntryMode === "manual" && (
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
                                    <Select onValueChange={field.onChange} value={field.value}>
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

                            {/* GPS Location Sharing - for manual entry */}
                            <div className={`relative overflow-hidden rounded-xl border transition-all duration-300 ${
                              locationStatus === "success" 
                                ? "bg-gradient-to-br from-green-500/5 via-green-500/10 to-emerald-500/5 border-green-500/30" 
                                : "bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20"
                            }`}>
                              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
                              <div className="relative p-5 space-y-4">
                                <div className="flex items-start gap-4">
                                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-colors duration-300 ${
                                    locationStatus === "success" 
                                      ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                                      : "bg-gradient-to-br from-primary to-primary/80"
                                  }`}>
                                    {locationStatus === "success" ? (
                                      <Check className="h-6 w-6 text-white" />
                                    ) : (
                                      <Navigation className="h-6 w-6 text-white" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-semibold text-base">
                                        {locationStatus === "success" ? "Location Pinned" : "Pin Your Exact Location"}
                                      </h4>
                                      <Badge variant="secondary" className="text-xs font-medium">Optional</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                      {locationStatus === "success" 
                                        ? "Drag the pin to fine-tune your exact location" 
                                        : "Help our courier find your exact location for faster, more accurate delivery"
                                      }
                                    </p>
                                  </div>
                                </div>
                                
                                {locationStatus === "success" && form.watch("locationLatitude") && form.watch("locationLongitude") ? (
                                  <Suspense fallback={
                                    <div className="w-full h-[200px] rounded-lg bg-muted/50 flex items-center justify-center">
                                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                    </div>
                                  }>
                                    <LocationPicker
                                      latitude={parseFloat(form.watch("locationLatitude") || "0")}
                                      longitude={parseFloat(form.watch("locationLongitude") || "0")}
                                      onLocationChange={handleMapLocationChange}
                                    />
                                    <p className="text-xs text-center text-muted-foreground">
                                      Click or drag the pin to adjust your exact delivery location
                                    </p>
                                  </Suspense>
                                ) : (
                                  <>
                                    <Button
                                      type="button"
                                      variant="default"
                                      onClick={handleShareLocation}
                                      disabled={locationStatus === "loading"}
                                      data-testid="button-share-location"
                                      className="w-full h-12 text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                                    >
                                      {locationStatus === "loading" ? (
                                        <>
                                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                          Detecting Your Location...
                                        </>
                                      ) : (
                                        <>
                                          <MapPin className="h-5 w-5 mr-2" />
                                          Share My Location
                                        </>
                                      )}
                                    </Button>
                                    <p className="text-xs text-center text-muted-foreground">
                                      Your browser will ask for permission to access your location
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* Payment Method Selection */}
                    <div className="space-y-4 pt-2" data-testid="payment-method-selection">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Payment Method</h3>
                          <p className="text-sm text-muted-foreground">Choose your preferred payment option</p>
                        </div>
                      </div>
                      
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        <div className="relative">
                          <RadioGroupItem
                            value="paystack"
                            id="payment-paystack"
                            className="peer sr-only"
                            data-testid="radio-payment-paystack"
                          />
                          <Label
                            htmlFor="payment-paystack"
                            className={`flex flex-col gap-3 rounded-xl border-2 bg-card p-5 cursor-pointer transition-all duration-200 ${
                              paymentMethod === "paystack" 
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                                : "border-muted hover:border-primary/50 hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold">Paystack</span>
                              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                paymentMethod === "paystack" ? "border-primary bg-primary" : "border-muted"
                              }`}>
                                {paymentMethod === "paystack" && (
                                  <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <SiVisa className="h-7 w-auto text-[#1434CB]" />
                              <SiMastercard className="h-7 w-auto text-[#FF5F00]" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Secure popup checkout
                            </p>
                          </Label>
                        </div>
                        
                        <div className="relative">
                          <RadioGroupItem
                            value="yoco"
                            id="payment-yoco"
                            className="peer sr-only"
                            data-testid="radio-payment-yoco"
                          />
                          <Label
                            htmlFor="payment-yoco"
                            className={`flex flex-col gap-3 rounded-xl border-2 bg-card p-5 cursor-pointer transition-all duration-200 ${
                              paymentMethod === "yoco" 
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                                : "border-muted hover:border-primary/50 hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold">Yoco</span>
                              <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                paymentMethod === "yoco" ? "border-primary bg-primary" : "border-muted"
                              }`}>
                                {paymentMethod === "yoco" && (
                                  <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <SiVisa className="h-7 w-auto text-[#1434CB]" />
                              <SiMastercard className="h-7 w-auto text-[#FF5F00]" />
                              <SiApplepay className="h-7 w-auto text-foreground" />
                              <SiGooglepay className="h-7 w-auto text-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Redirect to secure checkout
                            </p>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Trust Signals */}
                    <div className="bg-gradient-to-br from-muted/30 to-muted/50 rounded-xl p-5 border border-border/50" data-testid="trust-signals">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3" data-testid="trust-secure-payment">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Lock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Secure Payment</p>
                            <p className="text-xs text-muted-foreground">256-bit SSL encryption</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3" data-testid="trust-delivery">
                          {deliveryMethod === "pickup" ? (
                            <>
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Home className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">Easy Pickup</p>
                                <p className="text-xs text-muted-foreground">Wonderboom, Pretoria</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Truck className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">Fast Delivery</p>
                                <p className="text-xs text-muted-foreground">Free on orders R2500+</p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full h-14 text-base font-bold tracking-wide shadow-xl hover:shadow-2xl transition-shadow" 
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
                          Complete Secure Payment
                        </span>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24">
            <Card className="shadow-xl border-0 bg-card overflow-hidden">
              <CardHeader className="border-b bg-gradient-to-r from-muted/50 to-muted/30">
                <CardTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-lg">Order Summary</span>
                    <p className="text-sm font-normal text-muted-foreground mt-0.5">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {/* Cart Items */}
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => {
                    const itemPrice = getItemPrice(item);
                    const lineTotal = (itemPrice * item.quantity).toFixed(2);
                    const imageUrl = item.product.imageUrl.startsWith('/') ? item.product.imageUrl : `/${item.product.imageUrl}`;
                    const itemKey = item.variant ? `${item.product.id}-${item.variant}` : item.product.id;

                    return (
                      <div key={itemKey} className="flex gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <img
                          src={imageUrl}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg bg-muted"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-2">{item.product.name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Qty: {item.quantity}</span>
                            {item.variant && (
                              <Badge variant="secondary" className="text-xs">
                                {item.variant === 'exchange' ? 'Exchange' : 
                                 item.variant === 'new' ? 'New Cylinder' :
                                 item.variant === '2450mm' || item.variant === '2550mm' ? item.variant :
                                 TORSION_SPRING_VARIANTS[item.variant as TorsionSpringVariant] 
                                   ? `${TORSION_SPRING_VARIANTS[item.variant as TorsionSpringVariant].weight} ${TORSION_SPRING_VARIANTS[item.variant as TorsionSpringVariant].winding === 'left' ? 'Left' : 'Right'}`
                                   : item.variant}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-bold mt-1">R {lineTotal}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Separator className="my-4" />

                {tradeStatus?.approved && (
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <BadgePercent className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">Trade Pricing Applied</p>
                      <p className="text-xs text-muted-foreground">15% wholesale discount</p>
                    </div>
                  </div>
                )}

                {/* Order Totals */}
                <div className="space-y-3 bg-muted/30 rounded-xl p-4 border border-border/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium" data-testid="text-summary-subtotal">R {totalAfterDiscount.toFixed(2)}</span>
                  </div>
                  {tradeStatus?.approved && tradeDiscount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Trade Discount (15%)</span>
                      <span className="font-semibold" data-testid="text-summary-trade-discount">- R {tradeDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryMethod === "delivery" && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span data-testid="text-summary-shipping" className={`font-medium ${shippingCost === 0 ? "text-primary" : ""}`}>
                          {shippingCost === 0 ? "FREE" : `R ${shippingCost.toFixed(2)}`}
                        </span>
                      </div>
                      {hasGlosteelDoors && (
                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded-lg mt-2">
                          <span className="font-medium text-foreground">R1,900 (Very Heavy Item)</span>
                          <br />
                          Glosteel Garage Door × {glosteelQuantity} = R{glosteelShipping.toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <Separator className="my-3" />
                  
                  <div className="flex justify-between items-baseline">
                    <span className="text-base font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary" data-testid="text-summary-total">R {total.toFixed(2)}</span>
                  </div>
                  {tradeStatus?.approved && (
                    <div className="text-xs text-center text-primary font-medium bg-primary/5 rounded-lg py-2">
                      You saved R {tradeDiscount.toFixed(2)} with trade pricing
                    </div>
                  )}
                </div>

                {/* Delivery Info Footer */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-3 border border-border/30">
                  {deliveryMethod === "pickup" ? (
                    <>
                      <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Pickup from: Alectra Solutions, Wonderboom, Pretoria</span>
                    </>
                  ) : (
                    <>
                      <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>Delivery via The Courier Guy nationwide</span>
                    </>
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
