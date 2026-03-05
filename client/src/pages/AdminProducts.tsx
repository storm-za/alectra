import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, Image, Plus, Trash2, ArrowLeft, CheckCircle, Save, Upload, Lock, FileText, FolderMinus, Package, Edit3, PlusCircle, Link2, X, ChevronUp, ChevronDown } from "lucide-react";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Product, Category, ProductVariant } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";

const getImageUrl = (url: string) => {
  if (!url) return 'https://via.placeholder.com/64?text=No+Image';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? url : `/${url}`;
};

export default function AdminProducts() {
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryImage, setNewGalleryImage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [stockLevel, setStockLevel] = useState<number>(0);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [storeCode, setStoreCode] = useState("");
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductDescription, setNewProductDescription] = useState("");
  const [newProductBrand, setNewProductBrand] = useState("");
  const [newProductCategoryId, setNewProductCategoryId] = useState<string | null>(null);
  const [newProductImageUrl, setNewProductImageUrl] = useState("");
  const [newProductStock, setNewProductStock] = useState("10");
  
  const [fbtSearch, setFbtSearch] = useState("");
  const [selectedFbtProducts, setSelectedFbtProducts] = useState<Product[]>([]);
  
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");
  const [newVariantSku, setNewVariantSku] = useState("");
  const [newVariantStock, setNewVariantStock] = useState("0");
  const [newVariantImage, setNewVariantImage] = useState("");
  const [newVariantGroupLabel, setNewVariantGroupLabel] = useState("");
  const [newVariantDescription, setNewVariantDescription] = useState("");
  const [showAddVariantForm, setShowAddVariantForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [selectedVariantForImage, setSelectedVariantForImage] = useState<string>("");
  const [variantImageUrl, setVariantImageUrl] = useState<string>("");

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

  const { data: allProducts, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
    queryFn: async () => {
      const res = await fetch('/api/admin/products');
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    staleTime: 60000,
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const products = useMemo(() => {
    if (!allProducts) return [];
    if (!search.trim()) return allProducts.slice(0, 50);
    const searchLower = search.toLowerCase();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(searchLower) ||
      p.slug.toLowerCase().includes(searchLower) ||
      p.sku.toLowerCase().includes(searchLower)
    ).slice(0, 50);
  }, [allProducts, search]);

  const updateMutation = useMutation({
    mutationFn: async ({ slug, imageUrl, images }: { slug: string; imageUrl: string; images: string[] }) => {
      return apiRequest('PATCH', `/api/admin/products/${slug}/images`, { imageUrl, images });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setSuccessMessage("Product images updated successfully!");
      setTimeout(() => {
        setEditingProduct(null);
        setSuccessMessage("");
      }, 1500);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ slug, categoryId }: { slug: string; categoryId: string | null }) => {
      return apiRequest('PATCH', `/api/admin/products/${slug}/category`, { categoryId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setSuccessMessage("Product category updated successfully!");
      setTimeout(() => {
        setEditingProduct(null);
        setSuccessMessage("");
      }, 1500);
    },
  });

  const updateDescriptionMutation = useMutation({
    mutationFn: async ({ slug, description }: { slug: string; description: string }) => {
      return apiRequest('PATCH', `/api/admin/products/${slug}/description`, { description });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      setSuccessMessage("Product description updated successfully!");
      setTimeout(() => {
        setEditingProduct(null);
        setSuccessMessage("");
      }, 1500);
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: async ({ slug, stock }: { slug: string; stock: number }) => {
      return apiRequest('PATCH', `/api/admin/products/${slug}/stock`, { stock });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setSuccessMessage("Product stock updated successfully!");
      setTimeout(() => {
        setEditingProduct(null);
        setSuccessMessage("");
      }, 1500);
    },
  });

  const updateNameMutation = useMutation({
    mutationFn: async ({ slug, name }: { slug: string; name: string }) => {
      return apiRequest('PATCH', `/api/admin/products/${slug}/name`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setSuccessMessage("Product name updated successfully!");
      setTimeout(() => {
        setEditingProduct(null);
        setSuccessMessage("");
      }, 1500);
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: async ({ slug, price }: { slug: string; price: string }) => {
      return apiRequest('PATCH', `/api/admin/products/${slug}/price`, { price });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setSuccessMessage("Product price updated successfully!");
      setTimeout(() => {
        setEditingProduct(null);
        setSuccessMessage("");
      }, 1500);
    },
  });

  const updateStoreCodeMutation = useMutation({
    mutationFn: async ({ slug, storeCode }: { slug: string; storeCode: string }) => {
      return apiRequest('PATCH', `/api/admin/products/${slug}/store-code`, { storeCode });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setSuccessMessage("Store code updated successfully!");
      setTimeout(() => {
        setSuccessMessage("");
      }, 1500);
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      price: string;
      description: string;
      brand: string;
      categoryId: string | null;
      imageUrl: string;
      stock: number;
    }) => {
      return apiRequest('POST', '/api/admin/products', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      setSuccessMessage("Product created successfully!");
      setCreateDialogOpen(false);
      resetCreateForm();
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    },
  });

  const updateFbtMutation = useMutation({
    mutationFn: async ({ productId, relatedProductIds }: { productId: string; relatedProductIds: string[] }) => {
      return apiRequest('POST', `/api/admin/products/${productId}/fbt`, { relatedProductIds });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/products', variables.productId, 'fbt'] });
      setSuccessMessage("Frequently Bought Together updated successfully!");
      setTimeout(() => {
        setSuccessMessage("");
      }, 2000);
    },
  });

  const createVariantMutation = useMutation({
    mutationFn: async ({ productId, name, price, sku, stock, image, sortOrder, groupLabel, description }: { productId: string; name: string; price: string; sku: string; stock: number; image?: string; sortOrder: number; groupLabel?: string; description?: string }) => {
      const response = await apiRequest('POST', `/api/admin/products/${productId}/variants`, { name, price: parseFloat(price), sku: sku || null, stock, image: image || null, sortOrder, groupLabel: groupLabel || null, description: description || null });
      return response.json();
    },
    onSuccess: (newVariant) => {
      setVariants([...variants, newVariant]);
      setNewVariantName("");
      setNewVariantPrice("");
      setNewVariantSku("");
      setNewVariantStock("0");
      setNewVariantImage("");
      setNewVariantGroupLabel("");
      setNewVariantDescription("");
      setShowAddVariantForm(false);
      setSuccessMessage("Variant created successfully!");
      setTimeout(() => setSuccessMessage(""), 2000);
    },
  });

  const updateVariantMutation = useMutation({
    mutationFn: async ({ id, name, price, sku, stock, image, groupLabel, description }: { id: string; name: string; price: string; sku: string; stock: number; image?: string; groupLabel?: string; description?: string }) => {
      const response = await apiRequest('PUT', `/api/admin/variants/${id}`, { name, price: parseFloat(price), sku: sku || null, stock, ...(image !== undefined ? { image } : {}), groupLabel: groupLabel || null, description: description || null });
      return response.json();
    },
    onSuccess: (updatedVariant) => {
      setVariants(variants.map(v => v.id === updatedVariant.id ? updatedVariant : v));
      setEditingVariant(null);
      setSuccessMessage("Variant updated successfully!");
      setTimeout(() => setSuccessMessage(""), 2000);
    },
  });

  const updateVariantImageMutation = useMutation({
    mutationFn: async ({ id, image }: { id: string; image: string | null }) => {
      const response = await apiRequest('PUT', `/api/admin/variants/${id}`, { image });
      return response.json();
    },
    onSuccess: (updatedVariant) => {
      setVariants(variants.map(v => v.id === updatedVariant.id ? updatedVariant : v));
      setSuccessMessage("Variant image updated!");
      setTimeout(() => setSuccessMessage(""), 2000);
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/variants/${id}`);
    },
    onSuccess: (_, deletedId) => {
      setVariants(variants.filter(v => v.id !== deletedId));
      setSuccessMessage("Variant deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 2000);
    },
  });

  const moveVariant = async (index: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= variants.length) return;
    const reordered = [...variants];
    [reordered[index], reordered[swapIdx]] = [reordered[swapIdx], reordered[index]];
    const withOrders = reordered.map((v, i) => ({ ...v, sortOrder: i + 1 }));
    setVariants(withOrders);
    await Promise.all([
      apiRequest('PUT', `/api/admin/variants/${withOrders[index].id}`, { sortOrder: withOrders[index].sortOrder }),
      apiRequest('PUT', `/api/admin/variants/${withOrders[swapIdx].id}`, { sortOrder: withOrders[swapIdx].sortOrder }),
    ]);
  };

  const resetCreateForm = () => {
    setNewProductName("");
    setNewProductPrice("");
    setNewProductDescription("");
    setNewProductBrand("");
    setNewProductCategoryId(null);
    setNewProductImageUrl("");
    setNewProductStock("10");
  };

  const openEditor = async (product: Product) => {
    setEditingProduct(product);
    setImageUrl(product.imageUrl);
    setGalleryImages([...product.images]);
    setNewGalleryImage("");
    setSuccessMessage("");
    setDescription(product.description || "");
    setSelectedCategoryId(product.categoryId);
    setActiveTab("details");
    setStockLevel(product.stock);
    setProductName(product.name);
    setProductPrice(product.price);
    setSelectedVariantForImage("");
    setVariantImageUrl("");
    setStoreCode(product.storeCode || "");
    setFbtSearch("");
    setNewVariantName("");
    setNewVariantPrice("");
    setNewVariantSku("");
    setNewVariantStock("0");
    setNewVariantGroupLabel("");
    setNewVariantDescription("");
    setEditingVariant(null);
    
    // Fetch existing FBT products
    try {
      const res = await fetch(`/api/admin/products/${product.id}/fbt`);
      if (res.ok) {
        const fbtProducts = await res.json();
        setSelectedFbtProducts(fbtProducts);
      } else {
        setSelectedFbtProducts([]);
      }
    } catch (error) {
      setSelectedFbtProducts([]);
    }
    
    // Fetch existing variants
    try {
      const res = await fetch(`/api/admin/products/${product.id}/variants`);
      if (res.ok) {
        const productVariants = await res.json();
        setVariants(productVariants);
      } else {
        setVariants([]);
      }
    } catch (error) {
      setVariants([]);
    }
  };

  const addGalleryImage = () => {
    if (newGalleryImage.trim()) {
      setGalleryImages([...galleryImages, newGalleryImage.trim()]);
      setNewGalleryImage("");
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryImages(galleryImages.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!editingProduct) return;
    updateMutation.mutate({
      slug: editingProduct.slug,
      imageUrl,
      images: galleryImages,
    });
  };

  const handleSaveDescription = () => {
    if (!editingProduct) return;
    updateDescriptionMutation.mutate({
      slug: editingProduct.slug,
      description,
    });
  };

  const handleSaveCategory = () => {
    if (!editingProduct) return;
    updateCategoryMutation.mutate({
      slug: editingProduct.slug,
      categoryId: selectedCategoryId,
    });
  };

  const handleRemoveFromCategory = () => {
    if (!editingProduct) return;
    updateCategoryMutation.mutate({
      slug: editingProduct.slug,
      categoryId: null,
    });
  };

  const handleSaveStock = () => {
    if (!editingProduct) return;
    updateStockMutation.mutate({
      slug: editingProduct.slug,
      stock: stockLevel,
    });
  };

  const handleSaveName = () => {
    if (!editingProduct) return;
    updateNameMutation.mutate({
      slug: editingProduct.slug,
      name: productName,
    });
  };

  const handleSavePrice = () => {
    if (!editingProduct) return;
    const price = parseFloat(productPrice);
    if (isNaN(price) || price < 0) return;
    updatePriceMutation.mutate({
      slug: editingProduct.slug,
      price: productPrice,
    });
  };

  const handleSaveStoreCode = () => {
    if (!editingProduct) return;
    updateStoreCodeMutation.mutate({
      slug: editingProduct.slug,
      storeCode: storeCode.trim(),
    });
  };

  const handleCreateProduct = () => {
    if (!newProductName.trim() || !newProductPrice.trim()) return;
    createProductMutation.mutate({
      name: newProductName.trim(),
      price: newProductPrice.trim(),
      description: newProductDescription,
      brand: newProductBrand.trim() || 'Alectra',
      categoryId: newProductCategoryId,
      imageUrl: newProductImageUrl || 'https://via.placeholder.com/400?text=No+Image',
      stock: parseInt(newProductStock) || 10,
    });
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Uncategorized";
    const category = categories?.find(c => c.id === categoryId);
    return category?.name || "Unknown";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Product Image Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); loginMutation.mutate(password); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
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
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" data-testid="link-back-admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {successMessage && !editingProduct && (
          <Alert className="mb-4 border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Manager
            </CardTitle>
            <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-create-product">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Product
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Search for a product to edit its name, images, description, category, or stock.
                Or create a new product using the button above.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, slug, or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-products"
                />
              </div>
            </div>

            {isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}

            {products && products.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No products found. Try a different search term.
              </p>
            )}

            <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
              {products?.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center gap-4 p-3 border rounded-lg hover-elevate cursor-pointer"
                  onClick={() => openEditor(product)}
                  data-testid={`product-row-${product.slug}`}
                >
                  <img
                    src={getImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{product.slug}</p>
                    <p className="text-xs text-muted-foreground">
                      {product.images.length} gallery image{product.images.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" data-testid={`button-edit-${product.slug}`}>
                    Edit
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Product: {editingProduct?.name}</DialogTitle>
            </DialogHeader>

            {successMessage && (
              <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 dark:text-green-100">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="details" className="flex items-center gap-2" data-testid="tab-details">
                  <Edit3 className="h-4 w-4" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Images
                </TabsTrigger>
                <TabsTrigger value="description" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </TabsTrigger>
                <TabsTrigger value="category" className="flex items-center gap-2">
                  <FolderMinus className="h-4 w-4" />
                  Category
                </TabsTrigger>
                <TabsTrigger value="stock" className="flex items-center gap-2" data-testid="tab-stock">
                  <Package className="h-4 w-4" />
                  Stock
                </TabsTrigger>
                <TabsTrigger value="variants" className="flex items-center gap-2" data-testid="tab-variants">
                  <PlusCircle className="h-4 w-4" />
                  Variants
                </TabsTrigger>
                <TabsTrigger value="fbt" className="flex items-center gap-2" data-testid="tab-fbt">
                  <Link2 className="h-4 w-4" />
                  FBT
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="productName"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="Enter product name..."
                        className="flex-1"
                        data-testid="input-product-name"
                      />
                      <Button
                        onClick={handleSaveName}
                        disabled={updateNameMutation.isPending || !productName.trim() || productName === editingProduct?.name}
                        size="sm"
                        data-testid="button-save-name"
                      >
                        {updateNameMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productPrice">Price (R)</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R</span>
                        <Input
                          id="productPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          value={productPrice}
                          onChange={(e) => setProductPrice(e.target.value)}
                          placeholder="0.00"
                          className="pl-7"
                          data-testid="input-product-price"
                        />
                      </div>
                      <Button
                        onClick={handleSavePrice}
                        disabled={updatePriceMutation.isPending || !productPrice || parseFloat(productPrice) < 0 || productPrice === editingProduct?.price}
                        size="sm"
                        data-testid="button-save-price"
                      >
                        {updatePriceMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeCode">Store Code (Internal Use)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="storeCode"
                        value={storeCode}
                        onChange={(e) => setStoreCode(e.target.value)}
                        placeholder="e.g. GA42, SM-001"
                        className="flex-1"
                        data-testid="input-store-code"
                      />
                      <Button
                        onClick={handleSaveStoreCode}
                        disabled={updateStoreCodeMutation.isPending || storeCode === (editingProduct?.storeCode || "")}
                        size="sm"
                        data-testid="button-save-store-code"
                      >
                        {updateStoreCodeMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Physical store product code for stock control</p>
                  </div>

                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">Product Info</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">SKU:</span>
                      <span>{editingProduct?.sku}</span>
                      <span className="text-muted-foreground">Slug:</span>
                      <span>{editingProduct?.slug}</span>
                      <span className="text-muted-foreground">Brand:</span>
                      <span>{editingProduct?.brand}</span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditingProduct(null)}
                    data-testid="button-cancel-details"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="images" className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="mainImage">Main Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="mainImage"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="flex-1"
                      data-testid="input-main-image"
                    />
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760}
                      onGetUploadParameters={async () => {
                        const res = await fetch('/api/admin/upload-url', { method: 'POST' });
                        const data = await res.json();
                        return { method: 'PUT' as const, url: data.uploadURL };
                      }}
                      onComplete={(result) => {
                        if (result.successful && result.successful.length > 0) {
                          const uploadUrl = result.successful[0].uploadURL;
                          if (uploadUrl) {
                            const url = new URL(uploadUrl);
                            const objectPath = `/objects${url.pathname.split('/.private')[1]}`;
                            setImageUrl(objectPath);
                          }
                        }
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </ObjectUploader>
                  </div>
                  {imageUrl && (
                    <div className="mt-2">
                      <img
                        src={getImageUrl(imageUrl)}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128?text=Invalid+URL';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Gallery Images ({galleryImages.length})</Label>
                  <div className="flex gap-2 flex-wrap">
                    <Input
                      value={newGalleryImage}
                      onChange={(e) => setNewGalleryImage(e.target.value)}
                      placeholder="Add gallery image URL..."
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGalleryImage())}
                      className="flex-1 min-w-[200px]"
                      data-testid="input-new-gallery-image"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addGalleryImage}
                      disabled={!newGalleryImage.trim()}
                      data-testid="button-add-gallery-image"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <ObjectUploader
                      maxNumberOfFiles={5}
                      maxFileSize={10485760}
                      onGetUploadParameters={async () => {
                        const res = await fetch('/api/admin/upload-url', { method: 'POST' });
                        const data = await res.json();
                        return { method: 'PUT' as const, url: data.uploadURL };
                      }}
                      onComplete={(result) => {
                        if (result.successful && result.successful.length > 0) {
                          const newImages: string[] = [];
                          for (const file of result.successful) {
                            if (file.uploadURL) {
                              const url = new URL(file.uploadURL);
                              const objectPath = `/objects${url.pathname.split('/.private')[1]}`;
                              newImages.push(objectPath);
                            }
                          }
                          setGalleryImages([...galleryImages, ...newImages]);
                        }
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload
                    </ObjectUploader>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {galleryImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={getImageUrl(img)}
                          alt={`Gallery ${index + 1}`}
                          className="w-full aspect-square object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=Invalid';
                          }}
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeGalleryImage(index)}
                          data-testid={`button-remove-gallery-${index}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        <p className="text-xs text-muted-foreground truncate mt-1">{img.substring(0, 30)}...</p>
                      </div>
                    ))}
                  </div>
                </div>

                {variants.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <Label>Variant Images</Label>
                    <p className="text-xs text-muted-foreground">
                      Set a specific image for each variant. When a customer selects a variant, this image will be shown.
                    </p>
                    <Select
                      value={selectedVariantForImage}
                      onValueChange={(val) => {
                        setSelectedVariantForImage(val);
                        const v = variants.find(v => v.id === val);
                        setVariantImageUrl(v?.image || "");
                      }}
                    >
                      <SelectTrigger data-testid="select-variant-for-image">
                        <SelectValue placeholder="Select a variant..." />
                      </SelectTrigger>
                      <SelectContent>
                        {variants.map((v) => (
                          <SelectItem key={v.id} value={v.id} data-testid={`select-variant-image-${v.id}`}>
                            {v.name} {v.image ? "(has image)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedVariantForImage && (
                      <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">
                            Image for: {variants.find(v => v.id === selectedVariantForImage)?.name}
                          </Label>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={variantImageUrl}
                            onChange={(e) => setVariantImageUrl(e.target.value)}
                            placeholder="Image URL or upload..."
                            className="flex-1"
                            data-testid="input-variant-image-url"
                          />
                          <ObjectUploader
                            maxNumberOfFiles={1}
                            maxFileSize={10485760}
                            onGetUploadParameters={async () => {
                              const res = await fetch('/api/admin/upload-url', { method: 'POST' });
                              const data = await res.json();
                              return { method: 'PUT' as const, url: data.uploadURL };
                            }}
                            onComplete={(result) => {
                              if (result.successful && result.successful.length > 0) {
                                const uploadUrl = result.successful[0].uploadURL;
                                if (uploadUrl) {
                                  const url = new URL(uploadUrl);
                                  const objectPath = `/objects${url.pathname.split('/.private')[1]}`;
                                  setVariantImageUrl(objectPath);
                                }
                              }
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </ObjectUploader>
                        </div>
                        {variantImageUrl && (
                          <div className="mt-2">
                            <img
                              src={getImageUrl(variantImageUrl)}
                              alt="Variant preview"
                              className="w-32 h-32 object-cover rounded border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128?text=Invalid+URL';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              updateVariantImageMutation.mutate({
                                id: selectedVariantForImage,
                                image: variantImageUrl || null,
                              });
                            }}
                            disabled={updateVariantImageMutation.isPending}
                            data-testid="button-save-variant-image"
                          >
                            {updateVariantImageMutation.isPending ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Save Variant Image
                          </Button>
                          {variantImageUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setVariantImageUrl("");
                                updateVariantImageMutation.mutate({
                                  id: selectedVariantForImage,
                                  image: null,
                                });
                              }}
                              disabled={updateVariantImageMutation.isPending}
                              data-testid="button-remove-variant-image"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditingProduct(null)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateMutation.isPending || !imageUrl.trim()}
                    data-testid="button-save-images"
                  >
                    {updateMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Images
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="description" className="space-y-6 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Product Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter product description..."
                    rows={10}
                    className="resize-none"
                    data-testid="input-description"
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length} characters
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditingProduct(null)}
                    data-testid="button-cancel-description"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveDescription}
                    disabled={updateDescriptionMutation.isPending}
                    data-testid="button-save-description"
                  >
                    {updateDescriptionMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Description
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="category" className="space-y-6 mt-4">
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Current Category</p>
                    <p className="text-lg">{getCategoryName(editingProduct?.categoryId || null)}</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Move to Category</Label>
                    <Select
                      value={selectedCategoryId || "uncategorized"}
                      onValueChange={(value) => setSelectedCategoryId(value === "uncategorized" ? null : value)}
                    >
                      <SelectTrigger data-testid="select-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uncategorized">Uncategorized (Remove from collection)</SelectItem>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {editingProduct?.categoryId && (
                    <Button
                      variant="destructive"
                      onClick={handleRemoveFromCategory}
                      disabled={updateCategoryMutation.isPending}
                      className="w-full"
                      data-testid="button-remove-from-category"
                    >
                      {updateCategoryMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FolderMinus className="mr-2 h-4 w-4" />
                      )}
                      Remove from Current Collection
                    </Button>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditingProduct(null)}
                    data-testid="button-cancel-category"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveCategory}
                    disabled={updateCategoryMutation.isPending}
                    data-testid="button-save-category"
                  >
                    {updateCategoryMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Category
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="stock" className="space-y-6 mt-4">
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Current Stock Level</p>
                    <p className="text-2xl font-bold">{editingProduct?.stock ?? 0} units</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stockLevel">New Stock Level</Label>
                    <Input
                      id="stockLevel"
                      type="number"
                      min={0}
                      value={stockLevel}
                      onChange={(e) => setStockLevel(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="Enter stock quantity..."
                      data-testid="input-stock-level"
                    />
                    <p className="text-xs text-muted-foreground">
                      Set to 0 to mark as out of stock
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStockLevel(0)}
                      data-testid="button-stock-zero"
                    >
                      Set to 0
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStockLevel(10)}
                      data-testid="button-stock-10"
                    >
                      Set to 10
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStockLevel(100)}
                      data-testid="button-stock-100"
                    >
                      Set to 100
                    </Button>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditingProduct(null)}
                    data-testid="button-cancel-stock"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveStock}
                    disabled={updateStockMutation.isPending}
                    data-testid="button-save-stock"
                  >
                    {updateStockMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Stock
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="variants" className="mt-4">
                {/* Helper: image picker grid used in both add and edit forms */}
                {(() => {
                  const allProductImages = [
                    ...(imageUrl ? [imageUrl] : []),
                    ...galleryImages,
                  ].filter(Boolean);

                  const VariantImagePicker = ({
                    value,
                    onChange,
                    testPrefix,
                  }: {
                    value: string;
                    onChange: (v: string) => void;
                    testPrefix: string;
                  }) => (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Image</Label>
                      {allProductImages.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Select from product images</p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => onChange("")}
                              className={`w-14 h-14 rounded border-2 flex items-center justify-center text-xs text-muted-foreground transition-colors ${
                                value === "" ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
                              }`}
                              data-testid={`${testPrefix}-no-image`}
                            >
                              None
                            </button>
                            {allProductImages.map((img, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => onChange(img)}
                                className={`w-14 h-14 rounded border-2 overflow-hidden transition-colors ${
                                  value === img ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground"
                                }`}
                                data-testid={`${testPrefix}-gallery-${i}`}
                              >
                                <img
                                  src={getImageUrl(img)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 items-center">
                        <Input
                          value={value}
                          onChange={(e) => onChange(e.target.value)}
                          placeholder="Or paste image URL..."
                          className="flex-1 text-xs"
                          data-testid={`${testPrefix}-url`}
                        />
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={10485760}
                          onGetUploadParameters={async () => {
                            const res = await fetch('/api/admin/upload-url', { method: 'POST' });
                            const data = await res.json();
                            return { method: 'PUT' as const, url: data.uploadURL };
                          }}
                          onComplete={(result) => {
                            if (result.successful && result.successful.length > 0) {
                              const uploadUrl = result.successful[0].uploadURL;
                              if (uploadUrl) {
                                const url = new URL(uploadUrl);
                                const objectPath = `/objects${url.pathname.split('/.private')[1]}`;
                                onChange(objectPath);
                              }
                            }
                          }}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                        </ObjectUploader>
                      </div>
                      {value && (
                        <img
                          src={getImageUrl(value)}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded border"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=Invalid'; }}
                        />
                      )}
                    </div>
                  );

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          {variants.length} variant{variants.length !== 1 ? "s" : ""}
                        </p>
                        {!showAddVariantForm && (
                          <Button
                            size="sm"
                            onClick={() => { setShowAddVariantForm(true); setEditingVariant(null); }}
                            data-testid="button-show-add-variant"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add variant
                          </Button>
                        )}
                      </div>

                      {/* Variant table */}
                      {variants.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                          {/* Table header */}
                          <div className="grid grid-cols-[48px_1fr_100px_100px_80px_32px_80px] gap-2 px-3 py-2 bg-muted/50 border-b text-xs font-medium text-muted-foreground">
                            <span>Image</span>
                            <span>Name / Group</span>
                            <span>Price</span>
                            <span>SKU</span>
                            <span>Stock</span>
                            <span></span>
                            <span></span>
                          </div>

                          {variants.map((variant, variantIndex) => (
                            <div key={variant.id} data-testid={`variant-item-${variant.id}`}>
                              {/* Row view */}
                              {editingVariant?.id !== variant.id && (
                                <div className="grid grid-cols-[48px_1fr_100px_100px_80px_32px_80px] gap-2 px-3 py-2 items-center border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                                  <div className="w-10 h-10 rounded border overflow-hidden bg-muted flex-shrink-0">
                                    {variant.image ? (
                                      <img
                                        src={getImageUrl(variant.image)}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Image className="h-4 w-4 text-muted-foreground/40" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-sm font-medium truncate block">{variant.name}</span>
                                    {(variant as any).groupLabel && (
                                      <span className="text-xs text-muted-foreground truncate block">{(variant as any).groupLabel}</span>
                                    )}
                                    {(variant as any).description && (
                                      <span className="text-xs text-muted-foreground/70 truncate block italic">{(variant as any).description}</span>
                                    )}
                                  </div>
                                  <span className="text-sm whitespace-nowrap">R&nbsp;{parseFloat(variant.price as string).toFixed(2)}</span>
                                  <span className="text-xs text-muted-foreground truncate">{variant.sku || "—"}</span>
                                  <span className="text-sm">{variant.stock}</span>
                                  <div className="flex flex-col items-center gap-0">
                                    <button
                                      onClick={() => moveVariant(variantIndex, 'up')}
                                      disabled={variantIndex === 0}
                                      className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                                      data-testid={`button-variant-up-${variant.id}`}
                                    >
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => moveVariant(variantIndex, 'down')}
                                      disabled={variantIndex === variants.length - 1}
                                      className="p-0.5 rounded text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                                      data-testid={`button-variant-down-${variant.id}`}
                                    >
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex gap-1 justify-end">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => { setEditingVariant({ ...variant, price: String(variant.price) }); setShowAddVariantForm(false); }}
                                      data-testid={`button-edit-variant-${variant.id}`}
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => {
                                        if (confirm(`Delete variant "${variant.name}"?`)) {
                                          deleteVariantMutation.mutate(variant.id);
                                        }
                                      }}
                                      disabled={deleteVariantMutation.isPending}
                                      data-testid={`button-delete-variant-${variant.id}`}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              )}

                              {/* Inline edit panel */}
                              {editingVariant?.id === variant.id && (
                                <div className="p-4 bg-muted/20 border-b space-y-4" data-testid={`variant-edit-panel-${variant.id}`}>
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm">Editing: {variant.name}</h4>
                                    <Button size="icon" variant="ghost" onClick={() => setEditingVariant(null)}>
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <Label className="text-xs">Group Label (optional)</Label>
                                      <Input
                                        value={(editingVariant as any).groupLabel || ""}
                                        onChange={(e) => setEditingVariant({ ...editingVariant, groupLabel: e.target.value } as any)}
                                        placeholder="e.g., Door Size, Finish, Colour"
                                        data-testid={`input-edit-variant-group-label-${variant.id}`}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Price (R)</Label>
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={editingVariant.price}
                                        onChange={(e) => setEditingVariant({ ...editingVariant, price: e.target.value })}
                                        data-testid={`input-edit-variant-price-${variant.id}`}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Name</Label>
                                      <Input
                                        value={editingVariant.name}
                                        onChange={(e) => setEditingVariant({ ...editingVariant, name: e.target.value })}
                                        data-testid={`input-edit-variant-name-${variant.id}`}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Short Description (optional)</Label>
                                      <Input
                                        value={(editingVariant as any).description || ""}
                                        onChange={(e) => setEditingVariant({ ...editingVariant, description: e.target.value } as any)}
                                        placeholder="e.g., Standard single garage door size"
                                        data-testid={`input-edit-variant-description-${variant.id}`}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">SKU (optional)</Label>
                                      <Input
                                        value={editingVariant.sku || ""}
                                        onChange={(e) => setEditingVariant({ ...editingVariant, sku: e.target.value })}
                                        data-testid={`input-edit-variant-sku-${variant.id}`}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-xs">Stock</Label>
                                      <Input
                                        type="number"
                                        value={editingVariant.stock}
                                        onChange={(e) => setEditingVariant({ ...editingVariant, stock: parseInt(e.target.value) || 0 })}
                                        data-testid={`input-edit-variant-stock-${variant.id}`}
                                      />
                                    </div>
                                  </div>

                                  <VariantImagePicker
                                    value={editingVariant.image || ""}
                                    onChange={(v) => setEditingVariant({ ...editingVariant, image: v })}
                                    testPrefix={`edit-variant-img-${variant.id}`}
                                  />

                                  <div className="flex gap-2 pt-1">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        updateVariantMutation.mutate({
                                          id: editingVariant.id,
                                          name: editingVariant.name,
                                          price: String(editingVariant.price),
                                          sku: editingVariant.sku || "",
                                          stock: editingVariant.stock,
                                          image: editingVariant.image || "",
                                          groupLabel: (editingVariant as any).groupLabel || "",
                                          description: (editingVariant as any).description || "",
                                        });
                                      }}
                                      disabled={updateVariantMutation.isPending}
                                      data-testid={`button-save-variant-${variant.id}`}
                                    >
                                      {updateVariantMutation.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                      )}
                                      Save changes
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingVariant(null)}
                                      data-testid={`button-cancel-edit-variant-${variant.id}`}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {variants.length === 0 && !showAddVariantForm && (
                        <div className="border rounded-lg p-8 text-center text-sm text-muted-foreground">
                          No variants yet. Click "Add variant" to get started.
                        </div>
                      )}

                      {/* Add variant form */}
                      {showAddVariantForm && (
                        <div className="border rounded-lg p-4 space-y-4 bg-muted/20" data-testid="variant-add-form">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">New Variant</h4>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => { setShowAddVariantForm(false); setNewVariantName(""); setNewVariantPrice(""); setNewVariantSku(""); setNewVariantStock("0"); setNewVariantImage(""); setNewVariantGroupLabel(""); setNewVariantDescription(""); }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Group Label (optional)</Label>
                              <Input
                                value={newVariantGroupLabel}
                                onChange={(e) => setNewVariantGroupLabel(e.target.value)}
                                placeholder="e.g., Door Size, Finish, Colour"
                                data-testid="input-variant-group-label"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Price (R) *</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={newVariantPrice}
                                onChange={(e) => setNewVariantPrice(e.target.value)}
                                placeholder="0.00"
                                data-testid="input-variant-price"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Name *</Label>
                              <Input
                                value={newVariantName}
                                onChange={(e) => setNewVariantName(e.target.value)}
                                placeholder="e.g., 2450mm Width, Smooth, 9kg"
                                data-testid="input-variant-name"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Short Description (optional)</Label>
                              <Input
                                value={newVariantDescription}
                                onChange={(e) => setNewVariantDescription(e.target.value)}
                                placeholder="e.g., Standard single garage door size"
                                data-testid="input-variant-description"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">SKU (optional)</Label>
                              <Input
                                value={newVariantSku}
                                onChange={(e) => setNewVariantSku(e.target.value)}
                                placeholder="PROD-VAR-001"
                                data-testid="input-variant-sku"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Stock</Label>
                              <Input
                                type="number"
                                value={newVariantStock}
                                onChange={(e) => setNewVariantStock(e.target.value)}
                                placeholder="0"
                                data-testid="input-variant-stock"
                              />
                            </div>
                          </div>

                          <VariantImagePicker
                            value={newVariantImage}
                            onChange={setNewVariantImage}
                            testPrefix="new-variant-img"
                          />

                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              disabled={!newVariantName.trim() || !newVariantPrice || createVariantMutation.isPending}
                              onClick={() => {
                                if (editingProduct) {
                                  createVariantMutation.mutate({
                                    productId: editingProduct.id,
                                    name: newVariantName,
                                    price: newVariantPrice,
                                    sku: newVariantSku,
                                    stock: parseInt(newVariantStock) || 0,
                                    image: newVariantImage,
                                    sortOrder: variants.length + 1,
                                    groupLabel: newVariantGroupLabel || undefined,
                                    description: newVariantDescription || undefined,
                                  });
                                }
                              }}
                              data-testid="button-add-variant"
                            >
                              {createVariantMutation.isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="mr-2 h-4 w-4" />
                              )}
                              Add variant
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setShowAddVariantForm(false); setNewVariantName(""); setNewVariantPrice(""); setNewVariantSku(""); setNewVariantStock("0"); setNewVariantImage(""); setNewVariantGroupLabel(""); setNewVariantDescription(""); }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <DialogFooter className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setEditingProduct(null)}
                    data-testid="button-cancel-variants"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </TabsContent>

              <TabsContent value="fbt" className="space-y-6 mt-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select products to show in the "Frequently Bought Together" section for this product.
                  </p>

                  {/* Search for products to add */}
                  <div className="space-y-2">
                    <Label>Search Products to Add</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={fbtSearch}
                        onChange={(e) => setFbtSearch(e.target.value)}
                        placeholder="Search by name, SKU, or slug..."
                        className="pl-10"
                        data-testid="input-fbt-search"
                      />
                    </div>
                  </div>

                  {/* Search results */}
                  {fbtSearch.trim() && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {allProducts
                        ?.filter(p => {
                          const searchLower = fbtSearch.toLowerCase();
                          return (
                            p.id !== editingProduct?.id &&
                            !selectedFbtProducts.some(s => s.id === p.id) &&
                            (p.name.toLowerCase().includes(searchLower) ||
                              p.sku.toLowerCase().includes(searchLower) ||
                              p.slug.toLowerCase().includes(searchLower))
                          );
                        })
                        .slice(0, 10)
                        .map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            onClick={() => {
                              setSelectedFbtProducts([...selectedFbtProducts, product]);
                              setFbtSearch("");
                            }}
                            data-testid={`fbt-search-result-${product.id}`}
                          >
                            <img
                              src={getImageUrl(product.imageUrl)}
                              alt={product.name}
                              className="w-10 h-10 object-contain rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.sku}</p>
                            </div>
                            <Plus className="h-4 w-4 text-primary" />
                          </div>
                        ))}
                      {allProducts?.filter(p => {
                        const searchLower = fbtSearch.toLowerCase();
                        return (
                          p.id !== editingProduct?.id &&
                          !selectedFbtProducts.some(s => s.id === p.id) &&
                          (p.name.toLowerCase().includes(searchLower) ||
                            p.sku.toLowerCase().includes(searchLower) ||
                            p.slug.toLowerCase().includes(searchLower))
                        );
                      }).length === 0 && (
                        <p className="p-3 text-sm text-muted-foreground text-center">No products found</p>
                      )}
                    </div>
                  )}

                  {/* Selected FBT products */}
                  <div className="space-y-2">
                    <Label>Selected Products ({selectedFbtProducts.length})</Label>
                    {selectedFbtProducts.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-4 border rounded-lg text-center">
                        No products selected. Search and add products above.
                      </p>
                    ) : (
                      <div className="border rounded-lg divide-y">
                        {selectedFbtProducts.map((product, index) => (
                          <div
                            key={product.id}
                            className="flex items-center gap-3 p-3"
                            data-testid={`fbt-selected-${product.id}`}
                          >
                            <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                            <img
                              src={getImageUrl(product.imageUrl)}
                              alt={product.name}
                              className="w-10 h-10 object-contain rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">R{product.price}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedFbtProducts(selectedFbtProducts.filter(p => p.id !== product.id));
                              }}
                              data-testid={`button-remove-fbt-${product.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditingProduct(null)}
                    data-testid="button-cancel-fbt"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      if (editingProduct) {
                        updateFbtMutation.mutate({
                          productId: editingProduct.id,
                          relatedProductIds: selectedFbtProducts.map(p => p.id),
                        });
                      }
                    }}
                    disabled={updateFbtMutation.isPending}
                    data-testid="button-save-fbt"
                  >
                    {updateFbtMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save FBT
                  </Button>
                </DialogFooter>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <Dialog open={createDialogOpen} onOpenChange={(open) => {
          if (!open) {
            resetCreateForm();
          }
          setCreateDialogOpen(open);
        }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Create New Product
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newProductName">Product Name *</Label>
                <Input
                  id="newProductName"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Enter product name..."
                  data-testid="input-new-product-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newProductPrice">Price (Rands) *</Label>
                <Input
                  id="newProductPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newProductPrice}
                  onChange={(e) => setNewProductPrice(e.target.value)}
                  placeholder="0.00"
                  data-testid="input-new-product-price"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newProductBrand">Brand</Label>
                <Input
                  id="newProductBrand"
                  value={newProductBrand}
                  onChange={(e) => setNewProductBrand(e.target.value)}
                  placeholder="Alectra (default)"
                  data-testid="input-new-product-brand"
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newProductCategoryId || "uncategorized"}
                  onValueChange={(value) => setNewProductCategoryId(value === "uncategorized" ? null : value)}
                >
                  <SelectTrigger data-testid="select-new-product-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newProductDescription">Description (formatting preserved)</Label>
                <Textarea
                  id="newProductDescription"
                  value={newProductDescription}
                  onChange={(e) => setNewProductDescription(e.target.value)}
                  placeholder="Enter product description with line breaks, bullet points, etc..."
                  rows={8}
                  className="resize-y font-mono text-sm whitespace-pre-wrap"
                  data-testid="input-new-product-description"
                />
              </div>

              <div className="space-y-2">
                <Label>Product Image</Label>
                <div className="flex items-center gap-3">
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={10485760}
                    onGetUploadParameters={async () => {
                      const res = await fetch('/api/admin/upload-url', { method: 'POST' });
                      const data = await res.json();
                      return { method: 'PUT' as const, url: data.uploadURL };
                    }}
                    onComplete={(result) => {
                      if (result.successful && result.successful.length > 0) {
                        const uploadUrl = result.successful[0].uploadURL;
                        if (uploadUrl) {
                          const url = new URL(uploadUrl);
                          const objectPath = `/objects${url.pathname.split('/.private')[1]}`;
                          setNewProductImageUrl(objectPath);
                        }
                      }
                    }}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {newProductImageUrl ? 'Change Image' : 'Upload Image'}
                  </ObjectUploader>
                </div>
                {newProductImageUrl && (
                  <div className="mt-2">
                    <img 
                      src={getImageUrl(newProductImageUrl)} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded border"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/96?text=Invalid+URL';
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newProductStock">Initial Stock</Label>
                <Input
                  id="newProductStock"
                  type="number"
                  min="0"
                  value={newProductStock}
                  onChange={(e) => setNewProductStock(e.target.value)}
                  placeholder="10"
                  data-testid="input-new-product-stock"
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetCreateForm();
                }}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProduct}
                disabled={createProductMutation.isPending || !newProductName.trim() || !newProductPrice.trim()}
                data-testid="button-submit-create"
              >
                {createProductMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Create Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
