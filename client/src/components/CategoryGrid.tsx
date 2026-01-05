import { Card } from "@/components/ui/card";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import type { Category } from "@shared/schema";

import electricFencingImg from "@assets/optimized/electric-fencing-category.webp";
import remotesImg from "@assets/optimized/remotes-category.webp";
import cctvImg from "@assets/optimized/cctv-category.webp";
import gateMotorsImg from "@assets/optimized/gate-motors-category.webp";
import lpGasImg from "@assets/optimized/lp-gas-category.webp";
import garageDoorsImg from "@assets/optimized/garage-door-parts-category.webp";
import batteriesImg from "@assets/optimized/batteries-category.webp";
import garageMotorsImg from "@assets/optimized/garage-motors-category.webp";
import intercomsImg from "@assets/optimized/intercoms-category.webp";

const optimizedCategoryImages: Record<string, string> = {
  'electric-fencing': electricFencingImg,
  'remotes': remotesImg,
  'cctv-cameras': cctvImg,
  'gate-motors': gateMotorsImg,
  'lp-gas-exchange': lpGasImg,
  'garage-door-parts': garageDoorsImg,
  'batteries': batteriesImg,
  'garage-motors': garageMotorsImg,
  'intercoms': intercomsImg,
};

interface CategoryGridProps {
  categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const getCategoryImage = (category: Category): string | null => {
    return optimizedCategoryImages[category.slug] || category.imageUrl;
  };
  return (
    <section id="categories" className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">
            Browse Categories
          </span>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our complete range of professional security and automation products
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map((category) => (
            <Link 
              key={category.id} 
              href={`/collections/${category.slug}`}
              data-testid={`link-category-${category.slug}`}
            >
              <Card className="group relative overflow-hidden aspect-square cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                {/* Background image - no dark overlay */}
                <div className="absolute inset-0">
                  {getCategoryImage(category) && (
                    <img 
                      src={getCategoryImage(category)!} 
                      alt={category.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                
                {/* Product count badge - top right */}
                <div className="absolute top-3 right-3 z-10">
                  <span className="inline-flex items-center px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                    {category.productCount} {category.productCount === 1 ? 'Product' : 'Products'}
                  </span>
                </div>
                
                {/* Modern frosted glass label at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="backdrop-blur-md bg-black/60 rounded-lg px-4 py-3 border border-white/10 shadow-xl">
                    <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-orange-400 transition-colors">
                      {category.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-white/90 group-hover:text-white transition-colors mt-1">
                      <span className="text-sm font-medium">Shop Now</span>
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
                
                {/* Orange accent line at top on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300 z-10"></div>
              </Card>
            </Link>
          ))}
        </div>
        
        {/* View all products link */}
        <div className="text-center mt-10">
          <Link href="/collections/all">
            <span className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all cursor-pointer">
              View All Products
              <ArrowRight className="h-5 w-5" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
