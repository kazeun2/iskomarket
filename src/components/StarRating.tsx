import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from './ui/utils';

interface StarRatingProps {
  rating: number;
  totalRatings?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showText?: boolean;
  className?: string;
}

export function StarRating({ 
  rating, 
  totalRatings, 
  size = 'md', 
  interactive = false, 
  onRatingChange,
  showText = true,
  className 
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);

  // Ensure rating has a valid default value
  const safeRating = rating ?? 0;

  const sizeClasses = {
    xs: 'h-2.5 w-2.5',
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const handleStarClick = (starRating: number) => {
    if (!interactive) return;
    setSelectedRating(starRating);
    onRatingChange?.(starRating);
  };

  const handleStarHover = (starRating: number) => {
    if (!interactive) return;
    setHoverRating(starRating);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverRating(0);
  };

  const currentRating = interactive ? (hoverRating || selectedRating || safeRating) : safeRating;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.floor(currentRating);
          const isHalfFilled = star === Math.ceil(currentRating) && currentRating % 1 !== 0;
          
          return (
            <div key={star} className="relative">
              <Star
                className={cn(
                  sizeClasses[size],
                  interactive ? "cursor-pointer transition-colors hover:scale-110" : "",
                  "text-gray-300"
                )}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
              />
              {(isFilled || isHalfFilled) && (
                <Star
                  className={cn(
                    sizeClasses[size],
                    interactive ? "cursor-pointer transition-colors hover:scale-110" : "",
                    "absolute inset-0 text-yellow-400 fill-current"
                  )}
                  style={isHalfFilled ? { clipPath: 'inset(0 50% 0 0)' } : {}}
                  onClick={() => handleStarClick(star)}
                  onMouseEnter={() => handleStarHover(star)}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {showText && (
        <div className={cn("flex items-center gap-1", textSizeClasses[size])}>
          <span className="text-gray-600">{safeRating.toFixed(1)}</span>
          {totalRatings !== undefined && (
            <span className="text-gray-400">({totalRatings})</span>
          )}
        </div>
      )}
    </div>
  );
}
