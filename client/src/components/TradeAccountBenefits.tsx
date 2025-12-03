import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BadgePercent, Users, Zap } from "lucide-react";

const benefits = [
  {
    icon: BadgePercent,
    text: "Discount on all products",
  },
  {
    icon: Zap,
    text: "Priority order processing",
  },
  {
    icon: Users,
    text: "Dedicated trade support",
  },
];

export function TradeAccountBenefits() {
  return (
    <section 
      className="py-8 border-t" 
      data-testid="section-trade-benefits"
    >
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BadgePercent className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-bold">Trade Account Benefits</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Are you a professional installer or electrician? Register for a trade account and enjoy exclusive benefits.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {benefits.map((benefit, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2"
                  data-testid={`trade-benefit-${index}`}
                >
                  <benefit.icon className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 md:flex-col lg:flex-row">
            <Link href="/pages/trade-wholesale-registration">
              <Button size="lg" data-testid="button-register-trade">
                Register Trade Account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" data-testid="button-login-trade">
                Already Registered? Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
