import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Check, MessageSquare, Star, Truck, ShieldCheck } from "lucide-react";
import { StarRating } from "@/components/StarRating";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductReviewSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductReview, InsertProductReview } from "@shared/schema";
import { z } from "zod";

interface ProductDetailProps {
  onAddToCart: (product: Product, quantity: number) => void;
}

// Form schema for review submission
const reviewFormSchema = insertProductReviewSchema.omit({ productId: true });

export default function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const [, params] = useRoute("/product/:slug");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const { toast } = useToast();

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", params?.slug],
    enabled: !!params?.slug,
  });

  const { data: reviews = [] } = useQuery<ProductReview[]>({
    queryKey: ["/api/products", params?.slug, "reviews"],
    enabled: !!params?.slug,
  });

  const { data: ratingData } = useQuery<{ averageRating: number; totalReviews: number }>({
    queryKey: ["/api/products", params?.slug, "rating"],
    enabled: !!params?.slug,
  });

  const form = useForm<z.infer<typeof reviewFormSchema>>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: undefined as any,
      comment: "",
      authorName: "",
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reviewFormSchema>) => {
      return await apiRequest(`/api/products/${params?.slug}/reviews`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products", params?.slug, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products", params?.slug, "rating"] });
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });
      setIsReviewDialogOpen(false);
      form.reset();
      setSelectedRating(0);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmitReview = (data: z.infer<typeof reviewFormSchema>) => {
    createReviewMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Product not found</h1>
          <Link href="/products">
            <a className="text-primary hover:underline">Browse all products</a>
          </Link>
        </div>
      </div>
    );
  }

  const priceWithVAT = (parseFloat(product.price) * 1.15).toFixed(2);
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;
  
  // Ensure all image URLs start with /
  const fixImageUrl = (url: string) => url.startsWith('/') ? url : `/${url}`;
  const images = [product.imageUrl, ...(product.images || [])].map(fixImageUrl);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        {/* Breadcrumb */}
        <Link href="/products">
          <a className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ChevronLeft className="h-4 w-4" />
            Back to Products
          </a>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="aspect-square mb-4 bg-muted rounded-lg overflow-hidden">
              <img
                src={images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
                data-testid="img-product-main"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`aspect-square rounded-md overflow-hidden border-2 hover-elevate ${
                      selectedImage === idx ? "border-primary" : "border-transparent"
                    }`}
                    data-testid={`button-thumbnail-${idx}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <div className="text-sm text-muted-foreground mb-2">{product.brand}</div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2" data-testid="text-product-name">
              {product.name}
            </h1>

            {ratingData && ratingData.totalReviews > 0 && (
              <div className="mb-4">
                <StarRating
                  rating={ratingData.averageRating}
                  size="md"
                  showNumber
                  totalReviews={ratingData.totalReviews}
                />
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              {product.featured && <Badge>Featured</Badge>}
              {isLowStock && !isOutOfStock && (
                <Badge variant="destructive">Only {product.stock} left</Badge>
              )}
              {isOutOfStock && <Badge variant="secondary">Out of Stock</Badge>}
              {!isOutOfStock && product.stock > 5 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>In Stock</span>
                </div>
              )}
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-bold" data-testid="text-product-price">
                  R {priceWithVAT}
                </span>
                <span className="text-sm text-muted-foreground">VAT inc.</span>
              </div>
              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center border rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  data-testid="button-decrease-quantity"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium" data-testid="text-quantity">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  data-testid="button-increase-quantity"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <Button
                size="lg"
                className="flex-1"
                disabled={isOutOfStock}
                onClick={() => onAddToCart(product, quantity)}
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>
            </div>

            {/* Delivery Information */}
            <Card className="mb-8">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <Truck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">Nationwide Delivery</h4>
                      <p className="text-xs text-muted-foreground">We deliver to all areas across South Africa</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-1">Free Shipping on R2500+</h4>
                      <p className="text-xs text-muted-foreground">Enjoy free delivery on orders over R2500</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="description" className="mt-8">
              <TabsList className="w-full">
                <TabsTrigger value="description" className="flex-1">Description</TabsTrigger>
                <TabsTrigger value="reviews" className="flex-1">
                  Reviews {ratingData && `(${ratingData.totalReviews})`}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {isDescriptionExpanded || product.description.length <= 200
                    ? product.description
                    : `${product.description.slice(0, 200)}...`}
                  {product.description.length > 200 && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="ml-2 text-primary hover:underline font-medium"
                      data-testid="button-read-more"
                    >
                      {isDescriptionExpanded ? "Read less" : "read more..."}
                    </button>
                  )}
                </p>
              </TabsContent>
              <TabsContent value="reviews" className="mt-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-12" data-testid="empty-reviews">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No reviews yet</p>
                    <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-leave-first-review">Leave the first review</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Write a Review</DialogTitle>
                          <DialogDescription>
                            Share your experience with this product
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmitReview)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="rating"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Rating *</FormLabel>
                                  <FormControl>
                                    <div className="flex gap-2">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                          key={star}
                                          type="button"
                                          onClick={() => {
                                            setSelectedRating(star);
                                            field.onChange(star);
                                          }}
                                          className="hover-elevate active-elevate-2 rounded-md p-1"
                                          data-testid={`button-star-${star}`}
                                        >
                                          <Star
                                            className={`h-8 w-8 ${
                                              star <= (selectedRating || field.value)
                                                ? "fill-primary text-primary"
                                                : "fill-none text-muted-foreground"
                                            }`}
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="authorName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Your Name *</FormLabel>
                                  <FormControl>
                                    <Input placeholder="John Smith" {...field} data-testid="input-author-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="comment"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Comment (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Share your thoughts about this product..."
                                      className="resize-none"
                                      rows={4}
                                      {...field}
                                      value={field.value || ""}
                                      data-testid="textarea-comment"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsReviewDialogOpen(false)}
                                data-testid="button-cancel-review"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={createReviewMutation.isPending}
                                data-testid="button-submit-review"
                              >
                                {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Customer Reviews</h3>
                      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" data-testid="button-leave-review">
                            Leave a Review
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Write a Review</DialogTitle>
                            <DialogDescription>
                              Share your experience with this product
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmitReview)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="rating"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Rating *</FormLabel>
                                    <FormControl>
                                      <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={() => {
                                              setSelectedRating(star);
                                              field.onChange(star);
                                            }}
                                            className="hover-elevate active-elevate-2 rounded-md p-1"
                                            data-testid={`button-star-${star}`}
                                          >
                                            <Star
                                              className={`h-8 w-8 ${
                                                star <= (selectedRating || field.value)
                                                  ? "fill-primary text-primary"
                                                  : "fill-none text-muted-foreground"
                                              }`}
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="authorName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Your Name *</FormLabel>
                                    <FormControl>
                                      <Input placeholder="John Smith" {...field} data-testid="input-author-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="comment"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Comment (Optional)</FormLabel>
                                    <FormControl>
                                      <Textarea
                                        placeholder="Share your thoughts about this product..."
                                        className="resize-none"
                                        rows={4}
                                        {...field}
                                        value={field.value || ""}
                                        data-testid="textarea-comment"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-2 justify-end">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setIsReviewDialogOpen(false)}
                                  data-testid="button-cancel-review"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="submit"
                                  disabled={createReviewMutation.isPending}
                                  data-testid="button-submit-review"
                                >
                                  {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <Carousel
                      opts={{
                        align: "start",
                        loop: false,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="-ml-2 md:-ml-4">
                        {reviews.map((review, index) => (
                          <CarouselItem
                            key={review.id}
                            className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                            data-testid={`review-${index}`}
                          >
                            <Card className="h-full">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <StarRating rating={review.rating} size="sm" />
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(review.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="font-medium text-sm mb-2" data-testid="text-review-author">
                                  {review.authorName}
                                </p>
                                {review.comment && (
                                  <p className="text-sm text-muted-foreground" data-testid="text-review-comment">
                                    {review.comment}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {reviews.length > 3 && (
                        <>
                          <CarouselPrevious className="-left-4" />
                          <CarouselNext className="-right-4" />
                        </>
                      )}
                    </Carousel>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
