import { Card } from "@/components/ui/card";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import type { Category } from "@shared/schema";

interface CategoryGridProps {
  categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
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
              href={`/category/${category.slug}`}
              data-testid={`link-category-${category.slug}`}
            >
              <Card className="group relative overflow-hidden h-56 md:h-64 cursor-pointer border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                {/* Background image */}
                <div className="absolute inset-0">
                  {category.imageUrl && (
                    <img 
                      src={category.imageUrl} 
                      alt={category.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                </div>
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-80 group-hover:opacity-70 transition-opacity"></div>
                
                {/* Orange accent line at top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                
                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-6">
                  {/* Product count badge */}
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center px-3 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                      {category.productCount} {category.productCount === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>
                  
                  <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors">
                    {category.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
                    <span className="text-sm font-medium">Shop Now</span>
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
        
        {/* View all products link */}
        <div className="text-center mt-10">
          <Link href="/products">
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
