import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Briefcase, Phone } from "lucide-react";

const preferenceOptions = [
  "Gate Motors",
  "Garage Motors",
  "Garage Doors",
  "Anti-Theft Brackets",
  "Solar Panels",
  "Batteries",
  "Remotes",
  "Locks",
  "Lights",
  "Hardware",
  "Spares - PCB's etc.",
  "Cameras",
  "Alarm systems",
  "Electrical equipment",
  "Electric Fences",
];

const tradeSignupSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(9, "Valid phone number is required"),
  companyName: z.string().optional(),
  businessAddress: z.string().optional(),
  idNumber: z.string().min(13, "Valid 13-digit ID number is required").max(13, "ID number must be 13 digits"),
  vatNumber: z.string().optional(),
  storeUrl: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  preferences: z.array(z.string()).optional(),
  message: z.string().optional(),
});

type TradeSignupForm = z.infer<typeof tradeSignupSchema>;

export default function TradeSignup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<TradeSignupForm>({
    resolver: zodResolver(tradeSignupSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      companyName: "",
      businessAddress: "",
      idNumber: "",
      vatNumber: "",
      storeUrl: "",
      businessRegistrationNumber: "",
      preferences: [],
      message: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: TradeSignupForm) => {
      const response = await apiRequest("POST", "/api/trade/signup", data);
      return response;
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: "We've received your trade application and will be in touch soon.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Application Received!</h2>
            <p className="text-muted-foreground mb-6">
              Thank you for applying for trade pricing. We'll review your application and get back to you within 1-2 business days.
            </p>
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
      <div className="max-w-2xl mx-auto px-4 md:px-8">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Trade Pricing Application</h1>
          <p className="text-lg text-muted-foreground">
            Join our exclusive trade program for special pricing on bulk orders
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Apply for Trade Account</CardTitle>
            <CardDescription>
              Fill in your details below and we'll review your application. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => submitMutation.mutate(data))} className="space-y-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} data-testid="input-full-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} data-testid="input-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <div className="flex items-center px-3 bg-muted border border-r-0 rounded-l-md text-sm text-muted-foreground">
                              <Phone className="w-4 h-4 mr-1" />
                              +27
                            </div>
                            <Input 
                              placeholder="71 234 5678" 
                              className="rounded-l-none" 
                              {...field} 
                              data-testid="input-phone" 
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name (Trading as)</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC Security Solutions" {...field} data-testid="input-company-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="123 Main Street, Pretoria, Gauteng, 0001" 
                          className="min-h-20"
                          {...field} 
                          data-testid="input-business-address" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Number *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="8501015800088" 
                          maxLength={13}
                          {...field} 
                          data-testid="input-id-number" 
                        />
                      </FormControl>
                      <FormDescription>South African 13-digit ID number</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vatNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>VAT Number</FormLabel>
                        <FormControl>
                          <Input placeholder="4123456789" {...field} data-testid="input-vat-number" />
                        </FormControl>
                        <FormDescription>If VAT registered</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessRegistrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Registration Number</FormLabel>
                        <FormControl>
                          <Input placeholder="2023/123456/07" {...field} data-testid="input-registration-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="storeUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourstore.co.za" {...field} data-testid="input-store-url" />
                      </FormControl>
                      <FormDescription>If available</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferences"
                  render={() => (
                    <FormItem>
                      <FormLabel>Product Preferences</FormLabel>
                      <FormDescription className="mb-3">
                        Select the product categories you're interested in
                      </FormDescription>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {preferenceOptions.map((option) => (
                          <FormField
                            key={option}
                            control={form.control}
                            name="preferences"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(option)}
                                    onCheckedChange={(checked) => {
                                      const current = field.value || [];
                                      if (checked) {
                                        field.onChange([...current, option]);
                                      } else {
                                        field.onChange(current.filter((v) => v !== option));
                                      }
                                    }}
                                    data-testid={`checkbox-${option.toLowerCase().replace(/\s+/g, '-')}`}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer">
                                  {option}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about your business and how we can help..." 
                          className="min-h-24"
                          {...field} 
                          data-testid="input-message" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-muted/50 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    By submitting this application, you confirm that all information provided is accurate. We'll review your application and contact you within 1-2 business days.
                  </p>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full" 
                  disabled={submitMutation.isPending}
                  data-testid="button-submit-application"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
