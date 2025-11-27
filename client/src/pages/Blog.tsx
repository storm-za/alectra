import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function Blog() {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog"],
  });

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-ZA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  return (
    <>
      <SEO
        title="Security & Automation Blog | Expert Tips & Guides"
        description="Expert advice on security systems, gate motors, electric fencing, CCTV, and automation for South African homes and businesses. Installation tips, buying guides, and load-shedding solutions."
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Blog", href: "/blogs" },
            ]}
          />

          <div className="mt-8 mb-12">
            <h1 className="text-4xl font-bold mb-4">Security & Automation Blog</h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Expert tips, buying guides, and installation advice for security systems, gate motors, electric fencing, CCTV, and automation solutions in South Africa.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Link key={post.id} href={`/blogs/${post.slug}`} data-testid={`link-blog-${post.slug}`}>
                  <Card className="h-full overflow-hidden hover-elevate active-elevate-2 cursor-pointer">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        data-testid={`img-blog-${post.slug}`}
                      />
                    </div>
                    <CardHeader>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" data-testid={`badge-tag-${tag}`}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <CardTitle className="line-clamp-2" data-testid={`text-blog-title-${post.slug}`}>
                        {post.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2" data-testid={`text-blog-excerpt-${post.slug}`}>
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1" data-testid={`text-blog-date-${post.slug}`}>
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(post.publishedAt)}</span>
                        </div>
                        <div className="flex items-center gap-1" data-testid={`text-blog-readtime-${post.slug}`}>
                          <Clock className="w-4 h-4" />
                          <span>{estimateReadTime(post.content)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-lg text-muted-foreground">No blog posts available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
