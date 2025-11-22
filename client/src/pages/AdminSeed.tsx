import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminSeed() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; categoriesCreated?: number; productsCreated?: number } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
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
              <strong>Important:</strong> This should only be run ONCE when you first publish your website.
              If your production database already has products, this will be skipped automatically.
            </AlertDescription>
          </Alert>

          <div className="flex flex-col gap-4">
            <Button
              onClick={handleSeed}
              disabled={loading || result?.success === true}
              size="lg"
              className="w-full"
              data-testid="button-seed-production"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {result?.success ? "Seeding Complete!" : "Seed Production Database"}
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
                    <div className="mt-2 text-sm">
                      <div>✅ Categories created: {result.categoriesCreated}</div>
                      <div>✅ Products created: {result.productsCreated}</div>
                      <div className="mt-2 font-medium">
                        Your published website now has all products! You can close this page.
                      </div>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {loading && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Seeding database... This may take 1-2 minutes.</p>
              <p className="mt-1">Please wait, do not refresh the page.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
