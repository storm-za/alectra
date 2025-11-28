import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import WhatsAppButton from "@/components/WhatsAppButton";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import CategoryPage from "@/pages/CategoryPage";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Account from "@/pages/Account";
import Quote from "@/pages/Quote";
import TradeSignup from "@/pages/TradeSignup";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Stores from "@/pages/Stores";
import FAQ from "@/pages/FAQ";
import Shipping from "@/pages/Shipping";
import Returns from "@/pages/Returns";
import Privacy from "@/pages/Privacy";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import AdminSeed from "@/pages/AdminSeed";
import NotFound from "@/pages/not-found";
import { useToast } from "@/hooks/use-toast";
import type { Product, CartItem, ProductVariant } from "@shared/schema";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

// Helper to create a unique cart item key (productId + variant for LP Gas)
const getCartItemKey = (item: CartItem) => {
  return item.variant ? `${item.product.id}-${item.variant}` : item.product.id;
};

function Router() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const { toast } = useToast();

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
      
      <main className="flex-1">
        <Switch>
          <Route path="/">
            <Home onAddToCart={addToCart} />
          </Route>
          <Route path="/products">
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
            <OrderSuccess />
          </Route>
          <Route path="/login">
            <Login />
          </Route>
          <Route path="/register">
            <Register />
          </Route>
          <Route path="/account">
            <Account />
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
          <Route path="/admin/seed">
            <AdminSeed />
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>

      <Footer />
      <WhatsAppButton />

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
