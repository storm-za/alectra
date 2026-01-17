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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { FREE_SHIPPING_PRODUCT_IDS, TORSION_SPRING_VARIANTS, type CartItem, type UserAddress, type PaystackVerifyResponse, type TorsionSpringVariant } from "@shared/schema";
import { MapPin, BadgePercent, User, Mail, Phone, Home, Shield, Lock, Truck, CreditCard, ShoppingCart, Navigation, Check, Loader2, Search, PenLine, Tag, ChevronLeft, ChevronRight, Building2, ExternalLink, Star, ChevronDown, ChevronUp } from "lucide-react";
import { SiVisa, SiMastercard } from "react-icons/si";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const checkoutSchema = z.object({
  deliveryMethod: z.enum(["delivery", "pickup"]),
  pickupStore: z.string().optional(),
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
}).refine((data) => {
  if (data.deliveryMethod === "pickup") {
    return !!(data.pickupStore && data.pickupStore.length > 0);
  }
  return true;
}, {
  message: "Please select a pickup store",
  path: ["pickupStore"],
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutProps {
  cartItems: CartItem[];
  onClearCart: () => void;
}

type PaymentMethod = "paystack" | "yoco";

type AddressEntryMode = "location" | "manual" | null;

interface AppliedDiscount {
  id: string;
  code: string;
  type: "free_shipping" | "fixed_amount" | "percentage";
  value: string | null;
  discountAmount: number;
}

// Store locations
const STORES = {
  wonderboom: {
    id: "wonderboom",
    name: "Wonderboom Store",
    address: "107A Dassiebos Ave, Wonderboom, Pretoria, 0182",
    mapsUrl: "https://maps.google.com/?q=107A+Dassiebos+Ave,+Wonderboom,+Pretoria,+0182",
    hours: "Mon-Fri: 8am-5pm, Sat: 8am-1pm",
  },
  hatfield: {
    id: "hatfield",
    name: "Hatfield Store",
    address: "1234 Burnett St, Hatfield, Pretoria, 0083",
    mapsUrl: "https://maps.app.goo.gl/LSUuz7pxboVphHGG7",
    hours: "Mon-Fri: 8am-5pm, Sat: 8am-1pm",
  },
};

export default function Checkout({ cartItems, onClearCart }: CheckoutProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Wizard step state
  const [currentStep, setCurrentStep] = useState(1);
  const [addressEntryMode, setAddressEntryMode] = useState<AddressEntryMode>(null);
  
  // Form and payment state
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("yoco");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [searchedAddress, setSearchedAddress] = useState<ParsedAddress | null>(null);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);

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
      pickupStore: "",
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
      pickupStore: "",
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

  const deliveryMethod = form.watch("deliveryMethod");
  const pickupStore = form.watch("pickupStore");

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
          description: "Your GPS coordinates have been saved. Drag the pin to adjust if needed.",
        });
      },
      (error) => {
        setLocationStatus("idle");
        let title = "Location unavailable";
        let message = "Could not detect your location.";
        if (error.code === error.PERMISSION_DENIED) {
          title = "Permission needed";
          message = "Please allow location access in your browser.";
        }
        toast({ title, description: message, variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

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
  };

  const handleMapLocationChange = (lat: number, lng: number) => {
    form.setValue("locationLatitude", lat.toString());
    form.setValue("locationLongitude", lng.toString());
  };

  const validateDiscountMutation = useMutation({
    mutationFn: async ({ code, subtotal }: { code: string; subtotal: number }) => {
      const res = await apiRequest("POST", "/api/discount-codes/validate", { code, subtotal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid discount code");
      return data;
    },
    onSuccess: (data: { valid: boolean; discountCode: { id: string; code: string; type: string; value: string | null }; discountAmount: string }) => {
      setAppliedDiscount({
        id: data.discountCode.id,
        code: data.discountCode.code,
        type: data.discountCode.type as AppliedDiscount["type"],
        value: data.discountCode.value,
        discountAmount: parseFloat(data.discountAmount),
      });
      setDiscountError(null);
      setDiscountCodeInput("");
      toast({
        title: "Discount applied",
        description: data.discountCode.type === "free_shipping" 
          ? "Free shipping has been applied!"
          : `Discount code ${data.discountCode.code} applied!`,
      });
    },
    onError: (error: any) => {
      setDiscountError(error.message);
      setAppliedDiscount(null);
    },
  });

  const handleApplyDiscount = () => {
    if (!discountCodeInput.trim()) {
      setDiscountError("Please enter a discount code");
      return;
    }
    setDiscountError(null);
    const cartTotal = cartItems.reduce((sum, item) => {
      const price = item.variantPrice ? parseFloat(item.variantPrice) : parseFloat(item.product.price);
      return sum + price * item.quantity;
    }, 0);
    validateDiscountMutation.mutate({ code: discountCodeInput.trim(), subtotal: cartTotal });
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCodeInput("");
    setDiscountError(null);
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
        discountCodeId: appliedDiscount?.id || null,
        discountCode: appliedDiscount?.code || null,
        discountType: appliedDiscount?.type || null,
        discountValue: appliedDiscount?.value || null,
        discountAmount: appliedDiscount ? (appliedDiscount.type === "free_shipping" ? "0" : appliedDiscount.discountAmount.toString()) : null,
      };

      const res = await apiRequest("POST", "/api/orders", orderData);
      return await res.json();
    },
    onSuccess: async (orderResult: { order: any; items: any[] }) => {
      try {
        const order = orderResult.order;

        if (paymentMethod === "yoco") {
          const initResponse = await apiRequest("POST", "/api/payment/yoco/initialize", { orderId: order.id });
          const initData = await initResponse.json();

          if (!initData.redirectUrl) {
            toast({ title: "Payment Error", description: "Failed to initialize payment.", variant: "destructive" });
            return;
          }

          sessionStorage.setItem('pendingYocoOrderId', order.id);
          window.location.href = initData.redirectUrl;
        } else {
          const initResponse = await apiRequest("POST", "/api/payment/initialize", { orderId: order.id });
          const initData = await initResponse.json();

          if (!initData.accessCode) {
            toast({ title: "Payment Error", description: "Failed to initialize payment.", variant: "destructive" });
            return;
          }

          const PaystackPop = (window as any).PaystackPop;
          if (!PaystackPop) {
            toast({ title: "Payment Error", description: "Payment system not loaded. Please refresh.", variant: "destructive" });
            return;
          }

          const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
          if (!publicKey) {
            toast({ title: "Configuration Error", description: "Payment system not configured.", variant: "destructive" });
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
                    toast({ title: "Payment Successful!", description: "Your order has been confirmed." });
                    onClearCart();
                    navigate(`/order-success?reference=${paystackResponse.reference}&orderId=${verifyData.data.orderId}`);
                  } else {
                    toast({ title: "Payment Failed", description: verifyData.message || "Verification failed.", variant: "destructive" });
                  }
                })
                .catch((error: any) => {
                  toast({ title: "Verification Error", description: error.message || "Failed to verify payment", variant: "destructive" });
                });
            },
            onCancel: () => {
              toast({ title: "Payment Cancelled", description: "You closed the payment window.", variant: "destructive" });
            },
          });
        }
      } catch (error: any) {
        toast({ title: "Payment Error", description: error.message || "Failed to initialize payment", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to place order.", variant: "destructive" });
    },
  });

  // Empty cart check
  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some products to checkout</p>
          <Button onClick={() => navigate("/collections/all")} size="lg" data-testid="button-browse-products">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  // Price calculations
  const getItemPrice = (item: CartItem) => {
    return item.variantPrice ? parseFloat(item.variantPrice) : parseFloat(item.product.price);
  };
  
  const totalVatInclusive = cartItems.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0);
  const tradeDiscount = tradeStatus?.approved ? totalVatInclusive * 0.15 : 0;
  const totalAfterTradeDiscount = totalVatInclusive - tradeDiscount;
  
  let discountCodeAmount = 0;
  if (appliedDiscount && appliedDiscount.type !== "free_shipping") {
    discountCodeAmount = appliedDiscount.discountAmount;
  }
  const totalAfterDiscount = Math.max(0, totalAfterTradeDiscount - discountCodeAmount);
  
  const hasFreeShippingDiscount = appliedDiscount?.type === "free_shipping";
  
  const GLOSTEEL_SLUGS = ['glosteel-garage-door-safari-brown', 'glosteel-garage-door', 'glosteel-garage-door-african-cream'];
  const glosteelItems = cartItems.filter(item => GLOSTEEL_SLUGS.includes(item.product.slug));
  const glosteelQuantity = glosteelItems.reduce((sum, item) => sum + item.quantity, 0);
  const glosteelShipping = glosteelQuantity * 1900;
  const hasGlosteelDoors = glosteelQuantity > 0;
  
  const customDeliveryFees = cartItems
    .filter((item) => item.product.deliveryFee !== null && item.product.deliveryFee !== undefined)
    .map((item) => parseFloat(item.product.deliveryFee as string));
  
  const has48kgLPGas = cartItems.some((item) => item.product.slug === '48kg-exchange');
  const LP_GAS_SLUG_PATTERNS = ['9kg-exchange', '19kg-exchange', '48kg-exchange', 'lp-gas-regulator'];
  const hasLPGas = cartItems.some((item) => LP_GAS_SLUG_PATTERNS.some(pattern => item.product.slug.includes(pattern)));
  const hasFreeShippingProduct = cartItems.some((item) => FREE_SHIPPING_PRODUCT_IDS.includes(item.product.id));
  
  let shippingCost = 110;
  if (deliveryMethod === "pickup") {
    shippingCost = 0;
  } else if (hasFreeShippingDiscount) {
    shippingCost = 0;
  } else if (hasGlosteelDoors) {
    shippingCost = glosteelShipping;
  } else if (customDeliveryFees.length > 0) {
    shippingCost = Math.max(...customDeliveryFees);
  } else if (hasFreeShippingProduct) {
    shippingCost = 0;
  } else if (has48kgLPGas) {
    shippingCost = 0;
  } else if (hasLPGas) {
    shippingCost = 50;
  } else if (totalAfterDiscount >= 2500) {
    shippingCost = 0;
  }
  
  const total = totalAfterDiscount + shippingCost;

  // Step validation
  const canProceedFromStep1 = !!deliveryMethod;
  const canProceedFromStep2a = form.watch("customerName")?.length >= 2 && 
    form.watch("customerEmail")?.includes("@") && 
    form.watch("customerPhone")?.length >= 10;
  
  const canProceedFromStep2bDelivery = !!(
    form.watch("deliveryAddress") && 
    form.watch("deliveryCity") && 
    form.watch("deliveryProvince") && 
    form.watch("deliveryPostalCode")
  );
  
  const canProceedFromStep2bPickup = !!pickupStore;

  // Navigation handlers
  const goToNextStep = () => {
    if (currentStep === 1 && canProceedFromStep1) {
      setCurrentStep(2);
    } else if (currentStep === 2 && canProceedFromStep2a) {
      setCurrentStep(3);
      if (deliveryMethod === "delivery") {
        setAddressEntryMode(null);
      }
    } else if (currentStep === 3) {
      if (deliveryMethod === "delivery" && canProceedFromStep2bDelivery) {
        setCurrentStep(4);
      } else if (deliveryMethod === "pickup" && canProceedFromStep2bPickup) {
        setCurrentStep(4);
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 3) {
        setAddressEntryMode(null);
      }
    }
  };

  const handlePayment = () => {
    const formData = form.getValues();
    createOrderMutation.mutate(formData);
  };

  // Progress indicator
  const ProgressIndicator = () => (
    <div className="flex items-center justify-center gap-2 py-4">
      {[1, 2, 3, 4].map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
            currentStep === step 
              ? "bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20" 
              : currentStep > step 
                ? "bg-green-500 text-white" 
                : "bg-muted text-muted-foreground"
          }`}>
            {currentStep > step ? <Check className="h-5 w-5" /> : step}
          </div>
          {step < 4 && (
            <div className={`w-8 h-1 rounded-full ${currentStep > step ? "bg-green-500" : "bg-muted"}`} />
          )}
        </div>
      ))}
    </div>
  );

  // Order summary component
  const OrderSummaryContent = () => (
    <div className="space-y-3">
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {cartItems.map((item) => {
          const itemPrice = getItemPrice(item);
          const lineTotal = (itemPrice * item.quantity).toFixed(2);
          const imageUrl = item.product.imageUrl.startsWith('/') ? item.product.imageUrl : `/${item.product.imageUrl}`;
          const itemKey = item.variant ? `${item.product.id}-${item.variant}` : item.product.id;

          return (
            <div key={itemKey} className="flex gap-2 p-2 rounded-lg bg-muted/30">
              <img src={imageUrl} alt={item.product.name} className="w-12 h-12 object-cover rounded-md bg-muted" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                  <span className="text-sm font-bold">R {lineTotal}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <Separator />
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>R {totalVatInclusive.toFixed(2)}</span>
        </div>
        {tradeDiscount > 0 && (
          <div className="flex justify-between text-primary">
            <span>Trade Discount</span>
            <span>- R {tradeDiscount.toFixed(2)}</span>
          </div>
        )}
        {discountCodeAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>- R {discountCodeAmount.toFixed(2)}</span>
          </div>
        )}
        {deliveryMethod === "delivery" && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className={shippingCost === 0 ? "text-green-600" : ""}>
              {shippingCost === 0 ? "FREE" : `R ${shippingCost.toFixed(2)}`}
            </span>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="flex justify-between items-baseline">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-bold text-primary">R {total.toFixed(2)}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-muted/20 flex flex-col">
      {/* Trust Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-4 text-xs sm:text-sm font-medium flex-wrap">
          <div className="flex items-center gap-1.5">
            <Shield className="h-4 w-4" />
            <span>Secure Checkout</span>
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/30" />
          <div className="flex items-center gap-1.5">
            <Lock className="h-4 w-4" />
            <span>256-bit SSL</span>
          </div>
          <div className="hidden md:block w-px h-4 bg-white/30" />
          <div className="hidden md:flex items-center gap-1.5">
            <Star className="h-4 w-4" />
            <span>4.9/5 Rating</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-center">Checkout</h1>
          <ProgressIndicator />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            
            {/* Step 1: Choose Method */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300" data-testid="step-method">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">How would you like to receive your order?</h2>
                  <p className="text-muted-foreground">Choose your preferred delivery method</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                  <Card
                    className={`relative cursor-pointer transition-all duration-200 hover-elevate ${
                      deliveryMethod === "delivery"
                        ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                        : "border-border"
                    }`}
                    onClick={() => form.setValue("deliveryMethod", "delivery")}
                    data-testid="button-method-delivery"
                  >
                    <CardContent className="p-6">
                      {deliveryMethod === "delivery" && (
                        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className={`h-14 w-14 rounded-md mb-4 flex items-center justify-center ${
                        deliveryMethod === "delivery" ? "bg-primary/10" : "bg-muted"
                      }`}>
                        <Truck className={`h-7 w-7 ${deliveryMethod === "delivery" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <h3 className="font-bold text-lg">Delivery</h3>
                      <p className="text-sm text-muted-foreground mt-1">Nationwide shipping via The Courier Guy</p>
                    </CardContent>
                  </Card>

                  <Card
                    className={`relative cursor-pointer transition-all duration-200 hover-elevate ${
                      deliveryMethod === "pickup"
                        ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                        : "border-border"
                    }`}
                    onClick={() => form.setValue("deliveryMethod", "pickup")}
                    data-testid="button-method-pickup"
                  >
                    <CardContent className="p-6">
                      {deliveryMethod === "pickup" && (
                        <div className="absolute top-3 right-3 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                          <Check className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div className={`h-14 w-14 rounded-md mb-4 flex items-center justify-center ${
                        deliveryMethod === "pickup" ? "bg-primary/10" : "bg-muted"
                      }`}>
                        <Building2 className={`h-7 w-7 ${deliveryMethod === "pickup" ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <h3 className="font-bold text-lg">Pickup</h3>
                      <p className="text-sm text-muted-foreground mt-1">Collect from our Pretoria stores</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    size="lg" 
                    onClick={goToNextStep} 
                    disabled={!canProceedFromStep1}
                    className="gap-2 px-8"
                    data-testid="button-next-step1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Contact Information */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300" data-testid="step-contact">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Contact Information</h2>
                  <p className="text-muted-foreground">We'll use this to send order updates</p>
                </div>

                <Card className="max-w-xl mx-auto">
                  <CardContent className="p-6 space-y-4">
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
                            <Input placeholder="John Doe" {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
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
                            Phone Number
                          </FormLabel>
                          <FormControl>
                            <Input placeholder="0123456789" {...field} data-testid="input-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <div className="flex justify-center gap-3 pt-4">
                  <Button variant="outline" size="lg" onClick={goToPreviousStep} className="gap-2" data-testid="button-back-step2">
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={goToNextStep} 
                    disabled={!canProceedFromStep2a}
                    className="gap-2 px-8"
                    data-testid="button-next-step2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Address/Store Selection */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300" data-testid="step-address">
                
                {/* Delivery Address Flow */}
                {deliveryMethod === "delivery" && (
                  <>
                    {!addressEntryMode ? (
                      // Address entry mode selection
                      <div className="space-y-6">
                        <div className="text-center space-y-2">
                          <h2 className="text-2xl font-bold">Choose Your Delivery Address</h2>
                          <p className="text-muted-foreground">Your address allows for fast deliveries and relevant deals in your area</p>
                        </div>

                        {/* Saved addresses for logged in users */}
                        {addresses && addresses.length > 0 && (
                          <div className="max-w-xl mx-auto space-y-3">
                            <Label className="text-sm font-medium">Your Saved Addresses</Label>
                            {addresses.map((address) => (
                              <Card
                                key={address.id}
                                className="cursor-pointer transition-all hover-elevate border-border"
                                onClick={() => {
                                  handleAddressSelect(address.id);
                                  setCurrentStep(4);
                                }}
                                data-testid={`button-saved-address-${address.id}`}
                              >
                                <CardContent className="p-4 flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <MapPin className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{address.addressLine}</p>
                                    <p className="text-sm text-muted-foreground">{address.city}, {address.province}</p>
                                  </div>
                                  {address.isDefault && <Badge variant="secondary">Default</Badge>}
                                </CardContent>
                              </Card>
                            ))}
                            <div className="relative py-4">
                              <Separator />
                              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm text-muted-foreground">or add new</span>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col gap-4 max-w-xl mx-auto">
                          <Button
                            type="button"
                            size="lg"
                            onClick={() => {
                              setAddressEntryMode("location");
                              handleShareLocation();
                            }}
                            className="gap-3"
                            data-testid="button-use-location"
                          >
                            <Navigation className="h-5 w-5" />
                            Use My Current Location
                          </Button>
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            onClick={() => setAddressEntryMode("manual")}
                            className="gap-3"
                            data-testid="button-enter-address"
                          >
                            <PenLine className="h-5 w-5" />
                            Let Me Enter My Address
                          </Button>
                        </div>

                        <div className="flex justify-center pt-4">
                          <Button variant="outline" size="lg" onClick={goToPreviousStep} className="gap-2" data-testid="button-back-step3">
                            <ChevronLeft className="h-4 w-4" />
                            Back
                          </Button>
                        </div>
                      </div>
                    ) : addressEntryMode === "location" ? (
                      // Location-based address entry
                      <div className="space-y-6">
                        <div className="text-center space-y-2">
                          <h2 className="text-2xl font-bold">Let's Find Your Address</h2>
                          <p className="text-muted-foreground">Adjust the pin to your exact delivery location</p>
                        </div>

                        {locationStatus === "loading" && (
                          <div className="flex items-center justify-center py-12">
                            <div className="text-center space-y-4">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                              <p className="text-muted-foreground">Detecting your location...</p>
                            </div>
                          </div>
                        )}

                        {locationStatus === "success" && form.watch("locationLatitude") && (
                          <div className="space-y-4 max-w-xl mx-auto">
                            <div className="rounded-2xl overflow-hidden border shadow-lg">
                              <Suspense fallback={
                                <div className="w-full h-[300px] bg-muted/50 flex items-center justify-center">
                                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                              }>
                                <LocationPicker
                                  latitude={parseFloat(form.watch("locationLatitude") || "0")}
                                  longitude={parseFloat(form.watch("locationLongitude") || "0")}
                                  onLocationChange={handleMapLocationChange}
                                />
                              </Suspense>
                            </div>

                            <div className="bg-card rounded-xl border p-4">
                              <AddressSearch
                                onAddressSelect={handleSearchAddressSelect}
                                placeholder="Search for your address..."
                              />
                            </div>

                            {searchedAddress && (
                              <Card className="border-primary/30 bg-primary/5">
                                <CardContent className="p-4">
                                  <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                      <MapPin className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{searchedAddress.streetAddress}</p>
                                      <p className="text-sm text-muted-foreground">{searchedAddress.city}, {searchedAddress.province}, {searchedAddress.postalCode}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        )}

                        {(locationStatus === "idle" || locationStatus === "error") && (
                          <div className="flex flex-col items-center gap-4 py-8">
                            <Button onClick={handleShareLocation} size="lg" className="gap-2" data-testid="button-retry-location">
                              <Navigation className="h-5 w-5" />
                              Try Again
                            </Button>
                            <Button variant="ghost" onClick={() => setAddressEntryMode("manual")} className="text-primary underline-offset-4 hover:underline" data-testid="button-switch-manual">
                              Enter address manually instead
                            </Button>
                          </div>
                        )}

                        <div className="flex justify-center gap-3 pt-4">
                          <Button 
                            variant="outline" 
                            size="lg" 
                            onClick={() => setAddressEntryMode(null)} 
                            className="gap-2"
                            data-testid="button-back-address-mode"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Back
                          </Button>
                          {searchedAddress && (
                            <Button 
                              size="lg" 
                              onClick={goToNextStep}
                              disabled={!canProceedFromStep2bDelivery}
                              className="gap-2 px-8"
                              data-testid="button-use-address"
                            >
                              Use This Address
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Manual address entry
                      <div className="space-y-6">
                        <div className="text-center space-y-2">
                          <h2 className="text-2xl font-bold">Enter Your Address</h2>
                          <p className="text-muted-foreground">Fill in your delivery details</p>
                        </div>

                        <Card className="max-w-xl mx-auto">
                          <CardContent className="p-6 space-y-4">
                            <div className="bg-card rounded-xl border p-4 mb-4">
                              <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Search className="h-4 w-4" />
                                Search for your address
                              </p>
                              <AddressSearch
                                onAddressSelect={handleSearchAddressSelect}
                                placeholder="Start typing your address..."
                              />
                            </div>

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
                                    <Textarea placeholder="123 Main Street, Apartment 4B" {...field} data-testid="input-address" className="min-h-[80px]" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                                          <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Gauteng" data-testid="select-item-gauteng">Gauteng</SelectItem>
                                        <SelectItem value="Western Cape" data-testid="select-item-western-cape">Western Cape</SelectItem>
                                        <SelectItem value="KwaZulu-Natal" data-testid="select-item-kwazulu-natal">KwaZulu-Natal</SelectItem>
                                        <SelectItem value="Eastern Cape" data-testid="select-item-eastern-cape">Eastern Cape</SelectItem>
                                        <SelectItem value="Free State" data-testid="select-item-free-state">Free State</SelectItem>
                                        <SelectItem value="Limpopo" data-testid="select-item-limpopo">Limpopo</SelectItem>
                                        <SelectItem value="Mpumalanga" data-testid="select-item-mpumalanga">Mpumalanga</SelectItem>
                                        <SelectItem value="Northern Cape" data-testid="select-item-northern-cape">Northern Cape</SelectItem>
                                        <SelectItem value="North West" data-testid="select-item-north-west">North West</SelectItem>
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
                          </CardContent>
                        </Card>

                        <div className="flex justify-center gap-3 pt-4">
                          <Button 
                            variant="outline" 
                            size="lg" 
                            onClick={() => setAddressEntryMode(null)} 
                            className="gap-2"
                            data-testid="button-back-manual"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Back
                          </Button>
                          <Button 
                            size="lg" 
                            onClick={goToNextStep}
                            disabled={!canProceedFromStep2bDelivery}
                            className="gap-2 px-8"
                            data-testid="button-next-step3-delivery"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Pickup Store Selection */}
                {deliveryMethod === "pickup" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold">Choose Your Pickup Store</h2>
                      <p className="text-muted-foreground">Select the store most convenient for you</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 max-w-xl mx-auto">
                      {Object.values(STORES).map((store) => (
                        <Card
                          key={store.id}
                          className={`relative cursor-pointer transition-all duration-200 hover-elevate ${
                            pickupStore === store.id
                              ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                              : "border-border"
                          }`}
                          onClick={() => form.setValue("pickupStore", store.id)}
                          data-testid={`button-store-${store.id}`}
                        >
                          <CardContent className="p-5">
                            {pickupStore === store.id && (
                              <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="h-4 w-4 text-primary-foreground" />
                              </div>
                            )}
                            
                            <div className="flex items-start gap-4">
                              <div className={`h-12 w-12 rounded-md flex items-center justify-center flex-shrink-0 ${
                                pickupStore === store.id ? "bg-primary/10" : "bg-muted"
                              }`}>
                                <Building2 className={`h-6 w-6 ${pickupStore === store.id ? "text-primary" : "text-muted-foreground"}`} />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg">{store.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{store.address}</p>
                                <p className="text-xs text-muted-foreground mt-2">{store.hours}</p>
                                
                                <a
                                  href={store.mapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-3"
                                  data-testid={`link-directions-${store.id}`}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                  Get Directions
                                </a>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    <div className="flex justify-center gap-3 pt-4">
                      <Button variant="outline" size="lg" onClick={goToPreviousStep} className="gap-2" data-testid="button-back-step3-pickup">
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <Button 
                        size="lg" 
                        onClick={goToNextStep}
                        disabled={!canProceedFromStep2bPickup}
                        className="gap-2 px-8"
                        data-testid="button-next-step3-pickup"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Payment */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300" data-testid="step-payment">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Payment Method</h2>
                  <p className="text-muted-foreground">Choose how you'd like to pay</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {/* Payment Methods */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CreditCard className="h-5 w-5" />
                        Select Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Card
                        className={`cursor-pointer transition-all hover-elevate ${
                          paymentMethod === "yoco"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border"
                        }`}
                        onClick={() => setPaymentMethod("yoco")}
                        data-testid="button-payment-yoco"
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-md flex items-center justify-center ${
                              paymentMethod === "yoco" ? "bg-primary/10" : "bg-muted"
                            }`}>
                              <CreditCard className={`h-5 w-5 ${paymentMethod === "yoco" ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold">Yoco</p>
                              <p className="text-xs text-muted-foreground">Credit/Debit Card</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <SiVisa className="h-6 w-auto text-[#1434CB]" />
                            <SiMastercard className="h-6 w-auto text-[#FF5F00]" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-all hover-elevate ${
                          paymentMethod === "paystack"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border"
                        }`}
                        onClick={() => setPaymentMethod("paystack")}
                        data-testid="button-payment-paystack"
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-md flex items-center justify-center ${
                              paymentMethod === "paystack" ? "bg-primary/10" : "bg-muted"
                            }`}>
                              <CreditCard className={`h-5 w-5 ${paymentMethod === "paystack" ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold">Paystack</p>
                              <p className="text-xs text-muted-foreground">Credit/Debit Card</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <SiVisa className="h-6 w-auto text-[#1434CB]" />
                            <SiMastercard className="h-6 w-auto text-[#FF5F00]" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Discount Code */}
                      <div className="pt-4 border-t mt-4">
                        <Label className="text-sm font-medium flex items-center gap-2 mb-2">
                          <Tag className="h-4 w-4" />
                          Discount Code
                        </Label>
                        {appliedDiscount ? (
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="font-mono font-bold text-green-700" data-testid="text-applied-discount">{appliedDiscount.code}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={removeDiscount} data-testid="button-remove-discount">Remove</Button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Input
                              placeholder="Enter code"
                              value={discountCodeInput}
                              onChange={(e) => {
                                setDiscountCodeInput(e.target.value.toUpperCase());
                                setDiscountError(null);
                              }}
                              className="font-mono uppercase"
                              data-testid="input-discount-code"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handleApplyDiscount}
                              disabled={validateDiscountMutation.isPending}
                              data-testid="button-apply-discount"
                            >
                              {validateDiscountMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                            </Button>
                          </div>
                        )}
                        {discountError && (
                          <p className="text-xs text-destructive mt-1" data-testid="text-discount-error">{discountError}</p>
                        )}
                      </div>

                      {/* Security badges */}
                      <div className="flex items-center justify-center gap-4 pt-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Lock className="h-3.5 w-3.5" />
                          <span>256-bit SSL</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="h-3.5 w-3.5" />
                          <span>PCI Compliant</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Order Summary */}
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ShoppingCart className="h-5 w-5" />
                        Order Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <OrderSummaryContent />
                      
                      {tradeStatus?.approved && (
                        <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-2">
                          <BadgePercent className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">15% Trade Discount Applied</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col items-center gap-3 pt-4 max-w-xl mx-auto">
                  <Button
                    size="lg"
                    onClick={handlePayment}
                    disabled={createOrderMutation.isPending}
                    className="w-full h-14 text-lg font-bold shadow-xl gap-2"
                    data-testid="button-pay"
                  >
                    {createOrderMutation.isPending ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-5 w-5" />
                        Pay R {total.toFixed(2)}
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={goToPreviousStep} 
                    className="gap-2"
                    data-testid="button-back-step4"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>

      {/* Mobile Order Summary (Collapsible at bottom) */}
      {currentStep < 4 && (
        <div className="lg:hidden sticky bottom-0 bg-card border-t shadow-2xl">
          <Collapsible open={orderSummaryOpen} onOpenChange={setOrderSummaryOpen}>
            <CollapsibleTrigger asChild>
              <button className="w-full px-4 py-3 flex items-center justify-between" data-testid="button-toggle-summary">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">R {total.toFixed(2)}</span>
                  {orderSummaryOpen ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </div>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 max-h-64 overflow-y-auto">
                <OrderSummaryContent />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Floating WhatsApp Support */}
      <a
        href="https://wa.me/27125663123?text=Hi%2C%20I%20need%20help%20with%20my%20checkout"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 lg:bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-2xl transition-all"
        data-testid="whatsapp-support"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        <span className="font-semibold hidden sm:inline">Need Help?</span>
      </a>
    </div>
  );
}
