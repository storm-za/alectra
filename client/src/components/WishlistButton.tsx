import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  showLabel?: boolean;
}

export function WishlistButton({ productId, className, size = "icon", showLabel = false }: WishlistButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<{ id: string } | null>({
    queryKey: ["/api/auth/me"],
    select: (data: any) => data?.user || null,
  });

  const { data: wishlistIds = [] } = useQuery<string[]>({
    queryKey: ["/api/user/wishlist/ids"],
    enabled: !!user,
  });

  const isInWishlist = wishlistIds.includes(productId);

  const addMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/user/wishlist/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/wishlist/ids"] });
      toast({
        title: "Added to Wishlist",
        description: "Item saved to your wishlist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add item to wishlist",
        variant: "destructive",
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/user/wishlist/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/wishlist/ids"] });
      toast({
        title: "Removed from Wishlist",
        description: "Item removed from your wishlist",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove item from wishlist",
        variant: "destructive",
      });
    },
  });

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save items to your wishlist",
      });
      return;
    }

    if (isInWishlist) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  };

  const isPending = addMutation.isPending || removeMutation.isPending;

  if (showLabel) {
    return (
      <Button
        variant={isInWishlist ? "default" : "outline"}
        size={size === "icon" ? "default" : size}
        onClick={handleClick}
        disabled={isPending}
        className={cn("gap-2", className)}
        data-testid={`button-wishlist-${productId}`}
      >
        <Heart 
          className={cn(
            "h-4 w-4 transition-colors",
            isInWishlist && "fill-current"
          )} 
        />
        {isInWishlist ? "Saved" : "Save"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      disabled={isPending}
      className={cn(
        "rounded-full",
        isInWishlist && "text-red-500",
        className
      )}
      data-testid={`button-wishlist-${productId}`}
    >
      <Heart 
        className={cn(
          "h-5 w-5 transition-colors",
          isInWishlist && "fill-current"
        )} 
      />
    </Button>
  );
}
