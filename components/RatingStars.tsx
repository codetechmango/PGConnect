import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface RatingStarsProps {
  rating: number;
  maxRating?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showValue?: boolean;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
  showCount?: number;
  variant?: 'default' | 'compact' | 'detailed';
}

export default function RatingStars({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = false,
  interactive = false,
  onRatingChange,
  className = '',
  showCount,
  variant = 'default'
}: RatingStarsProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const handleStarClick = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating: number) => {
    // Could add hover preview functionality here
  };

  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= maxRating; i++) {
      const isFilled = i <= Math.floor(rating);
      const isHalfFilled = i === Math.ceil(rating) && rating % 1 !== 0;
      
      stars.push(
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => handleStarClick(i)}
          onMouseEnter={() => interactive && handleStarHover(i)}
          className={`relative group transition-all duration-200 ${
            interactive 
              ? 'cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded-sm' 
              : 'cursor-default'
          }`}
          aria-label={`Rate ${i} out of ${maxRating} stars`}
        >
          {isFilled ? (
            <StarIcon className={`${sizeClasses[size]} text-yellow-400 drop-shadow-sm ${
              interactive ? 'group-hover:text-yellow-500' : ''
            }`} />
          ) : isHalfFilled ? (
            <div className="relative">
              <StarOutlineIcon className={`${sizeClasses[size]} text-gray-300`} />
              <div 
                className="absolute inset-0 overflow-hidden transition-all duration-200"
                style={{ width: `${(rating % 1) * 100}%` }}
              >
                <StarIcon className={`${sizeClasses[size]} text-yellow-400 drop-shadow-sm`} />
              </div>
            </div>
          ) : (
            <StarOutlineIcon className={`${sizeClasses[size]} ${
              interactive 
                ? 'text-gray-300 group-hover:text-yellow-300' 
                : 'text-gray-300'
            }`} />
          )}
        </button>
      );
    }
    
    return stars;
  };

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center space-x-1 ${className}`}>
        <StarIcon className={`${sizeClasses[size]} text-yellow-400`} />
        <span className={`${textSizeClasses[size]} font-medium text-gray-900`}>
          {rating.toFixed(1)}
        </span>
        {showCount && (
          <span className={`${textSizeClasses[size]} text-gray-500`}>
            ({showCount})
          </span>
        )}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`flex flex-col space-y-1 ${className}`}>
        <div className="flex items-center space-x-0.5">
          {renderStars()}
        </div>
        <div className="flex items-center space-x-2">
          {showValue && (
            <span className={`${textSizeClasses[size]} font-semibold text-gray-900`}>
              {rating.toFixed(1)} out of {maxRating}
            </span>
          )}
          {showCount && (
            <span className={`${textSizeClasses[size]} text-gray-500`}>
              Based on {showCount} review{showCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-0.5">
        {renderStars()}
      </div>
      {(showValue || showCount) && (
        <div className="flex items-center space-x-1">
          {showValue && (
            <span className={`${textSizeClasses[size]} font-medium text-gray-900`}>
              {rating.toFixed(1)}
            </span>
          )}
          {showCount && (
            <span className={`${textSizeClasses[size]} text-gray-500`}>
              ({showCount} review{showCount !== 1 ? 's' : ''})
            </span>
          )}
        </div>
      )}
    </div>
  );
}
