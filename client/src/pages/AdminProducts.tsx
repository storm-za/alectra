import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Loader2, Search, Image, Plus, Trash2, ArrowLeft, CheckCircle, Save, Upload } from "lucide-react";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Product } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const getImageUrl = (url: string) => {
  if (!url) return 'https://via.placeholder.com/64?text=No+Image';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? url : `/${url}`;
};

export default function AdminProducts() {
  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [newGalleryImage, setNewGalleryImage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const { data: allProducts, isLoading } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
    queryFn: async () => {
      const res = await fetch('/api/admin/products');
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json();
    },
    staleTime: 60000,
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

  const openEditor = (product: Product) => {
    setEditingProduct(product);
    setImageUrl(product.imageUrl);
    setGalleryImages([...product.images]);
    setNewGalleryImage("");
    setSuccessMessage("");
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Product Image Editor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Search for a product, then click to edit its main image or add gallery images.
                Changes are saved directly to the database.
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
                    Edit Images
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Images: {editingProduct?.name}</DialogTitle>
            </DialogHeader>

            {successMessage && (
              <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900 dark:text-green-100">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
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
                    onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
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
                    onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
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
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
