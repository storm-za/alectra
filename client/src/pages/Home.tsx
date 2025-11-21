import { useQuery } from "@tanstack/react-query";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import TrustedBrands from "@/components/TrustedBrands";
import WhyChoose from "@/components/WhyChoose";
import Testimonials from "@/components/Testimonials";
import TradeBanner from "@/components/TradeBanner";
import { SEO, createOrganizationStructuredData } from "@/components/SEO";
import { Truck, ShieldCheck, Headphones } from "lucide-react";
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
