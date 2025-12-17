import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, 
  Lock, 
  LogOut, 
  BarChart3, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Calendar,
  Database,
  Eye,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface VisitStats {
  totalVisits: number;
  uniqueSessions: number;
  topPages: { path: string; count: number }[];
}

interface OrdersSummary {
  totalOrders: number;
  todayOrders: number;
  paidOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayRevenue: number;
  recentOrders: any[];
}

interface DailyStats {
  date: string;
  totalVisits: number;
  uniqueSessions: number;
}

export default function Admin() {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const { data: authStatus, isLoading: authLoading, refetch: refetchAuth } = useQuery<{ isAdmin: boolean }>({
    queryKey: ['/api/admin/check'],
    staleTime: 0
  });

  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(data.message || `Too many attempts. Try again in ${data.retryAfter || 60} seconds.`);
        }
        throw new Error(data.message || 'Login failed');
      }
      return data;
    },
    onSuccess: () => {
      setLoginError("");
      setPassword("");
      setIsLoggedIn(true);
      refetchAuth();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/check'] });
    },
    onError: (error: any) => {
      setLoginError(error.message || "Invalid password");
    }
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/logout');
      return response.json();
    },
    onSuccess: () => {
      setIsLoggedIn(false);
      refetchAuth();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/check'] });
    }
  });

  // Determine if user is authenticated (either from API check or local state after login)
  const isAdminAuthenticated = authStatus?.isAdmin || isLoggedIn;

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<VisitStats>({
    queryKey: ['/api/admin/stats', selectedDate],
    queryFn: async () => {
      const response = await fetch(`/api/admin/stats?date=${selectedDate}`);
      if (response.status === 401) {
        // Session expired, trigger re-auth
        refetchAuth();
        throw new Error('Session expired');
      }
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    enabled: isAdminAuthenticated,
    retry: false
  });

  const { data: ordersSummary, isLoading: ordersLoading } = useQuery<OrdersSummary>({
    queryKey: ['/api/admin/orders-summary'],
    queryFn: async () => {
      const response = await fetch('/api/admin/orders-summary');
      if (response.status === 401) {
        refetchAuth();
        throw new Error('Session expired');
      }
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: isAdminAuthenticated,
    retry: false
  });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const endOfMonth = new Date();

  const { data: monthlyStats } = useQuery<DailyStats[]>({
    queryKey: ['/api/admin/stats/range', startOfMonth.toISOString(), endOfMonth.toISOString()],
    queryFn: async () => {
      const response = await fetch(`/api/admin/stats/range?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`);
      if (response.status === 401) {
        refetchAuth();
        throw new Error('Session expired');
      }
      if (!response.ok) throw new Error('Failed to fetch monthly stats');
      return response.json();
    },
    enabled: isAdminAuthenticated,
    retry: false
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

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>
              Enter the admin password to access the dashboard
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
                  data-testid="input-admin-password"
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
                data-testid="button-admin-login"
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const totalMonthlyVisits = monthlyStats?.reduce((sum, day) => sum + day.totalVisits, 0) || 0;
  const totalMonthlySessions = monthlyStats?.reduce((sum, day) => sum + day.uniqueSessions, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Monitor your store's performance and traffic</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-admin-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="traffic" data-testid="tab-traffic">
              <Eye className="mr-2 h-4 w-4" />
              Traffic
            </TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="tools" data-testid="tab-tools">
              <Database className="mr-2 h-4 w-4" />
              Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Visits</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalVisits || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.uniqueSessions || 0} unique sessions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Visits</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalMonthlyVisits}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalMonthlySessions} unique sessions
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ordersSummary?.todayOrders || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(ordersSummary?.todayRevenue || 0)} revenue
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(ordersSummary?.totalRevenue || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    {ordersSummary?.paidOrders || 0} paid orders
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Pages Today</CardTitle>
                  <CardDescription>Most visited pages</CardDescription>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : stats?.topPages && stats.topPages.length > 0 ? (
                    <div className="space-y-3">
                      {stats.topPages.map((page, index) => (
                        <div key={page.path} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground w-4">{index + 1}.</span>
                            <span className="text-sm font-medium truncate max-w-[200px]">{page.path}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{page.count} visits</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No page visits recorded yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : ordersSummary?.recentOrders && ordersSummary.recentOrders.length > 0 ? (
                    <div className="space-y-3">
                      {ordersSummary.recentOrders.slice(0, 5).map((order: any) => (
                        <div key={order.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{order.customerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatCurrency(parseFloat(order.total))}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              order.paymentStatus === 'paid' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                            }`}>
                              {order.paymentStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No orders yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Statistics</CardTitle>
                <CardDescription>View traffic for a specific date</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Label htmlFor="date">Select Date:</Label>
                  </div>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                    data-testid="input-date-picker"
                  />
                </div>

                {statsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold">{stats?.totalVisits || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Page Views</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold">{stats?.uniqueSessions || 0}</p>
                      <p className="text-sm text-muted-foreground">Unique Sessions</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-3xl font-bold">
                        {stats?.totalVisits && stats?.uniqueSessions 
                          ? (stats.totalVisits / stats.uniqueSessions).toFixed(1) 
                          : '0'}
                      </p>
                      <p className="text-sm text-muted-foreground">Pages per Session</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Traffic Trend</CardTitle>
                <CardDescription>Daily visits for the current month</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyStats && monthlyStats.length > 0 ? (
                  <div className="space-y-2">
                    {monthlyStats.map((day) => (
                      <div key={day.date} className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground w-24">
                          {new Date(day.date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                        </span>
                        <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all"
                            style={{ 
                              width: `${Math.min((day.totalVisits / Math.max(...monthlyStats.map(d => d.totalVisits), 1)) * 100, 100)}%` 
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-16 text-right">{day.totalVisits}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No traffic data for this month</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{ordersSummary?.totalOrders || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Paid Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{ordersSummary?.paidOrders || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{ordersSummary?.pendingOrders || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(ordersSummary?.totalRevenue || 0)}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>All Recent Orders</CardTitle>
                <CardDescription>Last 10 orders placed on the website</CardDescription>
              </CardHeader>
              <CardContent>
                {ordersSummary?.recentOrders && ordersSummary.recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 text-sm font-medium">Customer</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Email</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Date</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Total</th>
                          <th className="text-left py-3 px-2 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ordersSummary.recentOrders.map((order: any) => (
                          <tr key={order.id} className="border-b">
                            <td className="py-3 px-2 text-sm">{order.customerName}</td>
                            <td className="py-3 px-2 text-sm text-muted-foreground">{order.customerEmail}</td>
                            <td className="py-3 px-2 text-sm">
                              {new Date(order.createdAt).toLocaleDateString('en-ZA')}
                            </td>
                            <td className="py-3 px-2 text-sm font-medium">
                              {formatCurrency(parseFloat(order.total))}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                order.paymentStatus === 'paid' 
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                              }`}>
                                {order.paymentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No orders yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Tools</CardTitle>
                <CardDescription>Manage your production database</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    These tools are for managing the production database. Use with caution.
                  </AlertDescription>
                </Alert>
                
                <Link href="/admin/seed">
                  <Button className="w-full" data-testid="link-admin-seed">
                    <Database className="mr-2 h-4 w-4" />
                    Open Database Seeding Tool
                  </Button>
                </Link>
                
                <Link href="/admin/products">
                  <Button className="w-full" variant="outline" data-testid="link-admin-products">
                    <Eye className="mr-2 h-4 w-4" />
                    Edit Product Images
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
