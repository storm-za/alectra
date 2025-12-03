import { useQuery } from "@tanstack/react-query";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import TrustedBrands from "@/components/TrustedBrands";
import WhyChoose from "@/components/WhyChoose";
import Testimonials from "@/components/Testimonials";
import TradeBanner from "@/components/TradeBanner";
import { SEO, createOrganizationStructuredData } from "@/components/SEO";
import { Truck, ShieldCheck, Headphones, Gift, Snowflake, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import type { Product, Category } from "@shared/schema";

interface HomeProps {
  onAddToCart: (product: Product) => void;
}

export default function Home({ onAddToCart }: HomeProps) {
  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const organizationData = createOrganizationStructuredData();

  return (
    <div>
      <SEO
        title="Alectra Solutions - Security & Automation Products South Africa"
        description="Leading South African supplier of security and automation products. Gate motors, electric fencing, CCTV systems, remotes, batteries, and more. Free delivery on orders over R2500."
        structuredData={organizationData}
      />
      <Hero />
      
      {/* Christmas Gift Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-red-700 via-red-600 to-green-700">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-8 animate-pulse">
            <Snowflake className="h-12 w-12 text-white" />
          </div>
          <div className="absolute top-8 right-16 animate-pulse delay-150">
            <Snowflake className="h-8 w-8 text-white" />
          </div>
          <div className="absolute bottom-4 left-1/4 animate-pulse delay-300">
            <Star className="h-10 w-10 text-yellow-300" />
          </div>
          <div className="absolute top-6 left-1/2 animate-pulse delay-100">
            <Star className="h-6 w-6 text-yellow-300" />
          </div>
          <div className="absolute bottom-6 right-1/3 animate-pulse delay-200">
            <Snowflake className="h-10 w-10 text-white" />
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12 md:py-16 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="bg-white/20 backdrop-blur-sm p-5 rounded-full">
                <Gift className="h-12 w-12 text-white" />
              </div>
              <div className="text-white">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
                  <span>Christmas Gift Service</span>
                  <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                </h2>
                <p className="text-lg text-white/90 max-w-lg">
                  Make it special! Choose the gift option at checkout and we'll wrap your order in festive Christmas packaging. 
                  <span className="block mt-1 text-white/80">
                    Delivery orders come gift-wrapped. Pickup orders include a beautiful gift bag!
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <Link href="/products">
                <Button 
                  size="lg" 
                  className="bg-white text-red-700 hover:bg-white/90 font-semibold px-8 py-6 text-lg shadow-lg"
                  data-testid="button-shop-gifts"
                >
                  <Gift className="h-5 w-5 mr-2" />
                  Shop Christmas Gifts
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Delivery Information Banner */}
      <section className="bg-card border-y">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Nationwide Delivery</h3>
                <p className="text-sm text-muted-foreground">We deliver to all areas across South Africa</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Free Shipping on R2500+</h3>
                <p className="text-sm text-muted-foreground">Enjoy free delivery on orders over R2500</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <Headphones className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Expert Support</h3>
                <p className="text-sm text-muted-foreground">Professional installation and technical assistance</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <CategoryGrid 
        categories={categoriesLoading ? [] : categories || []} 
      />

      <TrustedBrands />
      <WhyChoose />
      <TradeBanner />
      <Testimonials />
    </div>
  );
}
