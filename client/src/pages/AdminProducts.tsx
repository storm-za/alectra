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
import { Loader2, Search, Image, Plus, Trash2, ArrowLeft, CheckCircle, Save, Upload, Lock, FileText, FolderMinus, Package, Edit3, PlusCircle, Link2, X } from "lucide-react";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Product, Category } from "@shared/schema";
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
    setFbtSearch("");
    
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
              <TabsList className="grid w-full grid-cols-6">
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
                <TabsTrigger value="fbt" className="flex items-center gap-2" data-testid="tab-fbt">
                  <Link2 className="h-4 w-4" />
                  FBT
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-6 mt-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                      id="productName"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Enter product name..."
                      data-testid="input-product-name"
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="text-sm font-medium">Product Info</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">SKU:</span>
                      <span>{editingProduct?.sku}</span>
                      <span className="text-muted-foreground">Slug:</span>
                      <span>{editingProduct?.slug}</span>
                      <span className="text-muted-foreground">Price:</span>
                      <span>R{editingProduct?.price}</span>
                      <span className="text-muted-foreground">Brand:</span>
                      <span>{editingProduct?.brand}</span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setEditingProduct(null)}
                    data-testid="button-cancel-name"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveName}
                    disabled={updateNameMutation.isPending || !productName.trim()}
                    data-testid="button-save-name"
                  >
                    {updateNameMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Name
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
