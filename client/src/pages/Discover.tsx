import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Tag, TrendingUp, Zap } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Discover() {
  return (
    <>
      <SEO 
        title="Discover | Alectra Solutions"
        description="Explore our latest products, deals, and trending security solutions."
      />
      
      <div className="min-h-screen bg-muted/30 pb-24">
        <div className="bg-background border-b sticky top-0 z-40">
          <div className="px-4 py-4 space-y-3">
            <h1 className="text-2xl font-bold tracking-tight">DISCOVER</h1>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, brands, categories..."
                className="pl-10 bg-muted/50"
                data-testid="input-discover-search"
              />
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-8">
          <section className="text-center py-12">
            <div className="max-w-md mx-auto space-y-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Coming Soon</h2>
                <p className="text-muted-foreground">
                  Discover new products, exclusive deals, and personalized recommendations tailored just for you.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <Card className="hover-elevate">
                  <Link href="/collections/all" data-testid="link-trending">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium text-sm" data-testid="text-trending">Trending</p>
                    </CardContent>
                  </Link>
                </Card>
                <Card className="hover-elevate">
                  <Link href="/collections/all" data-testid="link-deals">
                    <CardContent className="p-4 text-center">
                      <Tag className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium text-sm" data-testid="text-deals">Deals</p>
                    </CardContent>
                  </Link>
                </Card>
                <Card className="hover-elevate">
                  <Link href="/collections/all" data-testid="link-new-arrivals">
                    <CardContent className="p-4 text-center">
                      <Zap className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium text-sm" data-testid="text-new-arrivals">New Arrivals</p>
                    </CardContent>
                  </Link>
                </Card>
                <Card className="hover-elevate">
                  <Link href="/search" data-testid="link-search">
                    <CardContent className="p-4 text-center">
                      <Search className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium text-sm" data-testid="text-search">Search</p>
                    </CardContent>
                  </Link>
                </Card>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
