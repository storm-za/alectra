import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, ArrowRight, Flame } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function GasArticlesCarousel() {
  const { data: articles, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog", { tag: "gas" }],
    queryFn: async () => {
      const res = await fetch("/api/blog?tag=gas");
      if (!res.ok) throw new Error("Failed to fetch gas articles");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!articles || articles.length === 0) return null;

  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          <h3 className="text-xl font-bold">LP Gas Guides & News</h3>
        </div>
        <Link href="/blogs">
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" data-testid="link-all-gas-articles">
            View all articles
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      <Carousel
        opts={{ align: "start", loop: false }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {articles.map((article) => (
            <CarouselItem
              key={article.id}
              className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
              data-testid={`card-gas-article-${article.id}`}
            >
              <Link href={`/blogs/gas/${article.slug}`}>
                <Card className="h-full hover-elevate cursor-pointer overflow-hidden">
                  <div className="aspect-[16/9] overflow-hidden bg-muted">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <CardContent className="p-4 flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {article.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <h4
                      className="font-semibold text-sm leading-snug line-clamp-2 text-foreground"
                      data-testid={`text-article-title-${article.id}`}
                    >
                      {article.title}
                    </h4>
                    <p
                      className="text-xs text-muted-foreground line-clamp-2 leading-relaxed"
                      data-testid={`text-article-excerpt-${article.id}`}
                    >
                      {article.excerpt}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto pt-2">
                      <Calendar className="h-3 w-3 flex-shrink-0" />
                      <span data-testid={`text-article-date-${article.id}`}>
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        {articles.length > 2 && (
          <>
            <CarouselPrevious className="-left-4" />
            <CarouselNext className="-right-4" />
          </>
        )}
      </Carousel>
    </div>
  );
}
