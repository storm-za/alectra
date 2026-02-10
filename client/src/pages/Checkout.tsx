import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const LocationPicker = lazy(() => import("@/components/LocationPicker"));
import { type ParsedAddress } from "@/components/AddressSearch";
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
import { MapPin, BadgePercent, User, Mail, Phone, Home, Shield, Lock, Truck, CreditCard, ShoppingCart, Navigation, Check, Loader2, Search, PenLine, Tag, ChevronLeft, ChevronRight, Building2, ExternalLink, Star, ChevronDown, ChevronUp, LogIn, UserCheck } from "lucide-react";
import { SiVisa, SiMastercard } from "react-icons/si";
import yocoLogo from "@assets/yoco-logo_1768669914726.jpg";
import paystackLogo from "@assets/Paystack-mark-white-twitter_1768669952658.png";
import amexLogo from "@assets/images_(1)_1768670341240.png";
import googlePayLogo from "@assets/images_(2)_1768670342625.png";
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
    address: "Alectra Solutions, Wonderboom, Pretoria, 0182",
    mapsUrl: "https://maps.app.goo.gl/1YqjKqZ3dAQedFWc9",
    hours: "Mon-Sun: 08:00 - 16:45",
  },
  hatfield: {
    id: "hatfield",
    name: "Hatfield Store",
    address: "648 Jan Shoba St, Hillcrest, Pretoria, 0081",
    mapsUrl: "https://maps.app.goo.gl/LSUuz7pxboVphHGG7",
    hours: "Mon-Sat: 08:00 - 16:45",
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("paystack");
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [searchedAddress, setSearchedAddress] = useState<ParsedAddress | null>(null);
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);
  
  // Payment SDK readiness and processing states
  const [paystackReady, setPaystackReady] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Inline address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ place_id: number; display_name: string; address: any; lat: string; lon: string }>>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const addressDebounceRef = useRef<NodeJS.Timeout>();
  const addressDropdownRef = useRef<HTMLDivElement>(null);

  // Check Paystack SDK readiness on mount
  useEffect(() => {
    const checkPaystackReady = () => {
      if ((window as any).PaystackPop) {
        setPaystackReady(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkPaystackReady()) return;

    // Poll every 100ms for up to 5 seconds
    let attempts = 0;
    const maxAttempts = 50;
    const interval = setInterval(() => {
      attempts++;
      if (checkPaystackReady() || attempts >= maxAttempts) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

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

  // Reverse geocode coordinates to get address details
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'User-Agent': 'AlectraSolutions/1.0' } }
      );
      const data = await response.json();
      
      if (data && data.address) {
        const addr = data.address;
        // Build street address from components
        const houseNumber = addr.house_number || '';
        const road = addr.road || addr.street || '';
        const streetAddress = houseNumber ? `${houseNumber} ${road}`.trim() : road;
        
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || '';
        const province = addr.state || addr.province || '';
        const postalCode = addr.postcode || '';
        
        form.setValue("deliveryAddress", streetAddress || data.display_name?.split(',')[0] || '');
        form.setValue("deliveryCity", city);
        form.setValue("deliveryProvince", province);
        form.setValue("deliveryPostalCode", postalCode);
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    }
  };

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
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        form.setValue("locationLatitude", lat.toString());
        form.setValue("locationLongitude", lng.toString());
        setLocationStatus("success");
        
        // Reverse geocode to pre-fill address fields
        await reverseGeocode(lat, lng);
        
        toast({
          title: "Location detected",
          description: "Your address has been filled in. Adjust the pin or edit the fields if needed.",
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

  const provinceMap: Record<string, string> = {
    "Gauteng": "Gauteng",
    "Western Cape": "Western Cape",
    "KwaZulu-Natal": "KwaZulu-Natal",
    "Eastern Cape": "Eastern Cape",
    "Free State": "Free State",
    "Limpopo": "Limpopo",
    "Mpumalanga": "Mpumalanga",
    "Northern Cape": "Northern Cape",
    "North West": "North West",
    "North-West": "North West",
  };

  const searchAddressInline = useCallback(async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }
    setIsSearchingAddress(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: query,
          format: "json",
          addressdetails: "1",
          countrycodes: "za",
          limit: "5",
        }),
        { headers: { "Accept-Language": "en" } }
      );
      if (response.ok) {
        const data = await response.json();
        setAddressSuggestions(data);
        setShowAddressSuggestions(data.length > 0);
      }
    } catch {
      setAddressSuggestions([]);
    } finally {
      setIsSearchingAddress(false);
    }
  }, []);

  const handleAddressInputChange = useCallback((value: string) => {
    form.setValue("deliveryAddress", value);
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    if (value.length >= 3) {
      addressDebounceRef.current = setTimeout(() => searchAddressInline(value), 400);
    } else {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
    }
  }, [searchAddressInline, form]);

  const handleSuggestionSelect = useCallback(async (result: any) => {
    const addr = result.address;
    const road = addr.road || "";
    const suburb = addr.suburb || "";
    const city = addr.city || addr.town || addr.village || addr.municipality || "";
    const rawProvince = addr.state || "";
    const province = provinceMap[rawProvince] || rawProvince;

    const currentInput = form.getValues("deliveryAddress") || "";
    const userHouseNumber = currentInput.match(/^(\d+[A-Za-z]?\s)/)?.[1]?.trim() || "";
    const apiHouseNumber = addr.house_number || "";
    const houseNumber = apiHouseNumber || userHouseNumber;

    const streetParts = [houseNumber, road].filter(Boolean);
    const streetAddress = streetParts.length > 0
      ? streetParts.join(" ") + (suburb ? `, ${suburb}` : "")
      : suburb || result.display_name.split(",")[0];

    form.setValue("deliveryAddress", streetAddress);
    form.setValue("deliveryCity", city);
    form.setValue("deliveryProvince", province);
    form.setValue("locationLatitude", result.lat);
    form.setValue("locationLongitude", result.lon);
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);

    form.setValue("deliveryPostalCode", "");
  }, [form]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addressDropdownRef.current && !addressDropdownRef.current.contains(e.target as Node)) {
        setShowAddressSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMapLocationChange = async (lat: number, lng: number) => {
    form.setValue("locationLatitude", lat.toString());
    form.setValue("locationLongitude", lng.toString());
    // Reverse geocode to update address fields when pin is moved
    await reverseGeocode(lat, lng);
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
      setIsProcessingPayment(true);
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
            setIsProcessingPayment(false);
            toast({ title: "Payment Error", description: "Failed to initialize payment.", variant: "destructive" });
            return;
          }

          sessionStorage.setItem('pendingYocoOrderId', order.id);
          window.location.href = initData.redirectUrl;
        } else {
          const initResponse = await apiRequest("POST", "/api/payment/initialize", { orderId: order.id });
          const initData = await initResponse.json();

          if (!initData.accessCode) {
            setIsProcessingPayment(false);
            toast({ title: "Payment Error", description: "Failed to initialize payment.", variant: "destructive" });
            return;
          }

          const PaystackPop = (window as any).PaystackPop;
          if (!PaystackPop) {
            setIsProcessingPayment(false);
            toast({ title: "Payment Error", description: "Payment system not loaded. Please refresh.", variant: "destructive" });
            return;
          }

          const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
          if (!publicKey) {
            setIsProcessingPayment(false);
            toast({ title: "Configuration Error", description: "Payment system not configured.", variant: "destructive" });
            return;
          }

          // Hide overlay when popup opens (Paystack handles from here)
          setIsProcessingPayment(false);
          
          const popup = new PaystackPop();
          popup.newTransaction({
            key: publicKey,
            email: order.customerEmail,
            amount: Math.round(parseFloat(order.total as any) * 100),
            currency: "ZAR",
            reference: initData.reference,
            onSuccess: (paystackResponse: any) => {
              setIsProcessingPayment(true);
              apiRequest("GET", `/api/payment/verify/${paystackResponse.reference}`)
                .then(verifyRes => verifyRes.json())
                .then((verifyData: PaystackVerifyResponse) => {
                  setIsProcessingPayment(false);
                  if (verifyData.status === "success" && verifyData.data) {
                    toast({ title: "Payment Successful!", description: "Your order has been confirmed." });
                    onClearCart();
                    navigate(`/order-success?reference=${paystackResponse.reference}&orderId=${verifyData.data.orderId}`);
                  } else {
                    toast({ title: "Payment Failed", description: verifyData.message || "Verification failed.", variant: "destructive" });
                  }
                })
                .catch((error: any) => {
                  setIsProcessingPayment(false);
                  toast({ title: "Verification Error", description: error.message || "Failed to verify payment", variant: "destructive" });
                });
            },
            onCancel: () => {
              setIsProcessingPayment(false);
              toast({ title: "Payment Cancelled", description: "You closed the payment window.", variant: "destructive" });
            },
          });
        }
      } catch (error: any) {
        setIsProcessingPayment(false);
        toast({ title: "Payment Error", description: error.message || "Failed to initialize payment", variant: "destructive" });
      }
    },
    onError: (error: any) => {
      setIsProcessingPayment(false);
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
      window.scrollTo(0, 0);
    } else if (currentStep === 2 && canProceedFromStep2a) {
      const formData = form.getValues();
      const subtotal = cartItems.reduce((sum, item) => {
        const price = item.variantPrice ? parseFloat(item.variantPrice) : parseFloat(item.product.price);
        return sum + price * item.quantity;
      }, 0);
      fetch("/api/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.customerEmail,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          cartItems: cartItems.map(item => ({
            name: item.product.name,
            quantity: item.quantity,
            price: item.variantPrice || item.product.price,
            variant: item.variant || null,
          })),
          subtotal: subtotal.toFixed(2),
        }),
      }).catch(() => {});
      setCurrentStep(3);
      if (deliveryMethod === "delivery") {
        setAddressEntryMode(null);
      }
      window.scrollTo(0, 0);
    } else if (currentStep === 3) {
      if (deliveryMethod === "delivery" && canProceedFromStep2bDelivery) {
        setCurrentStep(4);
        window.scrollTo(0, 0);
      } else if (deliveryMethod === "pickup" && canProceedFromStep2bPickup) {
        setCurrentStep(4);
        window.scrollTo(0, 0);
      }
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 3) {
        setAddressEntryMode(null);
      }
      window.scrollTo(0, 0);
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
                {item.variant && (
                  <p className="text-xs text-muted-foreground">
                    {item.variant === 'exchange' ? 'Exchange' : 
                     item.variant === 'new' ? 'New Cylinder' :
                     /^\d{4}mm-(smooth|woodgrain)$/.test(item.variant as string)
                       ? `${(item.variant as string).split('-')[0]} / ${(item.variant as string).split('-')[1] === 'smooth' ? 'Smooth' : 'Woodgrain'}`
                       : String(item.variant)}
                  </p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Qty: {item.quantity}</span>
                  <span className="text-sm font-bold whitespace-nowrap">R&nbsp;{lineTotal}</span>
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
          <span className="whitespace-nowrap">R&nbsp;{totalVatInclusive.toFixed(2)}</span>
        </div>
        {tradeDiscount > 0 && (
          <div className="flex justify-between text-primary">
            <span>Trade Discount</span>
            <span className="whitespace-nowrap">-&nbsp;R&nbsp;{tradeDiscount.toFixed(2)}</span>
          </div>
        )}
        {discountCodeAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span className="whitespace-nowrap">-&nbsp;R&nbsp;{discountCodeAmount.toFixed(2)}</span>
          </div>
        )}
        {deliveryMethod === "delivery" && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className={shippingCost === 0 ? "text-green-600" : ""}>
              {shippingCost === 0 ? "FREE" : <>R&nbsp;{shippingCost.toFixed(2)}</>}
            </span>
          </div>
        )}
      </div>
      
      <Separator />
      
      <div className="flex justify-between items-baseline">
        <span className="font-semibold">Total</span>
        <span className="text-xl font-bold text-primary whitespace-nowrap">R&nbsp;{total.toFixed(2)}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-muted/20 flex flex-col">
      {/* Payment Processing Overlay */}
      {isProcessingPayment && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center" data-testid="payment-processing-overlay">
          <div className="bg-card border rounded-lg p-8 shadow-xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-lg">Processing Payment</h3>
              <p className="text-sm text-muted-foreground mt-1">Please wait while we secure your order...</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>256-bit SSL encrypted</span>
            </div>
          </div>
        </div>
      )}

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

                {/* Sign In Prompt / Logged In Indicator */}
                {user?.user ? (
                  <div className="max-w-xl mx-auto">
                    <div className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <UserCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">Signed in as {user.user.name || user.user.email}</p>
                        <p className="text-xs text-muted-foreground">Your contact details have been pre-filled</p>
                      </div>
                    </div>
                  </div>
                ) : null}

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

                {!user?.user && (
                  <p className="text-center text-sm text-muted-foreground max-w-xl mx-auto">
                    <Link href="/login" className="text-primary hover:underline">Sign in</Link> for faster checkout
                  </p>
                )}

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
                    {addressEntryMode === "location" ? (
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

                            {/* Editable address fields pre-filled from location */}
                            <Card>
                              <CardContent className="p-4 space-y-4">
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  Drag the pin above to adjust, or edit the fields below
                                </p>
                                
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
                                        <Textarea placeholder="123 Main Street" {...field} data-testid="input-address-location" className="min-h-[60px]" />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <FormField
                                    control={form.control}
                                    name="deliveryCity"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>City</FormLabel>
                                        <FormControl>
                                          <Input placeholder="Pretoria" {...field} data-testid="input-city-location" />
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
                                            <SelectTrigger data-testid="select-province-location">
                                              <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="Gauteng">Gauteng</SelectItem>
                                            <SelectItem value="Western Cape">Western Cape</SelectItem>
                                            <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                                            <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                                            <SelectItem value="Free State">Free State</SelectItem>
                                            <SelectItem value="Limpopo">Limpopo</SelectItem>
                                            <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                                            <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                                            <SelectItem value="North West">North West</SelectItem>
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
                                          <Input placeholder="0001" {...field} data-testid="input-postal-code-location" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </CardContent>
                            </Card>
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
                          <Button 
                            size="lg" 
                            onClick={goToNextStep}
                            disabled={!canProceedFromStep2bDelivery}
                            className="gap-2 px-8"
                            data-testid="button-next-step3-location"
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // Manual address entry (shown directly)
                      <div className="space-y-6">
                        <div className="text-center space-y-2">
                          <h2 className="text-2xl font-bold">Enter Your Delivery Address</h2>
                          <p className="text-muted-foreground">Fill in your delivery details below</p>
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
                              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm text-muted-foreground">or enter new address</span>
                            </div>
                          </div>
                        )}

                        <Card className="max-w-xl mx-auto">
                          <CardContent className="p-6 space-y-4">
                            <FormField
                              control={form.control}
                              name="deliveryAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="flex items-center gap-2">
                                    <Home className="h-4 w-4 text-muted-foreground" />
                                    Street Address
                                  </FormLabel>
                                  <div className="relative" ref={addressDropdownRef}>
                                    <FormControl>
                                      <div className="relative">
                                        <Input
                                          placeholder="Start typing your address..."
                                          value={field.value}
                                          onChange={(e) => handleAddressInputChange(e.target.value)}
                                          onFocus={() => addressSuggestions.length > 0 && setShowAddressSuggestions(true)}
                                          data-testid="input-address"
                                          autoComplete="off"
                                        />
                                        {isSearchingAddress && (
                                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                        )}
                                      </div>
                                    </FormControl>
                                    {showAddressSuggestions && addressSuggestions.length > 0 && (
                                      <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                                        <ul className="py-1 max-h-64 overflow-y-auto">
                                          {addressSuggestions.map((result) => (
                                            <li key={result.place_id}>
                                              <button
                                                type="button"
                                                className="w-full px-3 py-2.5 text-left hover-elevate flex items-start gap-3 transition-colors"
                                                onClick={() => handleSuggestionSelect(result)}
                                                data-testid={`button-address-suggestion-${result.place_id}`}
                                              >
                                                <MapPin className="h-4 w-4 mt-0.5 text-primary flex-shrink-0" />
                                                <span className="text-sm leading-tight line-clamp-2">{result.display_name}</span>
                                              </button>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
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
                                      <Input placeholder="e.g. 0182" {...field} data-testid="input-postal-code" />
                                    </FormControl>
                                    {!field.value && (
                                      <p className="text-xs text-amber-600 dark:text-amber-400">Please enter your postal code</p>
                                    )}
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
                            onClick={goToPreviousStep} 
                            className="gap-2"
                            data-testid="button-back-step3"
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
                          paymentMethod === "paystack"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border"
                        } ${!paystackReady ? "opacity-60" : ""}`}
                        onClick={() => paystackReady && setPaymentMethod("paystack")}
                        data-testid="button-payment-paystack"
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md overflow-hidden bg-[#011B33] flex items-center justify-center p-px">
                              <img src={paystackLogo} alt="Paystack" className="h-full w-full object-contain" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold flex items-center gap-2">
                                Paystack
                                {!paystackReady && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {paystackReady ? "Credit/Debit Card" : "Loading payment system..."}
                              </p>
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
                          paymentMethod === "yoco"
                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                            : "border-border"
                        }`}
                        onClick={() => setPaymentMethod("yoco")}
                        data-testid="button-payment-yoco"
                      >
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md overflow-hidden">
                              <img src={yocoLogo} alt="Yoco" className="h-full w-full object-cover" />
                            </div>
                            <div className="text-left">
                              <p className="font-semibold">Yoco</p>
                              <p className="text-xs text-muted-foreground">Credit/Debit Card</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <SiVisa className="h-6 w-auto text-[#1434CB]" />
                            <SiMastercard className="h-6 w-auto text-[#FF5F00]" />
                            <img src={amexLogo} alt="American Express" className="h-6 w-auto rounded-sm" />
                            <img src={googlePayLogo} alt="Google Pay" className="h-6 w-auto" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Pay Button - Enterprise Style */}
                      <div className="pt-4 space-y-3">
                        <Button
                          size="lg"
                          onClick={handlePayment}
                          disabled={createOrderMutation.isPending}
                          className="w-full h-14 text-base font-semibold tracking-wide uppercase bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow-lg hover:shadow-xl transition-all duration-200"
                          data-testid="button-pay"
                        >
                          {createOrderMutation.isPending ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Processing Order...
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Lock className="h-4 w-4" />
                              R&nbsp;{total.toFixed(2)} - Pay Now
                            </span>
                          )}
                        </Button>
                        
                        {/* Security badges */}
                        <div className="flex items-center justify-center gap-6 pt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5" />
                            <span>256-bit SSL Encryption</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5" />
                            <span>PCI DSS Compliant</span>
                          </div>
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

                      {/* Customer & Delivery Details */}
                      <div className="pt-4 border-t mt-4 space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                            <User className="h-3.5 w-3.5" />
                            Contact
                          </Label>
                          <p className="text-sm font-medium" data-testid="text-summary-name">{form.watch("customerName")}</p>
                          <p className="text-sm text-muted-foreground" data-testid="text-summary-email">{form.watch("customerEmail")}</p>
                          <p className="text-sm text-muted-foreground" data-testid="text-summary-phone">{form.watch("customerPhone")}</p>
                        </div>

                        <div>
                          <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                            {deliveryMethod === "delivery" ? (
                              <>
                                <Truck className="h-3.5 w-3.5" />
                                Delivery Address
                              </>
                            ) : (
                              <>
                                <Building2 className="h-3.5 w-3.5" />
                                Pickup Store
                              </>
                            )}
                          </Label>
                          {deliveryMethod === "delivery" ? (
                            <div data-testid="text-summary-address">
                              <p className="text-sm font-medium">{form.watch("deliveryAddress")}</p>
                              <p className="text-sm text-muted-foreground">
                                {form.watch("deliveryCity")}, {form.watch("deliveryProvince")} {form.watch("deliveryPostalCode")}
                              </p>
                            </div>
                          ) : (
                            <div data-testid="text-summary-pickup">
                              <p className="text-sm font-medium">{STORES[pickupStore as keyof typeof STORES]?.name}</p>
                              <p className="text-sm text-muted-foreground">{STORES[pickupStore as keyof typeof STORES]?.address}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {tradeStatus?.approved && (
                        <div className="mt-4 bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-2">
                          <BadgePercent className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-primary">15% Trade Discount Applied</span>
                        </div>
                      )}

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
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={goToPreviousStep} 
                    className="gap-2"
                    data-testid="button-back-step4"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Address
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
                  <span className="text-lg font-bold text-primary whitespace-nowrap">R&nbsp;{total.toFixed(2)}</span>
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

    </div>
  );
}
