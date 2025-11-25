import { Button } from "@/components/ui/button";
import { ShieldCheck, Truck, Wrench, Headset } from "lucide-react";
import { Link } from "wouter";
import cctvImage from "@assets/stock_images/cctv_security_camera_dd146803.jpg";
import gateImage from "@assets/stock_images/automatic_gate_motor_77a09190.jpg";
import fenceImage from "@assets/stock_images/electric_fence_secur_af307da6.jpg";

export default function Hero() {
  const scrollToCategories = () => {
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Hero section with real security images background */}
      <div className="relative bg-gray-900 overflow-hidden">
        {/* Real Security Images - Positioned as background collage */}
        <div className="absolute inset-0 pointer-events-none">
          {/* CCTV Camera - Left side */}
          <div className="absolute left-0 top-0 w-1/2 md:w-1/3 h-full overflow-hidden">
            <img 
              src={cctvImage} 
              alt="" 
              className="absolute w-full h-full object-cover opacity-30 md:opacity-40"
              style={{ objectPosition: 'center right' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-900/50 to-gray-900"></div>
          </div>
          
          {/* Gate Motor - Right side */}
          <div className="absolute right-0 top-0 w-1/2 md:w-1/3 h-full overflow-hidden">
            <img 
              src={gateImage} 
              alt="" 
              className="absolute w-full h-full object-cover opacity-30 md:opacity-40"
              style={{ objectPosition: 'center left' }}
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-gray-900/50 to-gray-900"></div>
          </div>
          
          {/* Electric Fence - Bottom subtle layer (desktop only) */}
          <div className="absolute bottom-0 left-1/4 right-1/4 h-1/2 overflow-hidden hidden lg:block">
            <img 
              src={fenceImage} 
              alt="" 
              className="absolute w-full h-full object-cover opacity-15"
              style={{ objectPosition: 'center top' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent"></div>
          </div>
        </div>
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gray-900/60"></div>
        
        {/* Orange gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/40 via-transparent to-orange-950/30"></div>
        
        {/* Bottom gradient for smooth transition */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
        
        {/* Subtle vignette effect */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.4)_100%)]"></div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-20 md:py-32 relative z-10">
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
