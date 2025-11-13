import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  totalReviews?: number;
}

export function StarRating({ rating, size = "md", showNumber = false, totalReviews }: StarRatingProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  // Ensure rating is a number
  const numericRating = typeof rating === 'string' ? parseFloat(rating) : rating;

  const stars = Array.from({ length: 5 }, (_, index) => {
    const starValue = index + 1;
    const isFilled = starValue <= Math.round(numericRating);

    return (
      <Star
        key={index}
        className={`${sizeClasses[size]} ${
          isFilled ? "fill-primary text-primary" : "fill-none text-muted-foreground"
        }`}
        data-testid={`star-${index + 1}`}
      />
    );
  });

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5" data-testid="star-rating">
        {stars}
      </div>
      {showNumber && (
        <span className={`${textSizes[size]} text-muted-foreground ml-1`} data-testid="text-rating-value">
          {numericRating.toFixed(1)}
          {totalReviews !== undefined && (
            <span data-testid="text-review-count"> ({totalReviews})</span>
          )}
        </span>
      )}
    </div>
  );
}
