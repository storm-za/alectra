import { Button } from "@/components/ui/button";
import { ShieldCheck, Truck, Wrench, Headset } from "lucide-react";
import { Link } from "wouter";
import heroBackground from "@assets/STORM (500 x 250 px) (2)_1764057402889.png";
import cameraImage1 from "@assets/stock_images/white_cctv_bullet_ca_661cb0fa.jpg";

export default function Hero() {
  const scrollToCategories = () => {
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Hero section - Desktop version with custom background */}
      <div className="relative overflow-hidden">
        
        {/* ===== DESKTOP HERO (md and up) ===== */}
        <div className="hidden md:block relative min-h-[480px] lg:min-h-[520px]">
          {/* Custom background image with cameras */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${heroBackground})` }}
          />
          
          {/* Content - Left Aligned */}
          <div className="relative z-10 max-w-7xl mx-auto px-8 lg:px-12 h-full flex items-center min-h-[480px] lg:min-h-[520px]">
            <div className="w-full md:w-[50%] lg:w-[45%]">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white mb-5 leading-tight">
                South Africa's Trusted{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                  Security Store
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-200 mb-8 max-w-md leading-relaxed">
                Gate Motors, Remotes, Batteries, CCTV Systems & More. Delivered Nationwide with Expert Support.
              </p>
              
              <div className="flex items-start gap-4">
                <Button 
                  size="lg" 
                  className="text-base font-semibold px-8 py-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-0 rounded-full"
                  onClick={scrollToCategories}
                  data-testid="button-shop-now"
                >
                  Shop Now
                </Button>
                <Link href="/quote">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-base font-semibold px-8 py-6 bg-transparent border-2 border-white/40 text-white hover:bg-white/10 hover:border-white/60 rounded-full"
                    data-testid="button-request-quote"
                  >
                    Request Quote
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* ===== MOBILE HERO (below md) ===== */}
        <div className="md:hidden relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
          {/* Orange glow accents */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-500/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-500/15 rounded-full blur-[60px]"></div>
          
          {/* Camera image positioned strategically */}
          <div className="absolute top-6 right-0 w-40 h-32 pointer-events-none opacity-80">
            <img 
              src={cameraImage1} 
              alt="Security Camera" 
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </div>
          
          {/* Content */}
          <div className="relative z-10 px-4 pt-20 pb-12">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4">
                South Africa's Trusted{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                  Security Store
                </span>
              </h1>
              <p className="text-base text-slate-300 mb-6 max-w-sm mx-auto">
                Gate Motors, Remotes, CCTV & More. Delivered Nationwide.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button 
                  size="lg" 
                  className="text-base font-semibold w-full sm:w-auto min-w-[160px] bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-0 rounded-full"
                  onClick={scrollToCategories}
                  data-testid="button-shop-now-mobile"
                >
                  Shop Now
                </Button>
                <Link href="/quote">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-base font-semibold w-full sm:w-auto min-w-[160px] bg-transparent border-2 border-white/40 text-white hover:bg-white/10 rounded-full"
                    data-testid="button-request-quote-mobile"
                  >
                    Request Quote
                  </Button>
                </Link>
              </div>
              
              {/* Trust badge - Mobile */}
              <div className="mt-6 inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <span className="text-yellow-400">★★★★★</span>
                <span className="font-medium">4.5 Rating</span>
              </div>
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
