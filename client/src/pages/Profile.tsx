import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { User, Package, MapPin, Settings, LogOut, ChevronRight, Shield, HelpCircle, FileText, Heart } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { SEO } from "@/components/SEO";

export default function Profile() {
  const [, navigate] = useLocation();

  const { data: user, isLoading } = useQuery<{ user: any | null }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], { user: null });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      navigate("/");
    },
  });

  const isLoggedIn = !!user?.user;

  const menuItems = [
    { icon: Package, label: "My Orders", href: "/account", description: "Track and manage your orders" },
    { icon: MapPin, label: "My Addresses", href: "/account", description: "Manage delivery addresses" },
    { icon: Heart, label: "Saved Items", href: "/my-shop", description: "Your wishlist and favorites" },
    { icon: Settings, label: "Account Settings", href: "/account", description: "Update your details" },
  ];

  const supportItems = [
    { icon: HelpCircle, label: "Help & FAQ", href: "/faq" },
    { icon: FileText, label: "Shipping Policy", href: "/shipping" },
    { icon: Shield, label: "Privacy Policy", href: "/privacy" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center pb-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <SEO 
        title="My Profile | Alectra Solutions"
        description="Manage your account, orders, and preferences."
      />
      
      <div className="min-h-screen bg-muted/30 pb-24">
        <div className="bg-background border-b">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold tracking-tight">MY PROFILE</h1>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {isLoggedIn ? (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg truncate">{user.user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.user.email}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                {menuItems.map((item) => (
                  <Card key={item.label} className="hover-elevate">
                    <Link href={item.href} data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <item.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium" data-testid={`text-menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground px-1 mb-3">Support</p>
                {supportItems.map((item) => (
                  <Card key={item.label} className="hover-elevate">
                    <Link href={item.href} data-testid={`link-support-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium flex-1" data-testid={`text-support-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>{item.label}</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </CardContent>
                    </Link>
                  </Card>
                ))}
              </div>

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
              </Button>
            </>
          ) : (
            <section className="text-center py-12">
              <div className="max-w-sm mx-auto space-y-6">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-2">Welcome</h2>
                  <p className="text-muted-foreground">
                    Sign in to manage your orders, track deliveries, and access your account settings.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <Button asChild size="lg" data-testid="button-signin-profile">
                    <Link href="/login">Sign In</Link>
                  </Button>
                  <Button variant="outline" asChild size="lg" data-testid="button-register-profile">
                    <Link href="/register">Create Account</Link>
                  </Button>
                </div>

                <Separator className="my-6" />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground mb-3">Support</p>
                  {supportItems.map((item) => (
                    <Card key={item.label} className="hover-elevate">
                      <Link href={item.href}>
                        <CardContent className="p-4 flex items-center gap-4">
                          <item.icon className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium flex-1">{item.label}</span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
