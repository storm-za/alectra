import { Award, Users, DollarSign, Headset } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function WhyChoose() {
  const reasons = [
    {
      icon: Award,
      title: "Quality Products",
      description: "Industry-leading products designed to provide long-lasting performance and exceptional value.",
    },
    {
      icon: Users,
      title: "Expert Support",
      description: "Our knowledgeable team is ready to assist you with tailored advice and troubleshooting.",
    },
    {
      icon: DollarSign,
      title: "Competitive Prices",
      description: "Best prices in South Africa with special trade pricing for installers and technicians.",
    },
    {
      icon: Headset,
      title: "Customer-Centric",
      description: "Your satisfaction is our priority. We deliver seamless service every step of the way.",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Why Choose Alectra Solutions
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            At Alectra Solutions, we prioritize delivering top-tier gate motors, automation systems, 
            and energy solutions. Known for exceptional quality and reliability, we stand out as a 
            trusted partner for residential and commercial automation needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {reasons.map((reason) => (
            <Card key={reason.title} className="hover-elevate">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <reason.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{reason.title}</h3>
                <p className="text-sm text-muted-foreground">{reason.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
