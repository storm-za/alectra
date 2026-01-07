import { ShoppingCart, Phone, Menu, User, LogOut, ChevronDown, ChevronRight, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoImage from "@assets/Alectra (8)_1763021168076.png";

import Alectra__8__removebg_preview from "@assets/Alectra__8_-removebg-preview.png";

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
}

export default function Header({ cartItemCount, onCartClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authData } = useQuery<{ user: any | null }>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  const { data: categories } = useQuery<Array<{ id: string; name: string; slug: string }>>({
    queryKey: ["/api/categories"],
  });

  const user = authData?.user;

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], { user: null });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Success",
        description: "Logged out successfully",
      });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Logout failed",
        variant: "destructive",
      });
    },
  });

  const navigation = [
    { name: "Shop All", href: "/collections/all" },
    ...(categories || []).map(cat => ({ name: cat.name, href: `/collections/${cat.slug}` })),
    { name: "Contact Us", href: "/contact" },
    { name: "Trade Account", href: "/pages/trade-wholesale-registration" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between h-10 text-sm">
            <Link href="/quote" className="hover-elevate active-elevate-2 px-3 py-1 rounded-md font-medium">
              Request Quote
            </Link>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span className="font-medium">012 566 3123</span>
              <span className="hidden sm:inline text-primary-foreground/80">Mon-Sun: 08:00 - 16:45</span>
            </div>
          </div>
        </div>
      </div>
      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Search Overlay */}
          {isSearchOpen && (
            <div className="absolute inset-0 bg-background z-50 flex items-center px-4 lg:hidden">
              <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4"
                    autoFocus
                    data-testid="input-mobile-search"
                  />
                </div>
                <Button type="submit" size="sm" data-testid="button-mobile-search-submit">
                  Search
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery("");
                  }}
                  data-testid="button-mobile-search-close"
                >
                  <X className="h-5 w-5" />
                </Button>
              </form>
            </div>
          )}
          {/* Logo */}
          <Link href="/" className="flex items-center hover-elevate active-elevate-2 rounded-md px-2 py-1 -ml-2" data-testid="link-home-logo">
            <div className="h-16 w-auto overflow-hidden flex items-center justify-center">
              <img 
                src={Alectra__8__removebg_preview} 
                alt="Alectra Solutions - The Security Shop" 
                className="h-30 lg:h-24 w-auto object-contain"
              />
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Shop dropdown with all categories */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-3 py-2 text-sm font-medium" data-testid="button-shop-dropdown">
                  Shop <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/collections/all" className="cursor-pointer" data-testid="link-shop-all">
                    Shop All Products
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {categories?.map((category) => (
                  <DropdownMenuItem key={category.id} asChild>
                    <Link href={`/collections/${category.slug}`} className="cursor-pointer" data-testid={`link-category-${category.slug}`}>
                      {category.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Contact Us */}
            <Link href="/contact" className="px-3 py-2 rounded-md text-sm font-medium hover-elevate active-elevate-2" data-testid="link-contact">
              Contact Us
            </Link>

            {/* Trade Account */}
            <Link href="/pages/trade-wholesale-registration" className="px-3 py-2 rounded-md text-sm font-medium hover-elevate active-elevate-2" data-testid="link-trade-signup">
              Trade Account
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Search Button */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSearchOpen(true)}
              data-testid="button-search"
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* User menu - Desktop only */}
            <div className="hidden lg:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="button-user-menu">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {user?.name}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="flex items-center cursor-pointer" data-testid="link-account">
                        <User className="mr-2 h-4 w-4" />
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => logoutMutation.mutate()}
                      data-testid="button-logout"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" size="sm" data-testid="button-login-header">
                    Login
                  </Button>
                </Link>
              )}
            </div>

            {/* Cart button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onCartClick}
              className="relative"
              data-testid="button-cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  data-testid="badge-cart-count"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <SheetTitle className="text-lg font-semibold">Menu</SheetTitle>
                <nav className="flex flex-col gap-2 mt-8">
                  {/* Shop collapsible menu */}
                  <Collapsible open={shopMenuOpen} onOpenChange={setShopMenuOpen}>
                    <CollapsibleTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between px-3 py-2 text-base font-medium"
                        data-testid="button-shop-mobile"
                      >
                        Shop
                        <ChevronRight className={`h-4 w-4 transition-transform ${shopMenuOpen ? 'rotate-90' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex flex-col pl-4 mt-1">
                      <Link 
                        href="/collections/all"
                        className="px-3 py-2 rounded-md text-sm hover-elevate active-elevate-2"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="link-shop-all-mobile"
                      >
                        Shop All Products
                      </Link>
                      {categories?.map((category) => (
                        <Link 
                          key={category.id}
                          href={`/collections/${category.slug}`}
                          className="px-3 py-2 rounded-md text-sm hover-elevate active-elevate-2"
                          onClick={() => setMobileMenuOpen(false)}
                          data-testid={`link-category-${category.slug}-mobile`}
                        >
                          {category.name}
                        </Link>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Contact Us */}
                  <Link 
                    href="/contact"
                    className="px-3 py-2 rounded-md text-base font-medium hover-elevate active-elevate-2"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="link-contact-mobile"
                  >
                    Contact Us
                  </Link>

                  {/* Trade Account */}
                  <Link 
                    href="/pages/trade-wholesale-registration"
                    className="px-3 py-2 rounded-md text-base font-medium hover-elevate active-elevate-2"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid="link-trade-signup-mobile"
                  >
                    Trade Account
                  </Link>

                  {/* User section */}
                  {user ? (
                    <>
                      <div className="border-t pt-4 mt-2 text-sm text-muted-foreground px-3">
                        {user?.name}
                      </div>
                      <Button
                        variant="ghost"
                        className="justify-start"
                        onClick={() => {
                          logoutMutation.mutate();
                          setMobileMenuOpen(false);
                        }}
                        data-testid="button-logout-mobile"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Link href="/login">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setMobileMenuOpen(false)}
                        data-testid="button-login-mobile"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Login
                      </Button>
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
