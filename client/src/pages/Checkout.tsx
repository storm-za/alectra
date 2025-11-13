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
import type { CartItem, UserAddress } from "@shared/schema";
import { MapPin } from "lucide-react";

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

      return await apiRequest("POST", "/api/orders", orderData);
    },
    onSuccess: () => {
      toast({
        title: "Order Placed Successfully!",
        description: "Thank you for your order. We'll contact you shortly with payment details.",
      });
      onClearCart();
      navigate("/");
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

  const subtotal = cartItems.reduce((sum, item) => {
    return sum + parseFloat(item.product.price) * item.quantity;
  }, 0);
  const vat = subtotal * 0.15;
  const total = subtotal + vat;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent>
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
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John Doe" {...field} data-testid="input-name" />
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
                            <FormLabel>Email</FormLabel>
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
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="0123456789" {...field} data-testid="input-phone" />
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
                          <FormLabel>Delivery Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="123 Main Street" {...field} data-testid="input-address" />
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

                    <Button type="submit" size="lg" className="w-full" disabled={createOrderMutation.isPending} data-testid="button-place-order">
                      {createOrderMutation.isPending ? "Processing..." : "Place Order"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => {
                  const priceWithVAT = (parseFloat(item.product.price) * 1.15).toFixed(2);
                  const lineTotal = (parseFloat(priceWithVAT) * item.quantity).toFixed(2);
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

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span data-testid="text-summary-subtotal">R {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>VAT (15%)</span>
                    <span data-testid="text-summary-vat">R {vat.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span data-testid="text-summary-total">R {total.toFixed(2)}</span>
                  </div>
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
