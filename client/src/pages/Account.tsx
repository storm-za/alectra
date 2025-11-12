import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, MapPin, Package } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserAddressSchema, type UserAddress, type Order, type OrderItem } from "@shared/schema";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileFormSchema>;

export default function Account() {
  const { toast } = useToast();
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

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

      <Tabs defaultValue="profile" className="w-full">
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

                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.productId}</span>
                            <span>Qty: {item.quantity} × R{item.priceAtPurchase}</span>
                          </div>
                        ))}
                      </div>

                      <Separator />

                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span data-testid={`total-${order.id}`}>R{order.total}</span>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p>Deliver to: {order.customerName}</p>
                        <p>{order.deliveryAddress}, {order.deliveryCity}</p>
                        <p>{order.deliveryProvince}, {order.deliveryPostalCode}</p>
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
    </div>
  );
}
