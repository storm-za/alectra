import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
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
import { useToast } from "@/hooks/use-toast";
import { insertTradeApplicationSchema, type InsertTradeApplication } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TradeSignup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check if user is authenticated
  const { data: userData, isLoading: userLoading } = useQuery<{ user: any }>({
    queryKey: ["/api/auth/me"],
  });

  // Check trade application status
  const { data: tradeStatus, isLoading: statusLoading } = useQuery<{
    hasApplication: boolean;
    approved: boolean;
    createdAt?: string;
    approvedAt?: string;
  }>({
    queryKey: ["/api/trade/status"],
    enabled: !!userData?.user,
  });

  const form = useForm<InsertTradeApplication>({
    resolver: zodResolver(insertTradeApplicationSchema),
    defaultValues: {
      companyName: "",
      registrationNumber: "",
      taxNumber: "",
      businessType: "",
      physicalAddress: "",
      yearsInBusiness: 0 as number,
      contactPerson: "",
      contactPhone: "",
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (data: InsertTradeApplication) => {
      const response = await apiRequest("POST", "/api/trade/apply", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trade/status"] });
      toast({
        title: "Application Submitted",
        description: "Your trade application has been submitted successfully. We'll review it and get back to you soon.",
      });
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (userLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!userData?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to apply for trade pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please log in or create an account to apply for our trade pricing program.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/login")} className="flex-1" data-testid="button-login">
                Login
              </Button>
              <Button onClick={() => navigate("/register")} variant="outline" className="flex-1" data-testid="button-register">
                Register
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tradeStatus?.hasApplication) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Application Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tradeStatus.approved ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Application Approved</AlertTitle>
                <AlertDescription>
                  Congratulations! Your trade application has been approved. You now receive 15% off all orders at checkout.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Application Pending</AlertTitle>
                <AlertDescription>
                  Your trade application is currently under review. We'll notify you once it has been processed.
                </AlertDescription>
              </Alert>
            )}
            <Button onClick={() => navigate("/")} className="w-full" data-testid="button-back-home">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="max-w-3xl mx-auto px-4 md:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-3">Trade Pricing Application</h1>
          <p className="text-lg text-muted-foreground">
            Join our exclusive trade program for 15% discount on all orders
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              Please provide accurate information about your business. We verify all applications to ensure eligibility.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => applyMutation.mutate(data))} className="space-y-6">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC Security Solutions" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Registration Number</FormLabel>
                        <FormControl>
                          <Input placeholder="2023/123456/07" {...field} data-testid="input-registration-number" />
                        </FormControl>
                        <FormDescription>Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT/Tax Number</FormLabel>
                        <FormControl>
                          <Input placeholder="4123456789" {...field} data-testid="input-tax-number" />
                        </FormControl>
                        <FormDescription>Optional</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-business-type">
                              <SelectValue placeholder="Select business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Security Installer">Security Installer</SelectItem>
                            <SelectItem value="Electrician">Electrician</SelectItem>
                            <SelectItem value="Gate Motor Specialist">Gate Motor Specialist</SelectItem>
                            <SelectItem value="CCTV Installer">CCTV Installer</SelectItem>
                            <SelectItem value="Alarm Technician">Alarm Technician</SelectItem>
                            <SelectItem value="Security Company">Security Company</SelectItem>
                            <SelectItem value="Reseller">Reseller</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yearsInBusiness"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years in Business *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0" 
                            placeholder="5" 
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            data-testid="input-years-in-business" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="physicalAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Business Address *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="123 Main Street, Johannesburg, Gauteng, 2000" 
                          className="min-h-20"
                          {...field} 
                          data-testid="input-physical-address" 
                        />
                      </FormControl>
                      <FormDescription>
                        Full street address including city and postal code
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Contact Person</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} data-testid="input-contact-person" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Phone *</FormLabel>
                          <FormControl>
                            <Input placeholder="0123456789" {...field} data-testid="input-contact-phone" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    By submitting this application, you confirm that all information provided is accurate and that you are authorized to represent the business. We reserve the right to verify all details before approval.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full" 
                  disabled={applyMutation.isPending}
                  data-testid="button-submit-application"
                >
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
