import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Loader2, 
  Lock, 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Tag,
  Percent,
  Truck,
  DollarSign,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { DiscountCode } from "@shared/schema";

export default function AdminDiscountCodes() {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<DiscountCode | null>(null);

  const [formCode, setFormCode] = useState("");
  const [formType, setFormType] = useState<"free_shipping" | "fixed_amount" | "percentage">("percentage");
  const [formValue, setFormValue] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [formExpiresAt, setFormExpiresAt] = useState("");

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

  const isAdminAuthenticated = authStatus?.isAdmin || isLoggedIn;

  const { data: discountCodes, isLoading } = useQuery<DiscountCode[]>({
    queryKey: ['/api/admin/discount-codes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/discount-codes', { credentials: 'include' });
      if (!res.ok) throw new Error("Failed to fetch discount codes");
      return res.json();
    },
    enabled: isAdminAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/discount-codes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/discount-codes'] });
      setSuccessMessage("Discount code created successfully!");
      setTimeout(() => {
        setIsCreating(false);
        setSuccessMessage("");
        resetForm();
      }, 1500);
    },
    onError: (error: any) => {
      setLoginError(error.message || "Failed to create discount code");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return apiRequest('PUT', `/api/admin/discount-codes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/discount-codes'] });
      setSuccessMessage("Discount code updated successfully!");
      setTimeout(() => {
        setEditingCode(null);
        setSuccessMessage("");
        resetForm();
      }, 1500);
    },
    onError: (error: any) => {
      setLoginError(error.message || "Failed to update discount code");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/discount-codes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/discount-codes'] });
      setDeleteConfirm(null);
    },
  });

  const resetForm = () => {
    setFormCode("");
    setFormType("percentage");
    setFormValue("");
    setFormMaxUses("");
    setFormActive(true);
    setFormExpiresAt("");
    setLoginError("");
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreating(true);
  };

  const openEditDialog = (code: DiscountCode) => {
    setEditingCode(code);
    setFormCode(code.code);
    setFormType(code.type);
    setFormValue(code.value || "");
    setFormMaxUses(code.maxUses?.toString() || "");
    setFormActive(code.active);
    setFormExpiresAt(code.expiresAt ? new Date(code.expiresAt).toISOString().split('T')[0] : "");
    setLoginError("");
    setSuccessMessage("");
  };

  const handleSubmit = () => {
    setLoginError("");
    
    if (!formCode.trim()) {
      setLoginError("Code is required");
      return;
    }
    
    if ((formType === "fixed_amount" || formType === "percentage") && !formValue) {
      setLoginError("Value is required for this discount type");
      return;
    }

    if (formType === "percentage") {
      const pct = parseFloat(formValue);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        setLoginError("Percentage must be between 0 and 100");
        return;
      }
    }

    const data = {
      code: formCode.trim().toUpperCase(),
      type: formType,
      value: formType === "free_shipping" ? null : formValue,
      maxUses: formMaxUses ? parseInt(formMaxUses) : null,
      active: formActive,
      expiresAt: formExpiresAt || null,
    };

    if (editingCode) {
      updateMutation.mutate({ id: editingCode.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(password);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "free_shipping": return <Truck className="h-4 w-4" />;
      case "fixed_amount": return <DollarSign className="h-4 w-4" />;
      case "percentage": return <Percent className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string, value?: string | null) => {
    switch (type) {
      case "free_shipping": return "Free Shipping";
      case "fixed_amount": return `R${value} off`;
      case "percentage": return `${value}% off`;
      default: return type;
    }
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString('en-ZA');
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
              Enter the admin password to manage discount codes
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="outline" size="icon" data-testid="button-back-admin">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Discount Codes</h1>
            <p className="text-muted-foreground">Create and manage discount codes for your store</p>
          </div>
          <Button onClick={openCreateDialog} data-testid="button-create-code">
            <Plus className="mr-2 h-4 w-4" />
            Create Code
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : discountCodes && discountCodes.length > 0 ? (
          <div className="space-y-4">
            {discountCodes.map((code) => (
              <Card key={code.id} className={!code.active ? "opacity-60" : ""}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      {getTypeIcon(code.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-lg" data-testid={`text-code-${code.code}`}>
                          {code.code}
                        </span>
                        {!code.active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            Inactive
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>{getTypeLabel(code.type, code.value)}</span>
                        <span>|</span>
                        <span>
                          {code.maxUses 
                            ? `${code.usesCount}/${code.maxUses} uses` 
                            : `${code.usesCount} uses`}
                        </span>
                        <span>|</span>
                        <span>
                          Expires: {formatDate(code.expiresAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => openEditDialog(code)}
                      data-testid={`button-edit-${code.code}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setDeleteConfirm(code)}
                      data-testid={`button-delete-${code.code}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Tag className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Discount Codes Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first discount code to offer promotions to your customers.
              </p>
              <Button onClick={openCreateDialog} data-testid="button-create-first-code">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Code
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isCreating || !!editingCode} onOpenChange={(open) => {
          if (!open) {
            setIsCreating(false);
            setEditingCode(null);
            resetForm();
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCode ? "Edit Discount Code" : "Create Discount Code"}
              </DialogTitle>
            </DialogHeader>

            {successMessage ? (
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium">{successMessage}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    placeholder="e.g., SUMMER20"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                    data-testid="input-discount-code"
                  />
                  <p className="text-xs text-muted-foreground">
                    Customers will enter this code at checkout
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Discount Type</Label>
                  <Select value={formType} onValueChange={(v: any) => setFormType(v)}>
                    <SelectTrigger data-testid="select-discount-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Off</SelectItem>
                      <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                      <SelectItem value="free_shipping">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formType !== "free_shipping" && (
                  <div className="space-y-2">
                    <Label htmlFor="value">
                      {formType === "percentage" ? "Percentage" : "Amount (Rands)"}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      placeholder={formType === "percentage" ? "e.g., 20" : "e.g., 100"}
                      value={formValue}
                      onChange={(e) => setFormValue(e.target.value)}
                      data-testid="input-discount-value"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="maxUses">Usage Limit (optional)</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={formMaxUses}
                    onChange={(e) => setFormMaxUses(e.target.value)}
                    data-testid="input-max-uses"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expiration Date (optional)</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    data-testid="input-expires-at"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="active">Active</Label>
                  <Switch
                    id="active"
                    checked={formActive}
                    onCheckedChange={setFormActive}
                    data-testid="switch-active"
                  />
                </div>

                {loginError && (
                  <Alert variant="destructive">
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {!successMessage && (
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingCode(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-code"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingCode ? "Save Changes" : "Create Code"}
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Discount Code</DialogTitle>
            </DialogHeader>
            <p>
              Are you sure you want to delete the code <strong>{deleteConfirm?.code}</strong>? 
              This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
                disabled={deleteMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
