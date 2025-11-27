import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";
import { Link } from "wouter";

export default function TradeBanner() {
  return (
    <section className="py-16 md:py-24 bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
            <Briefcase className="h-8 w-8" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Installer & Trade Program
          </h2>
          <p className="text-lg text-primary-foreground/90 mb-8">
            Join our exclusive trade program for special pricing on bulk orders. 
            Trusted by installers, electricians, and security professionals nationwide.
          </p>
          <Link href="/pages/trade-wholesale-registration">
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              data-testid="button-apply-trade-pricing"
            >
              Apply for Trade Pricing
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
