import { Button } from "@/components/ui/button";
import { ShieldCheck, Truck, Wrench, Headset } from "lucide-react";
import { Link } from "wouter";
import heroBackground from "@assets/hero-background.png";

export default function Hero() {
  const scrollToCategories = () => {
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Hero section with background image */}
      <div 
        className="relative min-h-[400px] md:min-h-[500px] bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        {/* Content overlay */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 w-full">
            <div className="max-w-lg">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 md:mb-5 leading-tight">
                South Africa's Trusted{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                  Security Store
                </span>
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-slate-200 mb-6 md:mb-8 leading-relaxed">
                Gate Motors, Remotes, Batteries, CCTV Systems & More. Delivered Nationwide with Expert Support.
              </p>
              
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <Button 
                  size="lg" 
                  className="text-base font-semibold px-6 md:px-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border-0 rounded-full"
                  onClick={scrollToCategories}
                  data-testid="button-shop-now"
                >
                  Shop Now
                </Button>
                <Link href="/quote">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-base font-semibold px-6 md:px-8 bg-black/20 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-black/30 hover:border-white/60 rounded-full"
                    data-testid="button-request-quote"
                  >
                    Request Quote
                  </Button>
                </Link>
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
