import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import { SEO } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";
import { marked } from "marked";
import { useMemo } from "react";

marked.setOptions({ breaks: true, gfm: true });

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function estimateReadTime(content: string) {
  const minutes = Math.ceil(content.split(/\s+/).length / 200);
  return `${minutes} min read`;
}

export default function GasBlogPost() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: [`/api/blog/${encodeURIComponent(slug)}`],
    enabled: !!slug,
  });

  const parsedContent = useMemo(() => {
    if (!post?.content) return "";
    return marked.parse(post.content) as string;
  }, [post?.content]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-64 mb-8" />
          <Skeleton className="h-72 w-full mb-8" />
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-4 w-full mb-3" />
          ))}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The article you are looking for does not exist or has been removed.
          </p>
          <Link href="/category/lp-gas-exchange">
            <Button data-testid="button-back-to-gas">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to LP Gas
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${post.title} | Alectra Solutions`}
        description={post.metaDescription}
        image={post.imageUrl}
        type="article"
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Breadcrumb
            items={[
              { label: "Home", href: "/" },
              { label: "LP Gas", href: "/category/lp-gas-exchange" },
              { label: post.title, href: `/blogs/gas/${post.slug}` },
            ]}
          />

          <Link href="/category/lp-gas-exchange">
            <Button variant="ghost" className="mt-4 mb-8" data-testid="button-back-to-gas">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to LP Gas
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

              <h1
                className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
                data-testid="text-blog-title"
              >
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 md:gap-6 text-muted-foreground text-sm">
                <span data-testid="text-blog-author">{post.author}</span>
                <div className="flex items-center gap-1.5" data-testid="text-blog-date">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(post.publishedAt)}</span>
                </div>
                <div className="flex items-center gap-1.5" data-testid="text-blog-readtime">
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
              className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-bold prose-headings:text-foreground prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-li:text-muted-foreground prose-table:border prose-th:bg-muted prose-th:p-3 prose-td:p-3 prose-td:border prose-a:text-primary prose-a:no-underline hover:prose-a:underline"
              dangerouslySetInnerHTML={{ __html: parsedContent }}
              data-testid="text-blog-content"
            />

            {post.updatedAt && (
              <div
                className="mt-12 pt-8 border-t text-sm text-muted-foreground"
                data-testid="text-blog-updated"
              >
                Last updated: {formatDate(post.updatedAt)}
              </div>
            )}
          </article>

          <div className="mt-12 pt-8 border-t">
            <Link href="/category/lp-gas-exchange">
              <Button data-testid="button-back-to-gas-bottom">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to LP Gas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
