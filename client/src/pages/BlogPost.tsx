import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/blog", slug],
    enabled: !!slug,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-64 mb-8" />
          <Skeleton className="h-96 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Blog Post Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The blog post you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/blog">
            <Button data-testid="button-back-to-blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${post.title} | Alectra Solutions Blog`}
        description={post.metaDescription}
        keywords={post.tags.join(", ")}
        canonical={`https://alectra.co.za/blog/${post.slug}`}
        image={post.imageUrl}
        type="article"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "Blog", href: "/blog" },
              { label: post.title, href: `/blog/${post.slug}` },
            ]}
          />

          <Link href="/blog">
            <Button variant="ghost" className="mt-4 mb-8" data-testid="button-back-to-blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          <article>
            <header className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" data-testid={`badge-tag-${tag}`}>
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight" data-testid="text-blog-title">
                {post.title}
              </h1>
              
              <div className="flex items-center gap-6 text-muted-foreground">
                <div className="flex items-center gap-2" data-testid="text-blog-author">
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center gap-2" data-testid="text-blog-date">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-2" data-testid="text-blog-readtime">
                  <Clock className="w-4 h-4" />
                  <span>{estimateReadTime(post.content)}</span>
                </div>
              </div>
            </header>

            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-auto"
                data-testid="img-blog-hero"
              />
            </div>

            <div 
              className="prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: post.content }}
              data-testid="text-blog-content"
            />

            {post.updatedAt && (
              <div className="mt-12 pt-8 border-t text-sm text-muted-foreground" data-testid="text-blog-updated">
                Last updated: {formatDate(post.updatedAt)}
              </div>
            )}
          </article>

          <div className="mt-12 pt-8 border-t">
            <Link href="/blog">
              <Button data-testid="button-back-to-blog-bottom">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Articles
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
