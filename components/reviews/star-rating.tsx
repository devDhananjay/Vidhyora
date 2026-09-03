import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  rating: number;
  size?: "sm" | "md" | "lg";
  showNumber?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
};

const sizeClasses = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

export function StarRating({
  rating,
  size = "md",
  showNumber = false,
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(value);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => {
        const filled = star <= Math.round(rating);
        const partial = !filled && star <= Math.ceil(rating);

        return (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            disabled={!interactive}
            className={cn(
              "relative",
              interactive && "cursor-pointer hover:scale-110 transition-transform",
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                filled && "fill-yellow-400 text-yellow-400",
                partial && "fill-yellow-200 text-yellow-400",
                !filled && !partial && "fill-none text-gray-300",
              )}
            />
          </button>
        );
      })}
      {showNumber && (
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
