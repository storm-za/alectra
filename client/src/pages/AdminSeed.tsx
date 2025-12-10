import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle, AlertCircle, Trash2, Lock, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminSeed() {
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string; categoriesCreated?: number; productsCreated?: number; reviewsCreated?: number; blogPostsCreated?: number; alreadyComplete?: boolean } | null>(null);

  const { data: authStatus, isLoading: authLoading, refetch: refetchAuth } = useQuery<{ isAdmin: boolean }>({
    queryKey: ['/api/admin/check'],
    staleTime: 0
  });

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest('POST', '/api/admin/login', { password });
      return response.json();
    },
    onSuccess: () => {
      setLoginError("");
      setPassword("");
      refetchAuth();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/check'] });
    },
    onError: (error: any) => {
      setLoginError(error.message || "Invalid password");
    }
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(password);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!authStatus?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              Enter the admin password to access database tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-seed-password"
                />
              </div>
              
              {loginError && (
                <Alert variant="destructive">
                  <AlertDescription>{loginError}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loginMutation.isPending || !password}
                data-testid="button-seed-login"
              >
                {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleClear = async () => {
    if (!confirm("⚠️ WARNING: This will DELETE ALL products, categories, reviews, and orders from the production database!\n\nThis action cannot be undone. Are you sure?")) {
      return;
    }

    setClearing(true);
    setResult(null);

    try {
      const response = await fetch("/api/admin/clear-production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      setResult(data);
    } catch (error: any) {
      setResult({
        success: false,
        message: "Failed to clear database: " + error.message,
      });
    } finally {
      setClearing(false);
    }
  };

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
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" data-testid="link-back-admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
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
              disabled={loading || clearing}
              size="lg"
              className="w-full"
              data-testid="button-seed-production"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {result?.success && result?.alreadyComplete ? "Check Again for Missing Data" : result?.success ? "Seed Complete - Run Again to Check" : "Seed Production Database"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Troubleshooting
                </span>
              </div>
            </div>

            <Button
              onClick={handleClear}
              disabled={loading || clearing}
              size="lg"
              variant="destructive"
              className="w-full"
              data-testid="button-clear-production"
            >
              {clearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!clearing && <Trash2 className="mr-2 h-4 w-4" />}
              Clear Production Database
            </Button>

            <Alert variant="destructive" className="text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Danger Zone:</strong> The clear button will delete ALL data from production.
                Use this if products have wrong categories or images aren't loading. After clearing, click "Seed Production Database" above to repopulate with fresh data.
              </AlertDescription>
            </Alert>

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
