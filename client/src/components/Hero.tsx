import { Button } from "@/components/ui/button";
import { ShieldCheck, Truck, Wrench, Headset } from "lucide-react";
import { Link } from "wouter";
import heroBackgroundDesktop from "@assets/hero-background.png";
import heroBackgroundMobile from "@assets/hero-background-mobile.png";

export default function Hero() {
  const scrollToCategories = () => {
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Desktop Hero - md and up */}
      <div 
        className="hidden md:block relative min-h-[500px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackgroundDesktop})` }}
      >
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-8 lg:px-12 w-full">
            <div className="max-w-lg">
              <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-white mb-5 leading-tight">
                South Africa's Trusted{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                  Security Store
                </span>
              </h1>
              <p className="text-lg lg:text-xl text-slate-200 mb-8 leading-relaxed">
                Gate Motors, Remotes, Batteries, CCTV Systems & More. Delivered Nationwide with Expert Support.
              </p>
              
              <div className="flex items-start gap-4 mb-6">
                <Button 
                  size="lg" 
                  className="text-base font-semibold px-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-0 rounded-full"
                  onClick={scrollToCategories}
                  data-testid="button-shop-now"
                >
                  Shop Now
                </Button>
                <Link href="/quote">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-base font-semibold px-8 bg-black/20 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-black/30 hover:border-white/60 rounded-full"
                    data-testid="button-request-quote"
                  >
                    Request Quote
                  </Button>
                </Link>
              </div>
              
              <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <span className="text-yellow-400">★★★★★</span>
                <span className="font-medium">4.5 Google Rating</span>
                <span className="text-white/60">· 49 Reviews</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Hero - below md */}
      <div 
        className="md:hidden relative min-h-[400px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackgroundMobile})` }}
      >
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 w-full">
            <div className="max-w-lg">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-4 md:mb-5 leading-tight">
                South Africa's Trusted{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                  Security Store
                </span>
              </h1>
              <p className="text-base text-slate-200 mb-6 md:mb-8 leading-relaxed">
                Gate Motors, Remotes, Batteries, CCTV Systems & More. Delivered Nationwide with Expert Support.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 mb-6">
                <Button 
                  size="lg" 
                  className="text-base font-semibold px-6 md:px-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-0 rounded-full"
                  onClick={scrollToCategories}
                  data-testid="button-shop-now-mobile"
                >
                  Shop Now
                </Button>
                <Link href="/quote">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-base font-semibold px-6 md:px-8 bg-black/20 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-black/30 hover:border-white/60 rounded-full"
                    data-testid="button-request-quote-mobile"
                  >
                    Request Quote
                  </Button>
                </Link>
              </div>
              
              <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
                <span className="text-yellow-400">★★★★★</span>
                <span className="font-medium">4.5 Google Rating</span>
                <span className="text-white/60">· 49 Reviews</span>
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
