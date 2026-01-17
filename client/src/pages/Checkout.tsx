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
import { MapPin, BadgePercent, User, Mail, Phone, Home, Shield, Lock, Truck, CreditCard, Wallet, ShoppingCart, Navigation, Check, Loader2, Search, PenLine, Tag, X, Clock, RotateCcw, MessageCircle, Users, Star, Calendar, ShieldCheck, AlertTriangle } from "lucide-react";
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

interface AppliedDiscount {
  id: string;
  code: string;
  type: "free_shipping" | "fixed_amount" | "percentage";
  value: string | null;
  discountAmount: number;
}

export default function Checkout({ cartItems, onClearCart }: CheckoutProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("yoco");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [addressEntryMode, setAddressEntryMode] = useState<AddressEntryMode>("search");
  const [searchedAddress, setSearchedAddress] = useState<ParsedAddress | null>(null);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);

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

  const validateDiscountMutation = useMutation({
    mutationFn: async ({ code, subtotal }: { code: string; subtotal: number }) => {
      const res = await apiRequest("POST", "/api/discount-codes/validate", { code, subtotal });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Invalid discount code");
      }
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
          ? "Free shipping has been applied to your order!"
          : `Discount code ${data.discountCode.code} applied successfully!`,
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
  const totalAfterTradeDiscount = totalVatInclusive - tradeDiscount;
  
  // Apply discount code (fixed_amount or percentage types)
  let discountCodeAmount = 0;
  if (appliedDiscount && appliedDiscount.type !== "free_shipping") {
    discountCodeAmount = appliedDiscount.discountAmount;
  }
  const totalAfterDiscount = Math.max(0, totalAfterTradeDiscount - discountCodeAmount);
  
  // Extract VAT from the final total (after discount)
  const subtotal = totalAfterDiscount / 1.15;
  const vat = subtotal * 0.15;
  
  // Check if free shipping discount code is applied
  const hasFreeShippingDiscount = appliedDiscount?.type === "free_shipping";
  
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
  // 2. If free shipping discount code is applied, shipping is FREE
  // 3. If cart has Glosteel garage doors, R1900 per door (very heavy items - takes priority)
  // 4. If cart has products with custom delivery fees, use the highest custom fee
  // 5. If cart contains FREE shipping products, FREE delivery (promotion)
  // 6. If cart contains 48KG LP Gas, FREE delivery (special promotion)
  // 7. If cart contains other LP Gas products, R50 (Pretoria only delivery)
  // 8. FREE if order total is R2500+
  // 9. Otherwise, R110 standard delivery fee
  let shippingCost = 110;
  if (deliveryMethod === "pickup") {
    shippingCost = 0;
  } else if (hasFreeShippingDiscount) {
    shippingCost = 0; // Free shipping discount code applied
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

  // Calculate estimated delivery date (3-5 business days)
  const getEstimatedDeliveryDate = () => {
    const today = new Date();
    let businessDays = 0;
    let date = new Date(today);
    
    while (businessDays < 5) {
      date.setDate(date.getDate() + 1);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
    }
    
    return date.toLocaleDateString('en-ZA', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const estimatedDelivery = getEstimatedDeliveryDate();

  // Check for low stock items
  const lowStockItems = cartItems.filter(item => item.product.stock <= 5 && item.product.stock > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 via-background to-muted/30">
      {/* Enterprise Trust Banner - Full Width */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 text-white py-2.5 shadow-md" data-testid="trust-banner">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs sm:text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>100% Secure Checkout</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/30" />
            <div className="flex items-center gap-1.5">
              <Lock className="h-4 w-4" />
              <span>256-bit SSL Encryption</span>
            </div>
            <div className="hidden md:block w-px h-4 bg-white/30" />
            <div className="hidden md:flex items-center gap-1.5">
              <RotateCcw className="h-4 w-4" />
              <span>30-Day Easy Returns</span>
            </div>
            <div className="hidden lg:block w-px h-4 bg-white/30" />
            <div className="hidden lg:flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>2,500+ Happy Customers</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 lg:py-12">
        {/* Enterprise Header with Progress Indicator */}
        <div className="mb-8 lg:mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">Secure Checkout</h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-600" />
                Your payment information is protected
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm bg-green-500/10 border border-green-500/30 rounded-full px-4 py-2">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-700 dark:text-green-400">PCI-DSS Compliant</span>
              </div>
            </div>
          </div>
          
          {/* Progress Steps - Enhanced */}
          <div className="bg-card rounded-2xl border shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between max-w-2xl mx-auto">
              <div className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-lg shadow-primary/30 ring-4 ring-primary/20">
                  1
                </div>
                <span className="text-xs sm:text-sm font-bold text-primary">Information</span>
              </div>
              <div className="flex-1 h-1 bg-muted mx-2 rounded-full" />
              <div className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">
                  2
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">Payment</span>
              </div>
              <div className="flex-1 h-1 bg-muted mx-2 rounded-full" />
              <div className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center font-bold">
                  3
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">Confirmation</span>
              </div>
            </div>
          </div>

          {/* Low Stock Warning */}
          {lowStockItems.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6 flex items-start gap-3" data-testid="low-stock-warning">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Limited Stock Available</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  {lowStockItems.map(item => item.product.name).join(', ')} {lowStockItems.length === 1 ? 'has' : 'have'} limited stock. Complete your order to secure {lowStockItems.length === 1 ? 'it' : 'them'}.
                </p>
              </div>
            </div>
          )}

          {/* Estimated Delivery Banner */}
          {deliveryMethod === "delivery" && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap" data-testid="delivery-estimate">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Estimated Delivery</p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">Arrives by {estimatedDelivery}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-3 py-1.5 rounded-full">
                <Truck className="h-3.5 w-3.5" />
                <span>Via The Courier Guy</span>
              </div>
            </div>
          )}

          {/* Same-Day Dispatch Urgency Banner */}
          {new Date().getHours() < 12 && (
            <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6 flex items-center gap-3" data-testid="same-day-dispatch">
              <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">Same-Day Dispatch Available</p>
                <p className="text-xs text-orange-700 dark:text-orange-300">
                  Order within the next {12 - new Date().getHours()} hours for same-day dispatch
                </p>
              </div>
            </div>
          )}
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

                    {/* Trust Signals - Enhanced */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl p-5 border border-green-200 dark:border-green-800" data-testid="trust-signals">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="flex flex-col items-center text-center gap-2" data-testid="trust-secure-payment">
                          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <Lock className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-800 dark:text-green-200">Secure</p>
                            <p className="text-[10px] text-green-600 dark:text-green-400">256-bit SSL</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center text-center gap-2" data-testid="trust-verified">
                          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-800 dark:text-green-200">Verified</p>
                            <p className="text-[10px] text-green-600 dark:text-green-400">PCI-DSS</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center text-center gap-2" data-testid="trust-returns">
                          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <RotateCcw className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-800 dark:text-green-200">Easy Returns</p>
                            <p className="text-[10px] text-green-600 dark:text-green-400">30 Days</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-center text-center gap-2" data-testid="trust-support">
                          <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                            <MessageCircle className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-green-800 dark:text-green-200">Support</p>
                            <p className="text-[10px] text-green-600 dark:text-green-400">WhatsApp</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Security Badges */}
                    <div className="flex items-center justify-center gap-4 py-3 bg-muted/30 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2">
                        <SiVisa className="h-8 w-auto text-[#1434CB]" />
                        <span className="text-[10px] text-muted-foreground font-medium">Verified by Visa</span>
                      </div>
                      <div className="w-px h-6 bg-border" />
                      <div className="flex items-center gap-2">
                        <SiMastercard className="h-8 w-auto text-[#FF5F00]" />
                        <span className="text-[10px] text-muted-foreground font-medium">SecureCode</span>
                      </div>
                    </div>

                    {/* POPI Compliance Notice */}
                    <div className="text-center text-xs text-muted-foreground bg-muted/20 rounded-lg p-3 border border-border/30" data-testid="popi-notice">
                      <Shield className="h-4 w-4 inline mr-1.5 text-muted-foreground" />
                      Your personal information is protected under POPIA. We never share your data with third parties.
                      <a href="/privacy" className="text-primary hover:underline ml-1">Privacy Policy</a>
                    </div>

                    <Button 
                      type="submit" 
                      size="lg" 
                      className="w-full font-bold tracking-wide shadow-xl" 
                      disabled={createOrderMutation.isPending} 
                      data-testid="button-place-order"
                    >
                      {createOrderMutation.isPending ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                          Processing Secure Payment...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Complete Secure Payment - R {total.toFixed(2)}
                        </span>
                      )}
                    </Button>

                    {/* Order Guarantee */}
                    <div className="text-center text-xs text-muted-foreground">
                      <Check className="h-4 w-4 inline mr-1 text-green-600" />
                      Order confirmation sent immediately to your email
                    </div>
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

                {/* Discount Code Input */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Discount Code
                  </Label>
                  {appliedDiscount ? (
                    <div className="bg-gradient-to-r from-green-500/10 to-green-500/5 border border-green-500/30 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="font-mono font-bold text-green-700 dark:text-green-400" data-testid="text-applied-discount-code">
                            {appliedDiscount.code}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeDiscount}
                          className="text-muted-foreground hover:text-destructive h-8 px-2"
                          data-testid="button-remove-discount"
                        >
                          Remove
                        </Button>
                      </div>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {appliedDiscount.type === "free_shipping" 
                          ? "Free shipping applied!"
                          : appliedDiscount.type === "percentage"
                            ? `${appliedDiscount.value}% off applied`
                            : `R${appliedDiscount.value} off applied`}
                      </p>
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
                        className="flex-1 font-mono uppercase"
                        data-testid="input-discount-code"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyDiscount}
                        disabled={validateDiscountMutation.isPending}
                        data-testid="button-apply-discount"
                      >
                        {validateDiscountMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                  )}
                  {discountError && (
                    <p className="text-xs text-destructive" data-testid="text-discount-error">{discountError}</p>
                  )}
                </div>

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
                    <span className="font-medium" data-testid="text-summary-subtotal">R {totalVatInclusive.toFixed(2)}</span>
                  </div>
                  {tradeStatus?.approved && tradeDiscount > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Trade Discount (15%)</span>
                      <span className="font-semibold" data-testid="text-summary-trade-discount">- R {tradeDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {appliedDiscount && appliedDiscount.type !== "free_shipping" && discountCodeAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Discount ({appliedDiscount.code})</span>
                      <span className="font-semibold" data-testid="text-summary-discount-code">- R {discountCodeAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryMethod === "delivery" && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span data-testid="text-summary-shipping" className={`font-medium ${shippingCost === 0 ? "text-green-600 dark:text-green-400" : ""}`}>
                          {shippingCost === 0 ? "FREE" : `R ${shippingCost.toFixed(2)}`}
                        </span>
                      </div>
                      {hasFreeShippingDiscount && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          Free shipping code applied: {appliedDiscount?.code}
                        </div>
                      )}
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

                {/* Google Rating Badge */}
                <div className="flex items-center justify-center gap-2 py-3 bg-muted/20 rounded-xl border border-border/30">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </div>
                  <span className="text-sm font-semibold">4.9/5</span>
                  <span className="text-xs text-muted-foreground">(Based on customer reviews)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Support Button */}
      <a
        href="https://wa.me/27125663123?text=Hi%2C%20I%20need%20help%20with%20my%20checkout"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105"
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
