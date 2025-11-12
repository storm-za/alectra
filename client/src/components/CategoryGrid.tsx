import { Card } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { Category } from "@shared/schema";

interface CategoryGridProps {
  categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section id="categories" className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our complete range of security and automation products
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link key={category.id} href={`/category/${category.slug}`}>
              <a data-testid={`link-category-${category.slug}`}>
                <Card className="group relative overflow-hidden hover-elevate active-elevate-2 h-48 cursor-pointer border">
                  {/* Category image background with gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-900/80 to-slate-900/90">
                    {category.imageUrl && (
                      <img 
                        src={category.imageUrl} 
                        alt={category.name}
                        className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                      />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-end p-6">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {category.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white/80">
                        {category.productCount} {category.productCount === 1 ? 'Product' : 'Products'}
                      </p>
                      <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
