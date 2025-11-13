import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import CategoryPage from "@/pages/CategoryPage";
import Checkout from "@/pages/Checkout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Account from "@/pages/Account";
import Quote from "@/pages/Quote";
import NotFound from "@/pages/not-found";
import { useToast } from "@/hooks/use-toast";
import type { Product, CartItem } from "@shared/schema";

function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return null;
}

function Router() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const { toast } = useToast();

  const addToCart = (product: Product, quantity: number = 1) => {
    setCartItems((items) => {
      const existingItem = items.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        return items.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) }
            : item
        );
      }
      
      return [...items, { product, quantity: Math.min(quantity, product.stock) }];
    });

    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });

    setCartOpen(true);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setCartItems((items) => items.filter((item) => item.product.id !== productId));
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
          <Route path="/product/:slug">
            <ProductDetail onAddToCart={addToCart} />
          </Route>
          <Route path="/checkout">
            <Checkout cartItems={cartItems} onClearCart={clearCart} />
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
          <Route component={NotFound} />
        </Switch>
      </main>

      <Footer />

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
