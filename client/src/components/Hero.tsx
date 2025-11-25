import { Button } from "@/components/ui/button";
import { ShieldCheck, Truck, Wrench, Headset } from "lucide-react";
import { Link } from "wouter";
import cameraImage1 from "@assets/stock_images/white_cctv_security__702d93a4.jpg";
import cameraImage2 from "@assets/stock_images/security_camera_dome_0ca5f310.jpg";

export default function Hero() {
  const scrollToCategories = () => {
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Hero section */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden min-h-[600px] md:min-h-[500px]">
        
        {/* Subtle grid pattern background */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Orange glow effect - Top right corner */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px]"></div>
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-yellow-500/15 rounded-full blur-[80px] hidden lg:block"></div>
        
        {/* Mobile: Camera positioned at top right */}
        <div className="absolute top-4 right-0 w-48 h-48 md:hidden pointer-events-none">
          <div className="relative w-full h-full">
            {/* Orange glow ring for mobile */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500/30 to-yellow-500/30 blur-xl scale-110"></div>
            <img 
              src={cameraImage1} 
              alt="Security Camera" 
              className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl opacity-90"
            />
          </div>
        </div>
        
        {/* Desktop: Camera showcase on right side */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[45%] h-full hidden md:flex items-center justify-center pointer-events-none">
          {/* Orange glowing ring effect */}
          <div className="absolute w-[400px] h-[400px] lg:w-[500px] lg:h-[500px]">
            <div 
              className="absolute inset-0 rounded-full border-2 border-orange-500/40"
              style={{
                boxShadow: '0 0 60px 10px rgba(255, 152, 0, 0.3), inset 0 0 60px 10px rgba(255, 152, 0, 0.1)'
              }}
            ></div>
            <div 
              className="absolute inset-4 rounded-full border border-yellow-500/30"
              style={{
                boxShadow: '0 0 40px 5px rgba(255, 235, 59, 0.2)'
              }}
            ></div>
          </div>
          
          {/* Main camera image */}
          <div className="relative z-10">
            <img 
              src={cameraImage1} 
              alt="CCTV Security Camera" 
              className="w-72 h-72 lg:w-96 lg:h-96 object-contain drop-shadow-[0_0_30px_rgba(255,152,0,0.3)]"
            />
          </div>
          
          {/* Secondary camera - positioned offset */}
          <div className="absolute bottom-16 right-8 lg:right-16 z-20">
            <img 
              src={cameraImage2} 
              alt="Dome Camera" 
              className="w-32 h-32 lg:w-44 lg:h-44 object-contain drop-shadow-[0_0_20px_rgba(255,152,0,0.25)] opacity-95"
            />
          </div>
        </div>
        
        {/* Content - Left aligned on desktop, centered on mobile */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-24 relative z-10 h-full flex items-center">
          <div className="w-full md:w-1/2 text-center md:text-left pt-32 md:pt-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 md:mb-6">
              South Africa's Trusted{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                Security Store
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 md:mb-8 max-w-lg mx-auto md:mx-0">
              Gate Motors, Remotes, Batteries, CCTV Systems & More. Delivered Nationwide with Expert Support.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-3 sm:gap-4 mb-8 md:mb-10">
              <Button 
                size="lg" 
                className="text-base font-semibold min-w-[160px] sm:min-w-[180px] bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-0"
                onClick={scrollToCategories}
                data-testid="button-shop-now"
              >
                Shop Now
              </Button>
              <Link href="/quote">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-base font-semibold min-w-[160px] sm:min-w-[180px] bg-white/5 backdrop-blur-sm border-white/30 text-white hover:bg-white/15 hover:border-white/50"
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
              <span className="text-white/60">· 49 Reviews</span>
            </div>
          </div>
        </div>
        
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
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
