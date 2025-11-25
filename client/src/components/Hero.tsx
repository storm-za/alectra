import { Button } from "@/components/ui/button";
import { ShieldCheck, Truck, Wrench, Headset, Camera, Shield, Lock, Wifi, Radio, Eye } from "lucide-react";
import { Link } from "wouter";

export default function Hero() {
  const scrollToCategories = () => {
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Hero section with gradient overlay */}
      <div className="relative bg-gradient-to-br from-gray-900 via-orange-950 to-gray-900 overflow-hidden">
        {/* Subtle orange pattern overlay */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNGRjk4MDAiIGZpbGwtb3BhY2l0eT0iMC4wOCI+PHBhdGggZD0iTTM2IDE0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnpNNiAzNGMzLjMxIDAgNi0yLjY5IDYtNnMtMi42OS02LTYtNi02IDIuNjktNiA2IDIuNjkgNiA2IDZ6TTM2IDU0YzMuMzEgMCA2LTIuNjkgNi02cy0yLjY5LTYtNi02LTYgMi42OS02IDYgMi42OSA2IDYgNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
        {/* Radial gradient accent */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-900/30 via-transparent to-transparent"></div>
        
        {/* Security Background Imagery - Left Side */}
        <div className="absolute left-0 top-0 bottom-0 w-1/3 pointer-events-none overflow-hidden">
          {/* Large CCTV Camera - Top Left */}
          <div className="absolute -left-8 top-8 md:left-4 md:top-12 opacity-[0.08] md:opacity-[0.12]">
            <Camera className="w-32 h-32 md:w-48 md:h-48 text-orange-400 transform -rotate-12" strokeWidth={1} />
          </div>
          {/* Shield - Middle Left */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-[0.06] md:opacity-[0.10] hidden sm:block">
            <Shield className="w-24 h-24 md:w-36 md:h-36 text-orange-300 transform rotate-6" strokeWidth={1} />
          </div>
          {/* Lock - Bottom Left */}
          <div className="absolute left-8 bottom-12 md:left-16 md:bottom-16 opacity-[0.07] md:opacity-[0.11]">
            <Lock className="w-20 h-20 md:w-28 md:h-28 text-orange-400 transform -rotate-6" strokeWidth={1} />
          </div>
        </div>
        
        {/* Security Background Imagery - Right Side */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 pointer-events-none overflow-hidden">
          {/* Eye/Surveillance - Top Right */}
          <div className="absolute -right-4 top-16 md:right-8 md:top-16 opacity-[0.08] md:opacity-[0.12]">
            <Eye className="w-28 h-28 md:w-40 md:h-40 text-orange-300 transform rotate-12" strokeWidth={1} />
          </div>
          {/* Wifi Signal - Middle Right */}
          <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-[0.06] md:opacity-[0.10] hidden sm:block">
            <Wifi className="w-20 h-20 md:w-32 md:h-32 text-orange-400 transform -rotate-12" strokeWidth={1} />
          </div>
          {/* Radio/Remote - Bottom Right */}
          <div className="absolute right-4 bottom-8 md:right-12 md:bottom-12 opacity-[0.07] md:opacity-[0.11]">
            <Radio className="w-24 h-24 md:w-32 md:h-32 text-orange-300 transform rotate-6" strokeWidth={1} />
          </div>
        </div>
        
        {/* Additional floating security elements - Center background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Small floating cameras scattered */}
          <div className="absolute left-1/4 top-8 opacity-[0.04] md:opacity-[0.06] hidden lg:block">
            <Camera className="w-16 h-16 text-white transform rotate-45" strokeWidth={1} />
          </div>
          <div className="absolute right-1/4 bottom-16 opacity-[0.04] md:opacity-[0.06] hidden lg:block">
            <Camera className="w-14 h-14 text-white transform -rotate-12" strokeWidth={1} />
          </div>
          <div className="absolute left-1/3 bottom-20 opacity-[0.03] md:opacity-[0.05] hidden lg:block">
            <Shield className="w-12 h-12 text-orange-200" strokeWidth={1} />
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
              South Africa's Trusted Security Store
            </h1>
            <p className="text-lg md:text-xl text-slate-200 mb-8 max-w-2xl mx-auto">
              Gate Motors, Remotes, Batteries, CCTV Systems & More. Delivered Nationwide with Expert Support.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button 
                size="lg" 
                className="text-base font-semibold min-w-[180px]"
                onClick={scrollToCategories}
                data-testid="button-shop-now"
              >
                Shop Now
              </Button>
              <Link href="/quote">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-base font-semibold min-w-[180px] bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                  data-testid="button-request-quote"
                >
                  Request Quote
                </Button>
              </Link>
            </div>

            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              <span className="text-yellow-400">★★★★★</span>
              <span className="font-medium">4.5 Google Rating</span>
              <span className="text-white/70">· 49 Reviews</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="border-b bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base">Secure Shopping</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">SSL encrypted checkout</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base">Nationwide Delivery</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Via The Courier Guy</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base">Installer-Grade</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Professional equipment</p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Headset className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm md:text-base">Expert Support</h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-1">Technical advice available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
