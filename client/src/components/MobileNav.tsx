import { useLocation, Link } from "wouter";
import { Home, Search, ShoppingBag, User, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  cartItemCount: number;
  onCartClick: () => void;
}

export default function MobileNav({ cartItemCount, onCartClick }: MobileNavProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home", testId: "nav-home" },
    { href: "/discover", icon: Search, label: "Discover", testId: "nav-discover" },
    { href: "/my-shop", icon: ShoppingBag, label: "My Shop", testId: "nav-my-shop" },
    { href: "/profile", icon: User, label: "My Profile", testId: "nav-my-profile" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors",
              isActive(item.href)
                ? "text-foreground"
                : "text-muted-foreground"
            )}
            data-testid={item.testId}
          >
            <item.icon className={cn("h-5 w-5", isActive(item.href) && "stroke-[2.5]")} />
            <span className={cn(
              "text-[10px] mt-0.5 font-medium",
              isActive(item.href) && "font-semibold"
            )}>
              {item.label}
            </span>
          </Link>
        ))}
        
        <button
          onClick={onCartClick}
          className="flex flex-col items-center justify-center flex-1 h-full py-1 text-muted-foreground transition-colors relative"
          data-testid="nav-basket"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {cartItemCount > 9 ? "9+" : cartItemCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 font-medium">Basket</span>
        </button>
      </div>
    </nav>
  );
}
