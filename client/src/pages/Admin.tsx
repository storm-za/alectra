import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
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
  TrendingUp,
  Tag,
  Mail,
  Truck,
  Phone,
  MapPin,
  ExternalLink,
  Package,
  Check,
  X,
  Building2,
  Star,
  MessageSquare,
  Trash2,
  Edit
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

interface OrderItem {
  id: string;
  productId: string;
  productName: string | null;
  productImage: string | null;
  quantity: number;
  priceAtPurchase: string;
  lineSubtotal: string;
}

interface FullOrder {
  id: string;
  userId: string | null;
  deliveryMethod: string;
  pickupStore: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string | null;
  deliveryCity: string | null;
  deliveryProvince: string | null;
  deliveryPostalCode: string | null;
  locationLatitude: string | null;
  locationLongitude: string | null;
  subtotal: string;
  total: string;
  status: string;
  paymentStatus: string;
  trackingLink: string | null;
  createdAt: string;
  items: OrderItem[];
}

export default function Admin() {
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

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

  const { data: fullOrders, isLoading: fullOrdersLoading, refetch: refetchFullOrders } = useQuery<FullOrder[]>({
    queryKey: ['/api/admin/orders-full'],
    queryFn: async () => {
      const response = await fetch('/api/admin/orders-full');
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

  const updateTrackingMutation = useMutation({
    mutationFn: async ({ orderId, trackingLink }: { orderId: string; trackingLink: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/orders/${orderId}/tracking`, { trackingLink });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update tracking');
      }
      return response.json();
    },
    onSuccess: () => {
      refetchFullOrders();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders-summary'] });
    }
  });

  const sendPickupEmailMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('POST', `/api/admin/orders/${orderId}/pickup-email`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send pickup email');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email Sent",
        description: "Pickup ready notification sent to customer",
      });
      refetchFullOrders();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/orders-summary'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send pickup email",
        variant: "destructive",
      });
    }
  });

  const sendReviewRequestMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('POST', `/api/admin/orders/${orderId}/review-request`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send review request email');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Request Sent",
        description: "Email asking for a review has been sent to the customer",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send",
        description: error.message || "Failed to send review request email",
        variant: "destructive",
      });
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
            <TabsTrigger value="tracking" data-testid="tab-tracking">
              <Mail className="mr-2 h-4 w-4" />
              Email & Tracking
            </TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews">
              <Star className="mr-2 h-4 w-4" />
              Reviews
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
                <CardTitle>Daily Traffic Trend</CardTitle>
                <CardDescription>Page visits for the current month</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyStats && monthlyStats.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={monthlyStats.map(day => ({
                          ...day,
                          displayDate: new Date(day.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })
                        }))}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="displayDate" 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          className="fill-muted-foreground"
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          className="fill-muted-foreground"
                          allowDecimals={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                          formatter={(value: number) => [`${value} visits`, 'Total Visits']}
                        />
                        <Area
                          type="monotone"
                          dataKey="totalVisits"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorVisits)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
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
                
                <Link href="/admin/discount-codes">
                  <Button className="w-full" variant="outline" data-testid="link-admin-discount-codes">
                    <Tag className="mr-2 h-4 w-4" />
                    Manage Discount Codes
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email & Tracking Management
                </CardTitle>
                <CardDescription>
                  View all customer orders, add tracking links, and access customer information for follow-ups
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fullOrdersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : fullOrders && fullOrders.length > 0 ? (
                  <div className="space-y-4">
                    {fullOrders.map((order) => (
                      <div 
                        key={order.id} 
                        className="border rounded-lg overflow-hidden"
                        data-testid={`admin-order-${order.id}`}
                      >
                        {/* Order Header - Always Visible */}
                        <div 
                          className="p-4 cursor-pointer hover-elevate"
                          onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">{order.customerName}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  order.paymentStatus === 'paid' 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                }`}>
                                  {order.paymentStatus}
                                </span>
                                {order.trackingLink && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                    Shipped
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {order.customerEmail}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {order.customerPhone}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(parseFloat(order.total))}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.createdAt).toLocaleDateString('en-ZA', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {expandedOrder === order.id && (
                          <div className="border-t bg-muted/30 p-4 space-y-4">
                            {/* Products */}
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Products Ordered
                              </h4>
                              <div className="space-y-2">
                                {order.items.map((item) => {
                                  const imageUrl = item.productImage?.startsWith('/') 
                                    ? item.productImage 
                                    : item.productImage ? `/${item.productImage}` : null;
                                  return (
                                    <div key={item.id} className="flex items-center gap-3 bg-background rounded-lg p-2">
                                      {imageUrl && (
                                        <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                          <img 
                                            src={imageUrl} 
                                            alt={item.productName || 'Product'} 
                                            className="h-full w-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm line-clamp-1">{item.productName || 'Unknown Product'}</p>
                                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                                          Qty: {item.quantity} ×&nbsp;R&nbsp;{item.priceAtPurchase}
                                        </p>
                                      </div>
                                      <p className="text-sm font-medium whitespace-nowrap">R&nbsp;{item.lineSubtotal}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Delivery Address or Pickup Store */}
                            {order.deliveryMethod === 'delivery' && order.deliveryAddress && (
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <MapPin className="h-4 w-4" />
                                  Delivery Address
                                </h4>
                                <div className="bg-background rounded-lg p-3 text-sm">
                                  <p>{order.deliveryAddress}</p>
                                  <p>{order.deliveryCity}, {order.deliveryProvince}</p>
                                  <p>{order.deliveryPostalCode}</p>
                                  {order.locationLatitude && order.locationLongitude && (
                                    <a 
                                      href={`https://www.google.com/maps?q=${order.locationLatitude},${order.locationLongitude}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline text-xs mt-2 inline-flex items-center gap-1"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                      View on Google Maps
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Pickup Store Location */}
                            {order.deliveryMethod === 'pickup' && (
                              <div>
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  Pickup Location
                                </h4>
                                <div className="bg-background rounded-lg p-3 text-sm">
                                  {order.pickupStore === 'wonderboom' ? (
                                    <>
                                      <p className="font-medium">Wonderboom Store</p>
                                      <p className="text-muted-foreground">107A Dassiebos Ave, Wonderboom, Pretoria, 0182</p>
                                      <a 
                                        href="https://maps.google.com/?q=107A+Dassiebos+Ave+Wonderboom+Pretoria"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline text-xs mt-2 inline-flex items-center gap-1"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        View on Google Maps
                                      </a>
                                    </>
                                  ) : order.pickupStore === 'hatfield' ? (
                                    <>
                                      <p className="font-medium">Hatfield Store</p>
                                      <p className="text-muted-foreground">1234 Burnett St, Hatfield, Pretoria, 0083</p>
                                      <a 
                                        href="https://maps.google.com/?q=1234+Burnett+St+Hatfield+Pretoria"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:underline text-xs mt-2 inline-flex items-center gap-1"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        View on Google Maps
                                      </a>
                                    </>
                                  ) : (
                                    <p className="text-muted-foreground italic">Pickup store not specified</p>
                                  )}
                                </div>
                                
                                {/* Send Pickup Email Button */}
                                <div className="mt-3">
                                  <Button
                                    onClick={() => sendPickupEmailMutation.mutate(order.id)}
                                    disabled={sendPickupEmailMutation.isPending || order.status === 'ready_for_pickup'}
                                    variant={order.status === 'ready_for_pickup' ? 'outline' : 'default'}
                                    data-testid={`button-send-pickup-email-${order.id}`}
                                  >
                                    {sendPickupEmailMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                      <Mail className="h-4 w-4 mr-2" />
                                    )}
                                    {order.status === 'ready_for_pickup' ? 'Pickup Email Sent' : 'Send Pickup Email'}
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {order.status === 'ready_for_pickup' 
                                      ? 'Customer has been notified that their order is ready'
                                      : 'Notify customer that their order is ready for pickup'
                                    }
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Tracking Link Section */}
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2">
                                <Truck className="h-4 w-4" />
                                Tracking Link
                              </h4>
                              {order.trackingLink ? (
                                <div className="flex items-center gap-2 bg-background rounded-lg p-3">
                                  <Check className="h-4 w-4 text-green-600" />
                                  <a 
                                    href={order.trackingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline text-sm flex items-center gap-1"
                                    data-testid={`tracking-link-${order.id}`}
                                  >
                                    {order.trackingLink}
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Enter tracking URL (e.g., https://thecourierguy.co.za/track/...)"
                                    value={trackingInputs[order.id] || ''}
                                    onChange={(e) => setTrackingInputs(prev => ({
                                      ...prev,
                                      [order.id]: e.target.value
                                    }))}
                                    className="flex-1"
                                    data-testid={`input-tracking-${order.id}`}
                                  />
                                  <Button
                                    onClick={() => {
                                      const link = trackingInputs[order.id];
                                      if (link) {
                                        updateTrackingMutation.mutate({ orderId: order.id, trackingLink: link });
                                        setTrackingInputs(prev => {
                                          const newInputs = { ...prev };
                                          delete newInputs[order.id];
                                          return newInputs;
                                        });
                                      }
                                    }}
                                    disabled={!trackingInputs[order.id] || updateTrackingMutation.isPending}
                                    data-testid={`button-add-tracking-${order.id}`}
                                  >
                                    {updateTrackingMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <>
                                        <Truck className="h-4 w-4 mr-2" />
                                        Add Tracking
                                      </>
                                    )}
                                  </Button>
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                Adding a tracking link will automatically update the order status to "Shipped"
                              </p>
                            </div>

                            {/* Customer Contact Quick Actions */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t">
                              <a 
                                href={`mailto:${order.customerEmail}`}
                                className="inline-flex"
                              >
                                <Button variant="outline" size="sm" data-testid={`button-email-${order.id}`}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Email Customer
                                </Button>
                              </a>
                              <a 
                                href={`tel:${order.customerPhone}`}
                                className="inline-flex"
                              >
                                <Button variant="outline" size="sm" data-testid={`button-call-${order.id}`}>
                                  <Phone className="h-4 w-4 mr-2" />
                                  Call Customer
                                </Button>
                              </a>
                              <a 
                                href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex"
                              >
                                <Button variant="outline" size="sm" data-testid={`button-whatsapp-${order.id}`}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  WhatsApp
                                </Button>
                              </a>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => sendReviewRequestMutation.mutate(order.id)}
                                disabled={sendReviewRequestMutation.isPending}
                                data-testid={`button-review-request-${order.id}`}
                              >
                                {sendReviewRequestMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Star className="h-4 w-4 mr-2" />
                                )}
                                Request Review
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No orders yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <ReviewsManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Reviews Management Component
interface Review {
  id: string;
  productId: string;
  rating: number;
  comment: string | null;
  authorName: string;
  status: string;
  createdAt: string;
  productName: string | null;
}

function ReviewsManagement() {
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(5);

  const { data: reviews, isLoading, refetch } = useQuery<Review[]>({
    queryKey: ['/api/admin/reviews'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/reviews/${id}/status`, { status });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update status", variant: "destructive" });
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: async ({ id, comment, rating }: { id: string; comment: string; rating: number }) => {
      const response = await apiRequest('PATCH', `/api/admin/reviews/${id}`, { comment, rating });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update review');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      setEditingReview(null);
      toast({ title: "Review updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update review", variant: "destructive" });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest('DELETE', `/api/admin/reviews/${id}`, {});
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete review');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/reviews'] });
      toast({ title: "Review deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete review", variant: "destructive" });
    },
  });

  const filteredReviews = reviews?.filter(review => 
    filterStatus === "all" ? true : review.status === filterStatus
  ) || [];

  const pendingCount = reviews?.filter(r => r.status === 'pending').length || 0;
  const approvedCount = reviews?.filter(r => r.status === 'approved').length || 0;
  const rejectedCount = reviews?.filter(r => r.status === 'rejected').length || 0;

  const openEditDialog = (review: Review) => {
    setEditingReview(review);
    setEditComment(review.comment || "");
    setEditRating(review.rating);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <MessageSquare className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Visible to customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Not shown</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reviews?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Review Moderation
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                variant={filterStatus === "all" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterStatus("all")}
              >
                All
              </Button>
              <Button 
                variant={filterStatus === "pending" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterStatus("pending")}
              >
                Pending ({pendingCount})
              </Button>
              <Button 
                variant={filterStatus === "approved" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterStatus("approved")}
              >
                Approved
              </Button>
              <Button 
                variant={filterStatus === "rejected" ? "default" : "outline"} 
                size="sm"
                onClick={() => setFilterStatus("rejected")}
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredReviews.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No reviews found</p>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div 
                  key={review.id} 
                  className={`border rounded-lg p-4 ${
                    review.status === 'pending' ? 'border-yellow-500/50 bg-yellow-500/5' :
                    review.status === 'rejected' ? 'border-red-500/50 bg-red-500/5' :
                    'border-green-500/50 bg-green-500/5'
                  }`}
                  data-testid={`review-${review.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold">{review.authorName}</span>
                        <span className="text-muted-foreground">•</span>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          review.status === 'pending' ? 'bg-yellow-500/20 text-yellow-600' :
                          review.status === 'rejected' ? 'bg-red-500/20 text-red-600' :
                          'bg-green-500/20 text-green-600'
                        }`}>
                          {review.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Product: <span className="font-medium text-foreground">{review.productName || 'Unknown'}</span>
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{review.comment || "(No comment)"}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(review.createdAt).toLocaleDateString('en-ZA', { 
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {review.status === 'pending' && (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => updateStatusMutation.mutate({ id: review.id, status: 'approved' })}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-approve-${review.id}`}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => updateStatusMutation.mutate({ id: review.id, status: 'rejected' })}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-reject-${review.id}`}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {review.status === 'approved' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: review.id, status: 'rejected' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Reject
                        </Button>
                      )}
                      {review.status === 'rejected' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: review.id, status: 'approved' })}
                          disabled={updateStatusMutation.isPending}
                        >
                          Approve
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openEditDialog(review)}
                        data-testid={`button-edit-${review.id}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this review?")) {
                            deleteReviewMutation.mutate(review.id);
                          }
                        }}
                        disabled={deleteReviewMutation.isPending}
                        data-testid={`button-delete-${review.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Review Dialog */}
      {editingReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setEditingReview(null)}>
          <div className="bg-background rounded-lg p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Edit Review</h3>
            <div className="space-y-4">
              <div>
                <Label>Rating</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEditRating(star)}
                      className="focus:outline-none"
                    >
                      <Star 
                        className={`h-8 w-8 cursor-pointer ${star <= editRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 hover:text-yellow-200'}`} 
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Comment</Label>
                <textarea
                  className="w-full mt-2 p-3 border rounded-md min-h-[100px] bg-background"
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  placeholder="Review comment..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setEditingReview(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => updateReviewMutation.mutate({ 
                    id: editingReview.id, 
                    comment: editComment, 
                    rating: editRating 
                  })}
                  disabled={updateReviewMutation.isPending}
                >
                  {updateReviewMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
