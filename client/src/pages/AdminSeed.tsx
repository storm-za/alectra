import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminSeed() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; categoriesCreated?: number; productsCreated?: number; reviewsCreated?: number; blogPostsCreated?: number; alreadyComplete?: boolean } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Seed production (backend reads dev-database-export.json automatically)
      const response = await fetch("/api/admin/seed-production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        message: "Failed to connect to server: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Production Database Seeding</CardTitle>
          <CardDescription>
            One-time setup to populate your production database with all products and categories.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <strong>Smart Seeding:</strong> This will check what's missing and only add what you need.
              Safe to run multiple times - it will only seed missing products, reviews, categories, or blog posts.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-4">
            <Button
              onClick={handleSeed}
              disabled={loading}
              size="lg"
              className="w-full"
              data-testid="button-seed-production"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {result?.success && result?.alreadyComplete ? "Check Again for Missing Data" : result?.success ? "Seed Complete - Run Again to Check" : "Seed Production Database"}
            </Button>

            {result && (
              <Alert variant={result.success ? "default" : "destructive"}>
                {result.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="font-medium">{result.message}</div>
                  {result.success && result.categoriesCreated !== undefined && (
                    <div className="mt-2 text-sm space-y-1">
                      <div>✅ Categories created: {result.categoriesCreated}</div>
                      <div>✅ Products created: {result.productsCreated}</div>
                      <div>✅ Reviews created: {result.reviewsCreated}</div>
                      <div>✅ Blog posts created: {result.blogPostsCreated}</div>
                      <div className="mt-3 pt-3 border-t font-medium text-base">
                        🎉 Your published website is now identical to development!
                      </div>
                      <div className="text-muted-foreground">
                        All products, reviews, categories, and blog posts have been seeded. You can close this page.
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {loading && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Seeding database... This may take 2-3 minutes.</p>
              <p className="mt-1">Loading exact dev database export (272 products, 9 categories).</p>
              <p className="mt-1">Please wait, do not refresh the page.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
