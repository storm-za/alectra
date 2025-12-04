import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Truck, Mail, Phone } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import type { PaystackVerifyResponse } from "@shared/schema";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface OrderSuccessProps {
  onClearCart?: () => void;
}

export default function OrderSuccess({ onClearCart }: OrderSuccessProps) {
  const [, navigate] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const reference = searchParams.get("reference");
  const orderId = searchParams.get("orderId");
  const provider = searchParams.get("provider");
  // Yoco may add 'id' parameter when redirecting back
  const yocoCheckoutId = searchParams.get("id");
  const cartClearedRef = useRef(false);

  // Log URL parameters for debugging
  console.log("OrderSuccess URL params:", { reference, orderId, provider, yocoCheckoutId });

  // For Yoco, we can use the checkout ID from URL (if Yoco provides it) or fetch from order
  const { data: orderData, error: orderError } = useQuery<{ paymentReference: string; total: string } | null>({
    queryKey: ["/api/orders", orderId, "payment-ref"],
    queryFn: async () => {
      if (!orderId || provider !== "yoco") return null;
      console.log("Fetching order data for Yoco verification:", orderId);
      const res = await apiRequest("GET", `/api/orders/${orderId}`);
      const data = await res.json();
      console.log("Order data received:", data);
      return { paymentReference: data.paymentReference, total: data.total };
    },
    enabled: !!orderId && provider === "yoco" && !yocoCheckoutId,
    retry: 3,
    retryDelay: 1000,
  });

  // Use Yoco checkout ID from URL if available, otherwise use from order
  const effectiveYocoCheckoutId = yocoCheckoutId || orderData?.paymentReference;

  // Paystack verification (popup flow)
  const { data: paystackData, isLoading: isPaystackLoading } = useQuery<PaystackVerifyResponse>({
    queryKey: ["/api/payment/verify", reference],
    queryFn: async () => {
      if (!reference) throw new Error("No payment reference provided");
      const res = await apiRequest("GET", `/api/payment/verify/${reference}`);
      return await res.json();
    },
    enabled: !!reference && provider !== "yoco",
    retry: false,
  });

  // Yoco verification (redirect flow)
  const { data: yocoData, isLoading: isYocoLoading, error: yocoError } = useQuery<PaystackVerifyResponse>({
    queryKey: ["/api/payment/yoco/verify", effectiveYocoCheckoutId],
    queryFn: async () => {
      if (!effectiveYocoCheckoutId) throw new Error("No checkout ID found");
      console.log("Verifying Yoco payment with checkout ID:", effectiveYocoCheckoutId);
      const res = await apiRequest("GET", `/api/payment/yoco/verify/${effectiveYocoCheckoutId}`);
      const data = await res.json();
      console.log("Yoco verification response:", data);
      return data;
    },
    enabled: !!effectiveYocoCheckoutId && provider === "yoco",
    retry: 3,
    retryDelay: 1000,
  });

  // Use the appropriate payment data based on provider
  const paymentData = provider === "yoco" ? yocoData : paystackData;
  const isLoading = provider === "yoco" 
    ? (isYocoLoading || (!effectiveYocoCheckoutId && !orderError)) 
    : isPaystackLoading;
  
  // Get amount for display - Yoco may need to fall back to order total
  const displayAmount = paymentData?.data?.amount || (orderData?.total ? parseFloat(orderData.total) : 0);

  // Clear cart for Yoco after successful payment verification
  useEffect(() => {
    if (provider === "yoco" && paymentData?.status === "success" && !cartClearedRef.current) {
      cartClearedRef.current = true;
      // Clear pending order from sessionStorage
      sessionStorage.removeItem('pendingYocoOrderId');
      // Clear the cart if callback provided
      if (onClearCart) {
        onClearCart();
      }
    }
  }, [provider, paymentData, onClearCart]);

  // Track Google Ads conversion when payment is successful
  useEffect(() => {
    if (paymentData?.status === "success" && displayAmount > 0 && window.gtag) {
      window.gtag('event', 'conversion', {
        'send_to': 'AW-16880658158/WiiqCKOTia4aEO7NqfE-',
        'value': displayAmount,
        'currency': 'ZAR',
        'transaction_id': orderId || reference || ''
      });
    }
  }, [paymentData, displayAmount, orderId, reference]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (!paymentData || paymentData.status !== "success" || !paymentData.data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-destructive">Payment Verification Failed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {paymentData?.message || "We couldn't verify your payment. Please contact our support team with your order reference."}
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate("/collections/all")} className="w-full" data-testid="button-continue-shopping">
                Continue Shopping
              </Button>
              <Button onClick={() => navigate("/account")} variant="outline" className="w-full" data-testid="button-view-orders">
                View My Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <Card className="border-2 border-primary/20">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-bold mb-2">Payment Successful!</CardTitle>
            <p className="text-muted-foreground">
              Thank you for your order. Your payment has been confirmed.
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-6 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Order ID</span>
                <span className="font-mono font-semibold" data-testid="text-order-id">
                  {orderId?.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Payment Reference</span>
                <span className="font-mono text-sm" data-testid="text-payment-reference">
                  {reference}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Amount Paid</span>
                <span className="font-bold text-lg text-primary" data-testid="text-amount-paid">
                  R {displayAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-background">
                <CardContent className="p-4 text-center">
                  <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold text-sm mb-1">Email Confirmation</h3>
                  <p className="text-xs text-muted-foreground">
                    Order details sent to your email
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-4 text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold text-sm mb-1">Order Processing</h3>
                  <p className="text-xs text-muted-foreground">
                    Your order is being prepared
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-4 text-center">
                  <Truck className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold text-sm mb-1">Delivery</h3>
                  <p className="text-xs text-muted-foreground">
                    Via The Courier Guy
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>We'll send you an email confirmation with your order details</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Our team will contact you within 24 hours to confirm delivery details</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Track your order status via the link we'll send you.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>Delivery via The Courier Guy (2-5 business days)</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={() => navigate("/collections/all")} className="flex-1" variant="outline" data-testid="button-continue-shopping">
                Continue Shopping
              </Button>
              <Button onClick={() => navigate("/account")} className="flex-1" data-testid="button-view-orders">
                View My Orders
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground pt-4">
              <p>Need help? Contact us at <a href="tel:0125663123" className="text-primary hover:underline">012 566 3123</a></p>
              <p className="mt-1">or email <a href="mailto:solutionsalectra@gmail.com" className="text-primary hover:underline">solutionsalectra@gmail.com</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
