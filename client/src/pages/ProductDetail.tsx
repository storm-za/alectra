import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, Check, MessageSquare, Star, Truck, ShieldCheck, CreditCard, Lock, MapPin, BadgePercent, Store } from "lucide-react";
import { SiVisa, SiMastercard, SiApplepay, SiGooglepay } from "react-icons/si";
import { StarRating } from "@/components/StarRating";
import { WishlistButton } from "@/components/WishlistButton";
import { SEO, createProductStructuredData } from "@/components/SEO";
import { Breadcrumb } from "@/components/Breadcrumb";
import { HappyCustomersGallery } from "@/components/HappyCustomersGallery";
import { FrequentlyBoughtTogether } from "@/components/FrequentlyBoughtTogether";
import { WhyShopWithUs } from "@/components/WhyShopWithUs";
import { TradeAccountBenefits } from "@/components/TradeAccountBenefits";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProductReviewSchema, LP_GAS_PRICING, LP_GAS_CYLINDER_IDS, GLOSTEEL_PRICING, GLOSTEEL_DOOR_IDS, TORSION_SPRING_VARIANTS, TORSION_SPRING_PRODUCT_ID } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductReview, InsertProductReview, LpGasVariant, GarageDoorSize, GarageDoorFinish, GarageDoorVariant, TorsionSpringVariant, CartVariantType, ProductVariant } from "@shared/schema";
import { z } from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ProductImage, getOptimizedImageUrl } from "@/components/OptimizedImage";

interface ProductDetailProps {
  onAddToCart: (product: Product, quantity: number, variant?: CartVariantType, variantPrice?: string) => void;
}

// Form schema for review submission
const reviewFormSchema = insertProductReviewSchema.omit({ productId: true });

// Expandable description component with 7-line truncation
function ExpandableDescription({ 
  description, 
  isExpanded, 
  onToggle 
}: { 
  description: string; 
  isExpanded: boolean; 
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const lineHeight = 24; // Approximate line height in pixels
  const maxLines = 7;
  const maxHeight = lineHeight * maxLines;
  
  useEffect(() => {
    if (contentRef.current) {
      const scrollHeight = contentRef.current.scrollHeight;
      setNeedsTruncation(scrollHeight > maxHeight + 10);
    }
  }, [description]);
  
  const isHtml = description.includes('<') && description.includes('>');
  const baseClasses = "text-sm text-muted-foreground leading-relaxed";
  const htmlClasses = "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_li]:text-muted-foreground [&_p]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-base [&_h4]:font-semibold [&_h4]:text-foreground [&_h4]:mt-4 [&_h4]:mb-2 [&_strong]:text-foreground [&_strong]:font-medium";
  
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <div className="relative">
        <div
          ref={contentRef}
          className={`${baseClasses} ${isHtml ? htmlClasses : 'whitespace-pre-wrap'} overflow-hidden transition-all duration-300`}
          style={{ 
            maxHeight: !isExpanded && needsTruncation ? `${maxHeight}px` : 'none'
          }}
          dangerouslySetInnerHTML={isHtml ? { __html: description } : undefined}
        >
          {!isHtml && description.replace(/\r\n/g, '\n')}
        </div>
        
        {needsTruncation && !isExpanded && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent pointer-events-none"
          />
        )}
      </div>
      
      {needsTruncation && (
        <button
          onClick={onToggle}
          className="text-primary underline text-sm mt-2 hover:text-primary/80"
          data-testid={isExpanded ? "button-read-less" : "button-read-more"}
        >
          {isExpanded ? 'show less' : 'read more...'}
        </button>
      )}
    </div>
  );
}

export default function ProductDetail({ onAddToCart }: ProductDetailProps) {
  const [, params] = useRoute("/products/:slug");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<LpGasVariant>('exchange');
  const [selectedDoorSize, setSelectedDoorSize] = useState<GarageDoorSize>('2450mm');
  const [selectedDoorFinish, setSelectedDoorFinish] = useState<GarageDoorFinish | ''>('');
  const [selectedTorsionSpring, setSelectedTorsionSpring] = useState<TorsionSpringVariant>('45kg-green-left');
  const [selectedDbVariant, setSelectedDbVariant] = useState<string | null>(null);
  const [selectedGroupedVariants, setSelectedGroupedVariants] = useState<Record<string, string>>({});
  const [showStickyAddToCart, setShowStickyAddToCart] = useState(false);
  const addToCartButtonRef = useRef<HTMLButtonElement>(null);
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

  // Get category information for proper back navigation
  const { data: category } = useQuery<{ id: string; name: string; slug: string }>({
    queryKey: [`/api/categories/id/${product?.categoryId}`],
    enabled: !!product?.categoryId,
  });

  const { data: dbVariants = [] } = useQuery<ProductVariant[]>({
    queryKey: ['/api/products', product?.id, 'variants'],
    enabled: !!product?.id,
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
      return await apiRequest("POST", `/api/products/${params?.slug}/reviews`, data);
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

  // Intersection Observer for sticky Add to Cart button on mobile
  useEffect(() => {
    const button = addToCartButtonRef.current;
    if (!button) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky bar when the original button is not visible
        setShowStickyAddToCart(!entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0,
      }
    );

    observer.observe(button);

    return () => {
      observer.disconnect();
    };
  }, [product]);

  // Preload all torsion spring variant images for instant switching
  useEffect(() => {
    if (product?.id === TORSION_SPRING_PRODUCT_ID) {
      const preloadImages = () => {
        Object.values(TORSION_SPRING_VARIANTS).forEach((variant) => {
          if (variant.image) {
            const img = new Image();
            img.src = variant.image;
          }
        });
      };
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(preloadImages);
      } else {
        setTimeout(preloadImages, 100);
      }
    }
  }, [product?.id]);

  useEffect(() => {
    if (dbVariants.length > 0) {
      const fixUrl = (url: string) => {
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        if (url.startsWith('/objects')) return url;
        return url.startsWith('/') ? url : `/${url}`;
      };
      const preloadImages = () => {
        dbVariants.forEach((v) => {
          if (v.image) {
            const img = new Image();
            img.src = fixUrl(v.image);
          }
        });
      };
      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(preloadImages);
      } else {
        setTimeout(preloadImages, 100);
      }
    }
  }, [dbVariants]);

  useEffect(() => {
    if (selectedDbVariant) {
      setSelectedImage(0);
    }
  }, [selectedDbVariant]);

  // Auto-select first DB variant for torsion spring products when variants load
  useEffect(() => {
    if (product?.id === TORSION_SPRING_PRODUCT_ID && dbVariants.length > 0 && !selectedDbVariant) {
      const sorted = [...dbVariants].sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99));
      const firstInStock = sorted.find(v => (v.stock ?? 0) > 0) ?? sorted[0];
      setSelectedDbVariant(firstInStock.id);
    }
  }, [product?.id, dbVariants, selectedDbVariant]);

  // Parse DB variants into weight groups for the torsion spring two-level UI
  const torsionDbGroups = useMemo(() => {
    if (!product || product.id !== TORSION_SPRING_PRODUCT_ID || dbVariants.length === 0) return null;
    const colorCssMap: Record<string, string> = {
      'Green': 'green', 'Beige': '#c8a96b', 'Blue': '#3b82f6', 'Blue/White': '#3b82f6',
      'White': '#9ca3af', 'Red': '#ef4444', 'Orange': '#f97316', 'Brown': '#92400e', 'Yellow': '#ca8a04',
    };
    const groups: Record<string, { weightColor: string; weight: string; color: string; colorCss: string; left?: ProductVariant; right?: ProductVariant }> = {};
    for (const v of dbVariants) {
      const match = v.name.match(/^(.+?)\s+-\s+(Left|Right)/i);
      if (!match) continue;
      const weightColor = match[1].trim();
      const winding = match[2].toLowerCase();
      const weightMatch = weightColor.match(/^(\d+kg)\s+(.+)$/);
      if (!weightMatch) continue;
      const weight = weightMatch[1];
      const color = weightMatch[2];
      if (!groups[weightColor]) {
        groups[weightColor] = { weightColor, weight, color, colorCss: colorCssMap[color] || '#888' };
      }
      if (winding === 'left') groups[weightColor].left = v;
      else groups[weightColor].right = v;
    }
    return Object.values(groups);
  }, [product?.id, dbVariants]);

  // Lift WhatsApp button when sticky bar is active — placed before early returns to satisfy Rules of Hooks
  useEffect(() => {
    if (!showStickyAddToCart || !product) {
      document.body.classList.remove('sticky-bar-visible');
      return () => document.body.classList.remove('sticky-bar-visible');
    }
    // Compute isOutOfStock inline (mirrors logic after early returns)
    const isLpGas = LP_GAS_CYLINDER_IDS.includes(product.id);
    const lpPricing = isLpGas ? LP_GAS_PRICING[product.id] : null;
    const isGlosteel = GLOSTEEL_DOOR_IDS.includes(product.id);
    const gloPricing = isGlosteel ? GLOSTEEL_PRICING[product.id] : null;
    const springInfo = product.id === TORSION_SPRING_PRODUCT_ID ? TORSION_SPRING_VARIANTS[selectedTorsionSpring] : null;
    const varData = selectedDbVariant ? dbVariants.find(v => v.id === selectedDbVariant) ?? null : null;
    const priceVal = lpPricing
      ? lpPricing[selectedVariant]
      : gloPricing
      ? gloPricing[selectedDoorSize]
      : varData
      ? parseFloat(varData.price as string)
      : springInfo
      ? springInfo.price
      : parseFloat(product.price);
    const disc = (product as any).discontinued === true || priceVal === 0;
    const varStock = varData?.stock ?? null;
    const effStock = varStock != null ? varStock : product.stock;
    const oos = effStock === 0 || disc;
    if (!oos) {
      document.body.classList.add('sticky-bar-visible');
    } else {
      document.body.classList.remove('sticky-bar-visible');
    }
    return () => document.body.classList.remove('sticky-bar-visible');
  }, [showStickyAddToCart, product, selectedDbVariant, dbVariants, selectedVariant, selectedDoorSize, selectedTorsionSpring]);

  // Check if this is an LP Gas cylinder with variant pricing
  const isLpGasCylinder = product ? LP_GAS_CYLINDER_IDS.includes(product.id) : false;
  const lpGasPricing = isLpGasCylinder && product ? LP_GAS_PRICING[product.id] : null;

  // Check if this is a Glosteel garage door with size pricing
  const isGlosteelDoor = product ? GLOSTEEL_DOOR_IDS.includes(product.id) : false;
  const glosteelPricingHardcoded = isGlosteelDoor && product ? GLOSTEEL_PRICING[product.id] : null;

  // Override Glosteel pricing with DB variant prices when available (admin-editable)
  const glosteelDbPricing = useMemo(() => {
    if (!isGlosteelDoor || dbVariants.length === 0) return null;
    const result: Record<string, number> = {};
    dbVariants.forEach((v: any) => {
      const price = parseFloat(v.price as string);
      if (price > 0) {
        if (v.name?.includes('2450')) result['2450mm'] = price;
        if (v.name?.includes('2550')) result['2550mm'] = price;
      }
    });
    return Object.keys(result).length === 2 ? result as { '2450mm': number; '2550mm': number } : null;
  }, [isGlosteelDoor, dbVariants]);

  const glosteelPricing = glosteelDbPricing || glosteelPricingHardcoded;

  // Group DB variants by groupLabel for generic grouped variant display
  const groupedDbVariants = useMemo(() => {
    if (dbVariants.length === 0) return null;
    const hasGroupLabel = dbVariants.some((v: any) => v.groupLabel);
    if (!hasGroupLabel) return null;
    const groups: Record<string, typeof dbVariants> = {};
    const order: string[] = [];
    dbVariants.forEach((v: any) => {
      const label = v.groupLabel || 'Options';
      if (!groups[label]) { groups[label] = []; order.push(label); }
      groups[label].push(v);
    });
    return order.map(label => ({ label, variants: groups[label] }));
  }, [dbVariants]);

  // For generic grouped products: price is driven by the first group that has price > 0
  const isTorsionSpringProduct = product ? product.id === TORSION_SPRING_PRODUCT_ID : false;
  const groupedSelectedPrice = useMemo(() => {
    if (!groupedDbVariants || isGlosteelDoor || isLpGasCylinder || isTorsionSpringProduct) return null;
    for (const group of groupedDbVariants) {
      const selectedId = selectedGroupedVariants[group.label];
      if (selectedId) {
        const v = group.variants.find((x: any) => x.id === selectedId);
        if (v && parseFloat(v.price as string) > 0) return parseFloat(v.price as string);
      }
    }
    return null;
  }, [groupedDbVariants, selectedGroupedVariants, isGlosteelDoor, isLpGasCylinder, isTorsionSpringProduct]);

  // Whether this product uses generic grouped DB variant rendering (not Glosteel/LP Gas/Torsion Spring)
  const hasGenericGroupedVariants = !isGlosteelDoor && !isLpGasCylinder && !isTorsionSpringProduct && !!groupedDbVariants;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
          {/* Breadcrumb skeleton */}
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-4 w-12" />
            <span className="text-muted-foreground">/</span>
            <Skeleton className="h-4 w-24" />
            <span className="text-muted-foreground">/</span>
            <Skeleton className="h-4 w-40" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Image skeleton - matches aspect-square */}
            <div>
              <Skeleton className="aspect-square w-full rounded-lg" />
              {/* Thumbnail skeletons */}
              <div className="grid grid-cols-5 gap-2 mt-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-md" />
                ))}
              </div>
            </div>
            
            {/* Details skeleton */}
            <div className="space-y-4">
              {/* Brand */}
              <Skeleton className="h-4 w-24" />
              {/* Title */}
              <Skeleton className="h-10 w-full" />
              {/* Rating */}
              <Skeleton className="h-5 w-32" />
              {/* Badge */}
              <Skeleton className="h-6 w-20" />
              {/* Price */}
              <Skeleton className="h-12 w-40" />
              {/* Stock status */}
              <Skeleton className="h-5 w-24" />
              {/* Quantity selector */}
              <div className="flex items-center gap-4 pt-4">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 flex-1" />
              </div>
              {/* Wishlist button */}
              <Skeleton className="h-10 w-full" />
              {/* Delivery info cards */}
              <div className="space-y-3 pt-4">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
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
          <Link href="/collections/all">
            <a className="text-primary hover:underline">Browse all products</a>
          </Link>
        </div>
      </div>
    );
  }

  // Check if this is a torsion spring with variant pricing
  const isTorsionSpring = product.id === TORSION_SPRING_PRODUCT_ID;
  const torsionSpringInfo = isTorsionSpring ? TORSION_SPRING_VARIANTS[selectedTorsionSpring] : null;
  const selectedDbVariantData = selectedDbVariant ? dbVariants.find(v => v.id === selectedDbVariant) : null;
  
  // Calculate display price based on variant for LP Gas cylinders, Glosteel doors, or Torsion Springs
  const getDisplayPrice = () => {
    if (lpGasPricing) {
      return lpGasPricing[selectedVariant].toFixed(2);
    }
    if (glosteelPricing) {
      return glosteelPricing[selectedDoorSize].toFixed(2);
    }
    if (groupedSelectedPrice !== null) {
      return groupedSelectedPrice.toFixed(2);
    }
    if (selectedDbVariantData) {
      return parseFloat(selectedDbVariantData.price as string).toFixed(2);
    }
    if (torsionSpringInfo) {
      return torsionSpringInfo.price.toFixed(2);
    }
    return parseFloat(product.price).toFixed(2);
  };
  
  const displayPrice = getDisplayPrice();
  const priceValue = lpGasPricing
    ? lpGasPricing[selectedVariant]
    : glosteelPricing
    ? glosteelPricing[selectedDoorSize]
    : groupedSelectedPrice !== null
    ? groupedSelectedPrice
    : selectedDbVariantData
    ? parseFloat(selectedDbVariantData.price as string)
    : torsionSpringInfo
    ? torsionSpringInfo.price
    : parseFloat(product.price);
  const isDiscontinued = (product as any).discontinued === true || priceValue === 0;
  const variantStock = selectedDbVariantData != null ? selectedDbVariantData.stock : null;
  const effectiveStock = variantStock != null ? variantStock : product.stock;
  const isLowStock = effectiveStock > 0 && effectiveStock <= 5 && !isDiscontinued;
  const isOutOfStock = effectiveStock === 0 || isDiscontinued;

  // Ensure all image URLs are properly formatted
  const fixImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/objects')) return url;
    return url.startsWith('/') ? url : `/${url}`;
  };
  const allImages = [product.imageUrl, ...(product.images || [])].map(fixImageUrl);
  const baseImages = Array.from(new Set(allImages)); // Remove duplicates
  
  // For torsion springs, use variant-specific image if available
  const currentVariantImage = isTorsionSpring && torsionSpringInfo?.image ? torsionSpringInfo.image : null;
  const dbVariantImage = selectedDbVariantData?.image ? fixImageUrl(selectedDbVariantData.image) : null;
  const activeVariantImage = dbVariantImage || currentVariantImage;
  const images = activeVariantImage ? [activeVariantImage, ...baseImages.filter(img => img !== activeVariantImage)] : baseImages;

  // Create SEO-friendly description
  const seoDescription = product.description.length > 160 
    ? product.description.substring(0, 157) + "..." 
    : product.description;

  // Create structured data for the product
  const structuredData = createProductStructuredData({
    name: product.name,
    description: product.description,
    image: images[0],
    price: displayPrice,
    sku: product.sku,
    brand: product.brand,
    availability: isOutOfStock ? "out of stock" : "in stock",
    rating: ratingData?.averageRating,
    reviewCount: ratingData?.totalReviews,
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${product.name} - ${product.brand}`}
        description={seoDescription}
        image={images[0]}
        type="product"
        price={displayPrice}
        currency="ZAR"
        availability={isOutOfStock ? "out of stock" : "in stock"}
        structuredData={structuredData}
      />
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        {/* Breadcrumb with structured data */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            ...(category
              ? [{ label: category.name, href: `/collections/${category.slug}` }]
              : [{ label: "All Products", href: "/collections/all" }]),
            { label: product.name, href: `/products/${product.slug}` },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="relative mb-4">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                <ProductImage
                  src={images[selectedImage]}
                  alt={product.name}
                  size="large"
                  priority={selectedImage === 0}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="absolute bottom-3 right-3 z-10">
                <WishlistButton productId={product.id} imageOverlay />
              </div>
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
                    <ProductImage src={img} alt="" size="thumbnail" className="w-full h-full object-contain" />
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
              {isDiscontinued && <Badge variant="secondary">Discontinued</Badge>}
              {isOutOfStock && !isDiscontinued && <Badge variant="secondary">Out of Stock</Badge>}
              {!isOutOfStock && product.stock > 5 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-green-600" />
                  <span>In Stock</span>
                </div>
              )}
            </div>

            {/* LP Gas Variant Selector */}
            {isLpGasCylinder && lpGasPricing && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Select Option:</h3>
                <RadioGroup
                  value={selectedVariant}
                  onValueChange={(value) => setSelectedVariant(value as LpGasVariant)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <div className="relative">
                    <RadioGroupItem
                      value="exchange"
                      id="variant-exchange"
                      className="peer sr-only"
                      data-testid="radio-variant-exchange"
                    />
                    <Label
                      htmlFor="variant-exchange"
                      className="flex flex-col gap-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <span className="font-semibold">Exchange</span>
                      <span className="text-sm text-muted-foreground">
                        Bring your empty cylinder, get a full one
                      </span>
                      <span className="text-lg font-bold text-primary whitespace-nowrap">
                        R&nbsp;{lpGasPricing.exchange.toFixed(2)}
                      </span>
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem
                      value="new"
                      id="variant-new"
                      className="peer sr-only"
                      data-testid="radio-variant-new"
                    />
                    <Label
                      htmlFor="variant-new"
                      className="flex flex-col gap-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <span className="font-semibold">New Cylinder</span>
                      <span className="text-sm text-muted-foreground">Cylinder, filled and ready</span>
                      <span className="text-lg font-bold text-primary whitespace-nowrap">
                        R&nbsp;{lpGasPricing.new.toFixed(2)}
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Glosteel Garage Door Size Selector */}
            {isGlosteelDoor && glosteelPricing && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Select Door Size:</h3>
                <RadioGroup
                  value={selectedDoorSize}
                  onValueChange={(value) => setSelectedDoorSize(value as GarageDoorSize)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <div className="relative">
                    <RadioGroupItem
                      value="2450mm"
                      id="size-2450mm"
                      className="peer sr-only"
                      data-testid="radio-size-2450mm"
                    />
                    <Label
                      htmlFor="size-2450mm"
                      className="flex flex-col gap-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <span className="font-semibold">2450mm Width</span>
                      <span className="text-sm text-muted-foreground">
                        Standard single garage door size
                      </span>
                      <span className="text-lg font-bold text-primary whitespace-nowrap">
                        R&nbsp;{glosteelPricing['2450mm'].toFixed(2)}
                      </span>
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem
                      value="2550mm"
                      id="size-2550mm"
                      className="peer sr-only"
                      data-testid="radio-size-2550mm"
                    />
                    <Label
                      htmlFor="size-2550mm"
                      className="flex flex-col gap-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <span className="font-semibold">2550mm Width</span>
                      <span className="text-sm text-muted-foreground">
                        Wider single garage door size
                      </span>
                      <span className="text-lg font-bold text-primary whitespace-nowrap">
                        R&nbsp;{glosteelPricing['2550mm'].toFixed(2)}
                      </span>
                    </Label>
                  </div>
                </RadioGroup>

                <h3 className="text-sm font-medium mb-3 mt-4">Select Finish:</h3>
                <RadioGroup
                  value={selectedDoorFinish}
                  onValueChange={(value) => setSelectedDoorFinish(value as GarageDoorFinish)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  <div className="relative">
                    <RadioGroupItem
                      value="smooth"
                      id="finish-smooth"
                      className="peer sr-only"
                      data-testid="radio-finish-smooth"
                    />
                    <Label
                      htmlFor="finish-smooth"
                      className="flex flex-col gap-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <span className="font-semibold">Smooth</span>
                      <span className="text-sm text-muted-foreground">
                        Clean, flat panel finish
                      </span>
                    </Label>
                  </div>
                  <div className="relative">
                    <RadioGroupItem
                      value="woodgrain"
                      id="finish-woodgrain"
                      className="peer sr-only"
                      data-testid="radio-finish-woodgrain"
                    />
                    <Label
                      htmlFor="finish-woodgrain"
                      className="flex flex-col gap-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                    >
                      <span className="font-semibold">Woodgrain</span>
                      <span className="text-sm text-muted-foreground">
                        Textured wood-look finish
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
                {selectedDoorFinish === '' && (
                  <p className="text-xs text-destructive mt-2" data-testid="text-finish-required">Please select a finish before adding to cart</p>
                )}
              </div>
            )}

            {/* Torsion Spring Variant Selector — DB-driven when variants are in database */}
            {isTorsionSpring && torsionDbGroups && torsionDbGroups.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Select Spring Specification:</h3>
                <div className="space-y-4">
                  {/* Weight/Color from DB */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Weight & Color</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {torsionDbGroups.map((group) => {
                        const currentWinding = selectedDbVariantData?.name.includes('Right') ? 'right' : 'left';
                        const targetVariant = currentWinding === 'left' ? group.left : group.right;
                        const isSelected = selectedDbVariantData && (
                          selectedDbVariantData.id === group.left?.id || selectedDbVariantData.id === group.right?.id
                        );
                        const displayVariant = group.left || group.right;
                        const groupFullyOos = (group.left?.stock ?? 0) === 0 && (group.right?.stock ?? 0) === 0;
                        return (
                          <button
                            key={group.weightColor}
                            type="button"
                            disabled={groupFullyOos}
                            onClick={() => {
                              const preferred = targetVariant && (targetVariant.stock ?? 0) > 0 ? targetVariant : null;
                              const fallback = (group.left && (group.left.stock ?? 0) > 0) ? group.left : ((group.right && (group.right.stock ?? 0) > 0) ? group.right : (targetVariant || group.left || group.right));
                              const pick = preferred || fallback;
                              if (pick) setSelectedDbVariant(pick.id);
                            }}
                            className={`flex flex-col items-center gap-1 rounded-md border-2 p-3 transition-colors ${
                              groupFullyOos ? 'border-muted opacity-40 cursor-not-allowed line-through' :
                              isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:bg-accent'
                            }`}
                            data-testid={`button-spring-${group.weight}`}
                          >
                            <span className="text-sm font-semibold">{group.weight}</span>
                            <Badge
                              variant="outline"
                              className="text-xs"
                              style={groupFullyOos ? {} : { borderColor: group.colorCss, color: group.colorCss }}
                            >
                              {groupFullyOos ? 'Out of stock' : group.color}
                            </Badge>
                            {!groupFullyOos && (
                              <span className="text-xs font-medium text-primary whitespace-nowrap">
                                R&nbsp;{parseFloat((displayVariant?.price ?? '0') as string).toFixed(0)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Winding Direction from DB */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Winding Direction</Label>
                    {(() => {
                      const currentGroup = torsionDbGroups.find(g =>
                        g.left?.id === selectedDbVariantData?.id || g.right?.id === selectedDbVariantData?.id
                      );
                      const leftOos = (currentGroup?.left?.stock ?? 0) === 0;
                      const rightOos = (currentGroup?.right?.stock ?? 0) === 0;
                      return (
                        <RadioGroup
                          value={selectedDbVariantData?.name.includes('Right') ? 'right' : 'left'}
                          onValueChange={(value) => {
                            if (!currentGroup) return;
                            const pick = value === 'left' ? currentGroup.left : currentGroup.right;
                            if (pick) setSelectedDbVariant(pick.id);
                          }}
                          className="grid grid-cols-2 gap-3"
                        >
                          <div className="relative">
                            <RadioGroupItem value="left" id="winding-left" className="peer sr-only" disabled={leftOos} data-testid="radio-winding-left" />
                            <Label htmlFor="winding-left" className={`flex flex-col gap-1 rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary ${leftOos ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent hover:text-accent-foreground cursor-pointer'}`}>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Left-Wound</span>
                                <Badge className="bg-red-500 text-white text-xs">Red Cone</Badge>
                                {leftOos && <Badge variant="secondary" className="text-xs">Out of stock</Badge>}
                              </div>
                              <span className="text-sm text-muted-foreground">Installed on the right side of center bracket</span>
                            </Label>
                          </div>
                          <div className="relative">
                            <RadioGroupItem value="right" id="winding-right" className="peer sr-only" disabled={rightOos} data-testid="radio-winding-right" />
                            <Label htmlFor="winding-right" className={`flex flex-col gap-1 rounded-md border-2 border-muted bg-popover p-4 peer-data-[state=checked]:border-primary ${rightOos ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent hover:text-accent-foreground cursor-pointer'}`}>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">Right-Wound</span>
                                <Badge className="bg-black text-white text-xs">Black Cone</Badge>
                                {rightOos && <Badge variant="secondary" className="text-xs">Out of stock</Badge>}
                              </div>
                              <span className="text-sm text-muted-foreground">Installed on the left side of center bracket</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      );
                    })()}
                  </div>

                  {/* Selected summary */}
                  {selectedDbVariantData && (
                    <Alert className="border-primary/50 bg-primary/5">
                      <AlertDescription className="text-sm">
                        <strong>Selected:</strong> {selectedDbVariantData.name}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            {/* Fallback: hardcoded torsion spring UI when not yet in DB */}
            {isTorsionSpring && (!torsionDbGroups || torsionDbGroups.length === 0) && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Select Spring Specification:</h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Weight & Color</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['45kg', '50kg', '60kg', '65kg', '70kg', '80kg', '90kg', '100kg'] as const).map((weight) => {
                        const leftVariant = Object.keys(TORSION_SPRING_VARIANTS).find(k => k.startsWith(`${weight}-`) && k.endsWith('-left')) as TorsionSpringVariant;
                        const info = TORSION_SPRING_VARIANTS[leftVariant];
                        const isSelected = selectedTorsionSpring.startsWith(`${weight}-`);
                        return (
                          <button key={weight} type="button"
                            onClick={() => {
                              const currentWinding = selectedTorsionSpring.endsWith('-left') ? 'left' : 'right';
                              setSelectedTorsionSpring(`${weight}-${info.colorCode}-${currentWinding}` as TorsionSpringVariant);
                            }}
                            className={`flex flex-col items-center gap-1 rounded-md border-2 p-3 transition-colors ${isSelected ? 'border-primary bg-primary/5' : 'border-muted hover:bg-accent'}`}
                            data-testid={`button-spring-${weight}`}
                          >
                            <span className="text-sm font-semibold">{weight}</span>
                            <Badge variant="outline" className="text-xs" style={{ borderColor: info.colorCode === 'bluewhite' ? '#3b82f6' : info.colorCode, color: info.colorCode === 'bluewhite' ? '#3b82f6' : (info.colorCode === 'white' || info.colorCode === 'yellow' || info.colorCode === 'beige' ? '#000' : info.colorCode) }}>{info.color}</Badge>
                            <span className="text-xs font-medium text-primary whitespace-nowrap">R&nbsp;{info.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Winding Direction</Label>
                    <RadioGroup value={selectedTorsionSpring.endsWith('-left') ? 'left' : 'right'}
                      onValueChange={(value) => {
                        const parts = selectedTorsionSpring.split('-');
                        setSelectedTorsionSpring(`${parts[0]}-${parts[1]}-${value}` as TorsionSpringVariant);
                      }} className="grid grid-cols-2 gap-3">
                      <div className="relative">
                        <RadioGroupItem value="left" id="winding-left" className="peer sr-only" data-testid="radio-winding-left" />
                        <Label htmlFor="winding-left" className="flex flex-col gap-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer">
                          <div className="flex items-center gap-2"><span className="font-semibold">Left-Wound</span><Badge className="bg-red-500 text-white text-xs">Red Cone</Badge></div>
                          <span className="text-sm text-muted-foreground">Installed on the right side of center bracket</span>
                        </Label>
                      </div>
                      <div className="relative">
                        <RadioGroupItem value="right" id="winding-right" className="peer sr-only" data-testid="radio-winding-right" />
                        <Label htmlFor="winding-right" className="flex flex-col gap-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer">
                          <div className="flex items-center gap-2"><span className="font-semibold">Right-Wound</span><Badge className="bg-black text-white text-xs">Black Cone</Badge></div>
                          <span className="text-sm text-muted-foreground">Installed on the left side of center bracket</span>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  {torsionSpringInfo && (
                    <Alert className="border-primary/50 bg-primary/5">
                      <AlertDescription className="text-sm">
                        <strong>Selected:</strong> {torsionSpringInfo.label}
                        <p className="mt-1 text-muted-foreground">{torsionSpringInfo.description}</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}

            {/* Generic grouped DB variant selectors (e.g. Door Size, Finish, Colour) */}
            {hasGenericGroupedVariants && groupedDbVariants && groupedDbVariants.map((group) => {
              const allSamePrice = group.variants.every((v: any) => parseFloat(v.price as string) === parseFloat(group.variants[0].price as string));
              const showPrices = !allSamePrice || parseFloat(group.variants[0].price as string) > 0;
              return (
                <div className="mb-6" key={group.label}>
                  <h3 className="text-sm font-medium mb-3">Select {group.label}:</h3>
                  <RadioGroup
                    value={selectedGroupedVariants[group.label] || ""}
                    onValueChange={(val) => setSelectedGroupedVariants(prev => ({ ...prev, [group.label]: val }))}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
                    {group.variants.map((v: any) => (
                      <div className="relative" key={v.id}>
                        <RadioGroupItem value={v.id} id={`grouped-${v.id}`} className="peer sr-only" data-testid={`radio-grouped-${v.id}`} />
                        <Label
                          htmlFor={`grouped-${v.id}`}
                          className="flex flex-col gap-1 rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer"
                        >
                          {v.image && (
                            <img src={fixImageUrl(v.image)} alt={v.name} className="w-12 h-12 object-cover rounded mb-1" />
                          )}
                          <span className="font-semibold">{v.name}</span>
                          {v.description && (
                            <span className="text-sm text-muted-foreground">{v.description}</span>
                          )}
                          {showPrices && parseFloat(v.price as string) > 0 && (
                            <span className="text-lg font-bold text-primary whitespace-nowrap">
                              R&nbsp;{parseFloat(v.price as string).toFixed(2)}
                            </span>
                          )}
                          {v.stock <= 0 && <span className="text-xs text-destructive">Out of stock</span>}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              );
            })}

            {/* Simple DB variant grid (no groupLabel — ungrouped options) */}
            {dbVariants.length > 0 && !isTorsionSpring && !hasGenericGroupedVariants && !isGlosteelDoor && (
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-3">Select Option:</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {dbVariants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedDbVariant(selectedDbVariant === v.id ? null : v.id)}
                      className={`flex flex-col items-center gap-1 rounded-md border-2 p-3 transition-colors ${
                        selectedDbVariant === v.id ? 'border-primary bg-primary/5' : 'border-muted hover:bg-accent'
                      }`}
                      data-testid={`button-variant-${v.id}`}
                    >
                      {v.image && (
                        <img
                          src={fixImageUrl(v.image)}
                          alt={v.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <span className="text-sm font-semibold">{v.name}</span>
                      <span className="text-xs font-medium text-primary whitespace-nowrap">R&nbsp;{parseFloat(v.price).toFixed(2)}</span>
                      {v.stock <= 0 && <span className="text-xs text-destructive">Out of stock</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-baseline gap-x-2 gap-y-0 flex-wrap">
                <span className="text-4xl font-bold whitespace-nowrap" data-testid="text-product-price">
                  R&nbsp;{displayPrice}
                </span>
                <span className="text-sm text-muted-foreground">VAT inc.</span>
                {isLpGasCylinder && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedVariant === 'exchange' ? 'Exchange' : 'New Cylinder'}
                  </Badge>
                )}
                {isGlosteelDoor && (
                  <>
                    <Badge variant="secondary" className="ml-2">
                      {selectedDoorSize}
                    </Badge>
                    {selectedDoorFinish && (
                      <Badge variant="secondary" className="ml-1">
                        {selectedDoorFinish === 'smooth' ? 'Smooth' : 'Woodgrain'}
                      </Badge>
                    )}
                  </>
                )}
                {isTorsionSpring && selectedDbVariantData && (
                  <Badge variant="secondary" className="ml-2">
                    {selectedDbVariantData.name}
                  </Badge>
                )}
                {isTorsionSpring && !selectedDbVariantData && torsionSpringInfo && (
                  <Badge variant="secondary" className="ml-2">
                    {torsionSpringInfo.weight} {torsionSpringInfo.winding === 'left' ? 'Left' : 'Right'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="flex items-center gap-4 mb-8 flex-wrap">
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
                ref={addToCartButtonRef}
                size="lg"
                className="flex-1 font-semibold tracking-wide gap-2"
                disabled={isOutOfStock || (isGlosteelDoor && selectedDoorFinish === '') || (hasGenericGroupedVariants && groupedDbVariants !== null && groupedDbVariants.some(g => !selectedGroupedVariants[g.label]))}
                onClick={() => {
                  if (isLpGasCylinder && lpGasPricing) {
                    onAddToCart(product, quantity, selectedVariant, displayPrice);
                  } else if (isGlosteelDoor && glosteelPricing) {
                    if (!selectedDoorFinish) return;
                    const doorVariant = `${selectedDoorSize}-${selectedDoorFinish}` as GarageDoorVariant;
                    onAddToCart(product, quantity, doorVariant, displayPrice);
                  } else if (hasGenericGroupedVariants && groupedDbVariants) {
                    const variantLabel = groupedDbVariants.map(g => {
                      const v = g.variants.find((x: any) => x.id === selectedGroupedVariants[g.label]);
                      return v?.name || '';
                    }).filter(Boolean).join(' · ') as any;
                    onAddToCart(product, quantity, variantLabel, displayPrice);
                  } else if (selectedDbVariantData) {
                    onAddToCart(product, quantity, selectedDbVariantData.name as any, displayPrice);
                  } else if (isTorsionSpring && torsionSpringInfo) {
                    onAddToCart(product, quantity, selectedTorsionSpring, displayPrice);
                  } else {
                    onAddToCart(product, quantity);
                  }
                }}
                data-testid="button-add-to-cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {isDiscontinued ? "Discontinued" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
              </Button>

            </div>

            {/* Delivery Information */}
            <Card className="mb-4">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {category?.slug === 'lp-gas-exchange' && product.slug !== '4kg-braai-briquettes' ? (
                    // LP Gas products - Pretoria only delivery (except Braai Briquettes which ships nationwide)
                    (<>
                      <Alert className="border-primary/50 bg-primary/5">
                        <MapPin className="h-4 w-4 text-primary" />
                        <AlertDescription>
                          <strong>Pretoria Delivery Only:</strong> LP Gas products are only delivered within Pretoria at a flat rate of R50. Nationwide delivery is not available for LP Gas.
                          <br /><br />
                          <strong>Same-Day Delivery:</strong> Orders placed before 12:00 will be delivered the same day. Orders placed after 12:00 will be scheduled for the next business day. If the next day is a public holiday, delivery will be on the following business day.
                        </AlertDescription>
                      </Alert>
                      {product.slug === '48kg-exchange' && (
                        <Alert className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                          <BadgePercent className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <AlertDescription className="text-green-900 dark:text-green-100">
                            <strong>Special Offer:</strong> FREE DELIVERY on this 48KG LP Gas cylinder! Limited time promotion.
                          </AlertDescription>
                        </Alert>
                      )}
                    </>)
                  ) : (
                    // Other products - Nationwide delivery
                    (<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>)
                  )}
                  
                  {/* Divider with "Or" */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-sm font-medium text-muted-foreground">Or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  
                  {/* Pickup option - shown on all products */}
                  <Alert className="border-primary/50 bg-primary/5">
                    <Store className="h-4 w-4 text-primary" />
                    <AlertDescription>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span>
                          <strong>Pickup Available:</strong> Collect from our Wonderboom shop at Alectra Solutions, Wonderboom, Pretoria, 0182.
                        </span>
                        <a 
                          href="https://maps.app.goo.gl/St2UUGxF41jjHXKa6" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-medium whitespace-nowrap"
                          data-testid="link-get-directions"
                        >
                          <MapPin className="h-3 w-3" />
                          Get directions
                        </a>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* Payment Trust Section */}
            <Card className="mb-8">
              <CardContent className="p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Secure Payment</span>
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <SiVisa className="h-8 w-auto text-[#1434CB]" />
                      <SiMastercard className="h-8 w-auto text-[#FF5F00]" />
                      <SiApplepay className="h-8 w-auto text-foreground" />
                      <SiGooglepay className="h-8 w-auto text-foreground" />
                    </div>
                    <span className="text-xs text-muted-foreground">Paystack & Yoco</span>
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
                <ExpandableDescription 
                  description={product.description}
                  isExpanded={isDescriptionExpanded}
                  onToggle={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                />
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
        
        {/* Full-width sections below the product grid */}
        <div className="mt-12">
          {/* Frequently Bought Together */}
          <FrequentlyBoughtTogether 
            currentProductId={product.id} 
            categorySlug={category?.slug || null} 
          />
          
          {/* Happy Customers Gallery */}
          <HappyCustomersGallery />
          
          {/* Why Shop With Us */}
          <WhyShopWithUs />
          
          {/* Trade Account Benefits */}
          <TradeAccountBenefits />
        </div>
      </div>

      {/* Sticky Add to Cart Bar - Mobile Only */}
      {(() => {
        const stickyImage = dbVariantImage || (currentVariantImage ? fixImageUrl(currentVariantImage) : null) || fixImageUrl(product.imageUrl);
        const stickyVariantLabel = isLpGasCylinder
          ? (selectedVariant === 'exchange' ? 'Exchange' : 'New Cylinder')
          : isGlosteelDoor && selectedDoorFinish
          ? `${selectedDoorSize} · ${selectedDoorFinish === 'smooth' ? 'Smooth' : 'Woodgrain'}`
          : selectedDbVariantData
          ? selectedDbVariantData.name
          : isTorsionSpring && torsionSpringInfo
          ? `${torsionSpringInfo.weight} · ${torsionSpringInfo.winding === 'left' ? 'Left' : 'Right'} wind`
          : null;
        const isBarVisible = showStickyAddToCart && !isOutOfStock;
        return (
          <div
            className="fixed left-0 right-0 md:hidden z-40"
            style={{
              bottom: 64,
              transform: isBarVisible ? 'translateY(0)' : 'translateY(calc(100% + 4px))',
              transition: 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
              pointerEvents: isBarVisible ? 'auto' : 'none',
            }}
            data-testid="sticky-add-to-cart-bar"
          >
            {/* Top glow line */}
            <div
              style={{
                height: 1,
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,153,0,0.45) 30%, rgba(255,153,0,0.45) 70%, transparent 100%)',
              }}
            />
            <div
              className="bg-background/[0.97] backdrop-blur-xl border-t border-border/60"
              style={{
                boxShadow: '0 -8px 32px -4px rgba(0,0,0,0.10)',
              }}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Product thumbnail */}
                <div className="w-11 h-11 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                  <ProductImage
                    src={stickyImage}
                    alt={product.name}
                    size="small"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Name + price */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate leading-tight" data-testid="sticky-product-name">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <span className="text-base font-bold text-primary whitespace-nowrap" data-testid="sticky-product-price">
                      R&nbsp;{displayPrice}
                    </span>
                    {stickyVariantLabel && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        {stickyVariantLabel}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Add to Cart button */}
                <Button
                  size="lg"
                  className="shrink-0 gap-1.5 px-5"
                  disabled={(isGlosteelDoor && selectedDoorFinish === '') || (hasGenericGroupedVariants && groupedDbVariants !== null && groupedDbVariants.some(g => !selectedGroupedVariants[g.label]))}
                  onClick={() => {
                    if (isLpGasCylinder && lpGasPricing) {
                      onAddToCart(product, quantity, selectedVariant, displayPrice);
                    } else if (isGlosteelDoor && glosteelPricing) {
                      if (!selectedDoorFinish) return;
                      const doorVariant = `${selectedDoorSize}-${selectedDoorFinish}` as GarageDoorVariant;
                      onAddToCart(product, quantity, doorVariant, displayPrice);
                    } else if (hasGenericGroupedVariants && groupedDbVariants) {
                      const variantLabel = groupedDbVariants.map(g => {
                        const v = g.variants.find((x: any) => x.id === selectedGroupedVariants[g.label]);
                        return v?.name || '';
                      }).filter(Boolean).join(' · ') as any;
                      onAddToCart(product, quantity, variantLabel, displayPrice);
                    } else if (selectedDbVariantData) {
                      onAddToCart(product, quantity, selectedDbVariantData.name as any, displayPrice);
                    } else if (isTorsionSpring && torsionSpringInfo) {
                      onAddToCart(product, quantity, selectedTorsionSpring, displayPrice);
                    } else {
                      onAddToCart(product, quantity);
                    }
                  }}
                  data-testid="button-sticky-add-to-cart"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
