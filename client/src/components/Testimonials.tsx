import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Testimonials() {
  const testimonials = [
    {
      name: "Heino Boer",
      role: "Local Guide",
      rating: 5,
      comment: "I have been running around for material I need on a Saturday and Sunday. I Never knew about Alectra solutions. I just want to say thank you to Ruwan and the team for your outstanding service.",
    },
    {
      name: "DMI Engineering",
      role: "Business",
      rating: 5,
      comment: "Great shop with awesome service",
    },
    {
      name: "Fred du Plessis",
      role: "Customer",
      rating: 5,
      comment: "Everything you need for gas, security, gate control...",
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            What Our Customers Say
          </h2>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-lg font-semibold">4.5</span>
            <span className="text-muted-foreground">· 49 Google Reviews</span>
          </div>
          <p className="text-sm text-muted-foreground">Excellent!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="hover-elevate">
              <CardContent className="p-6">
                <div className="flex mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm mb-4 text-foreground">{testimonial.comment}</p>
                <div>
                  <div className="font-semibold text-sm">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-8">
          <a
            href="https://search.google.com/local/writereview?placeid=ChIJ1VsOb-hglR4RIcjzr2wNtxo"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Leave a review on Google →
          </a>
        </div>
      </div>
    </section>
  );
}
