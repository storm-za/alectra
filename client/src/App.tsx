import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect, lazy, Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import MobileNav from "@/components/MobileNav";
import { useToast } from "@/hooks/use-toast";
import type { Product, CartItem, ProductVariant } from "@shared/schema";

const WhatsAppButton = lazy(() => import("@/components/WhatsAppButton"));

// Lazy load pages for code splitting - reduces initial bundle size
const Home = lazy(() => import("@/pages/Home"));
const Products = lazy(() => import("@/pages/Products"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const OrderSuccess = lazy(() => import("@/pages/OrderSuccess"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const Account = lazy(() => import("@/pages/Account"));
const Quote = lazy(() => import("@/pages/Quote"));
const TradeSignup = lazy(() => import("@/pages/TradeSignup"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Stores = lazy(() => import("@/pages/Stores"));
const FAQ = lazy(() => import("@/pages/FAQ"));
const Shipping = lazy(() => import("@/pages/Shipping"));
const Returns = lazy(() => import("@/pages/Returns"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const Search = lazy(() => import("@/pages/Search"));
const AdminSeed = lazy(() => import("@/pages/AdminSeed"));
const Admin = lazy(() => import("@/pages/Admin"));
const AdminProducts = lazy(() => import("@/pages/AdminProducts"));
const AdminDiscountCodes = lazy(() => import("@/pages/AdminDiscountCodes"));
const MyShop = lazy(() => import("@/pages/MyShop"));
const Discover = lazy(() => import("@/pages/Discover"));
const Profile = lazy(() => import("@/pages/Profile"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Track page visit (don't track admin pages)
    if (!location.startsWith('/admin')) {
      fetch('/api/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          path: location,
          referrer: document.referrer || null
        }),
        credentials: 'include'
      }).catch(() => {
        // Silently fail - analytics shouldn't interrupt user experience
      });
    }
  }, [location]);

  return null;
}

// Helper to create a unique cart item key (productId + variant for LP Gas)
const getCartItemKey = (item: CartItem) => {
  return item.variant ? `${item.product.id}-${item.variant}` : item.product.id;
};

// Cart persistence helpers
const CART_STORAGE_KEY = "alectra_cart";
const CART_EXPIRY_HOURS = 24;

interface StoredCart {
  items: CartItem[];
  timestamp: number;
}

const loadCartFromStorage = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    if (!stored) return [];
    
    const data: StoredCart = JSON.parse(stored);
    const hoursElapsed = (Date.now() - data.timestamp) / (1000 * 60 * 60);
    
    // Clear cart if older than 24 hours
    if (hoursElapsed > CART_EXPIRY_HOURS) {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
    
    return data.items || [];
  } catch {
    return [];
  }
};

const saveCartToStorage = (items: CartItem[]) => {
  try {
    if (items.length === 0) {
      localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      const data: StoredCart = {
        items,
        timestamp: Date.now()
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // Storage might be full or unavailable
  }
};

function Router() {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => loadCartFromStorage());
  const [cartOpen, setCartOpen] = useState(false);
  const { toast } = useToast();

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    saveCartToStorage(cartItems);
  }, [cartItems]);

  const addToCart = (product: Product, quantity: number = 1, variant?: ProductVariant, variantPrice?: string) => {
    setCartItems((items) => {
      // For products with variants (LP Gas, Glosteel doors), match by product ID AND variant type
      const existingItem = items.find((item) => 
        item.product.id === product.id && item.variant === variant
      );
      
      if (existingItem) {
        return items.map((item) =>
          item.product.id === product.id && item.variant === variant
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      }
      
      return [...items, { 
        product, 
        quantity: Math.min(quantity, product.stock),
        variant,
        variantPrice
      }];
    });

    setCartOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number, variant?: ProductVariant) => {
    setCartItems((items) =>
      items.map((item) =>
        item.product.id === productId && item.variant === variant 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const removeItem = (productId: string, variant?: ProductVariant) => {
    setCartItems((items) => items.filter((item) => 
      !(item.product.id === productId && item.variant === variant)
    ));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <Header cartItemCount={cartItemCount} onCartClick={() => setCartOpen(true)} />
      
      <main className="flex-1 pb-16 lg:pb-0">
        <Suspense fallback={<PageLoader />}>
          <Switch>
            <Route path="/">
              <Home onAddToCart={addToCart} />
            </Route>
            <Route path="/collections/all">
              <Products onAddToCart={addToCart} />
            </Route>
            <Route path="/category/:slug">
              <CategoryPage onAddToCart={addToCart} />
            </Route>
            <Route path="/collections/:slug">
              <CategoryPage onAddToCart={addToCart} />
            </Route>
            <Route path="/products/:slug">
              <ProductDetail onAddToCart={addToCart} />
            </Route>
            <Route path="/checkout">
              <Checkout cartItems={cartItems} onClearCart={clearCart} />
            </Route>
            <Route path="/order-success">
              <OrderSuccess onClearCart={clearCart} />
            </Route>
            <Route path="/login">
              <Login />
            </Route>
            <Route path="/register">
              <Register />
            </Route>
            <Route path="/account">
              <Account onAddToCart={addToCart} />
            </Route>
            <Route path="/quote">
              <Quote />
            </Route>
            <Route path="/pages/trade-wholesale-registration">
              <TradeSignup />
            </Route>
            <Route path="/about">
              <About />
            </Route>
            <Route path="/contact">
              <Contact />
            </Route>
            <Route path="/stores">
              <Stores />
            </Route>
            <Route path="/faq">
              <FAQ />
            </Route>
            <Route path="/shipping">
              <Shipping />
            </Route>
            <Route path="/returns">
              <Returns />
            </Route>
            <Route path="/privacy">
              <Privacy />
            </Route>
            <Route path="/blogs">
              <Blog />
            </Route>
            <Route path="/blogs/about-alectra-solutions/:slug">
              <BlogPost />
            </Route>
            <Route path="/search">
              <Search onAddToCart={addToCart} />
            </Route>
            <Route path="/admin">
              <Admin />
            </Route>
            <Route path="/admin/seed">
              <AdminSeed />
            </Route>
            <Route path="/admin/products">
              <AdminProducts />
            </Route>
            <Route path="/admin/discount-codes">
              <AdminDiscountCodes />
            </Route>
            <Route path="/my-shop">
              <MyShop onAddToCart={addToCart} />
            </Route>
            <Route path="/discover">
              <Discover />
            </Route>
            <Route path="/profile">
              <Profile />
            </Route>
            <Route component={NotFound} />
          </Switch>
        </Suspense>
      </main>

      <Footer />
      <Suspense fallback={null}>
        <WhatsAppButton />
      </Suspense>
      <MobileNav cartItemCount={cartItemCount} onCartClick={() => setCartOpen(true)} />

      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
      />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
