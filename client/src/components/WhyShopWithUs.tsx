import { ShieldCheck, Truck, Clock, CreditCard, Award, Headphones } from "lucide-react";

const trustBadges = [
  {
    icon: Award,
    title: "Authorized Distributor",
    description: "Official partner since 2012",
  },
  {
    icon: Clock,
    title: "Open 7 Days",
    description: "Mon-Sun 8:00 - 16:45",
  },
  {
    icon: Truck,
    title: "Nationwide Delivery",
    description: "Via The Courier Guy",
  },
  {
    icon: ShieldCheck,
    title: "Quality Guaranteed",
    description: "Genuine products only",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Card, EFT & Paystack",
  },
  {
    icon: Headphones,
    title: "Expert Support",
    description: "Technical assistance",
  },
];

export function WhyShopWithUs() {
  return (
    <section className="py-8 border-t" data-testid="section-why-shop">
      <h2 className="text-xl font-bold mb-6">Why Shop With Us</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {trustBadges.map((badge, index) => (
          <div
            key={index}
            className="flex flex-col items-center text-center p-4 rounded-lg bg-muted/50"
            data-testid={`trust-badge-${index}`}
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <badge.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-sm mb-1">{badge.title}</h3>
            <p className="text-xs text-muted-foreground">{badge.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
