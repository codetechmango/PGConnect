import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PG } from '../types';
import RatingStars from './RatingStars';
import { 
  MapPinIcon, 
  HeartIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  WifiIcon,
  CheckBadgeIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface PGCardProps {
  pg: PG;
  onFavoriteToggle?: (pgId: string, isFavorited: boolean) => void;
  isFavorited?: boolean;
  variant?: 'default' | 'compact' | 'featured';
}

export default function PGCard({ 
  pg, 
  onFavoriteToggle, 
  isFavorited = false, 
  variant = 'default' 
}: PGCardProps) {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [localFavorited, setLocalFavorited] = useState(isFavorited);
  const [isHovered, setIsHovered] = useState(false);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newFavorited = !localFavorited;
    setLocalFavorited(newFavorited);
    onFavoriteToggle?.(pg.id, newFavorited);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getRoomTypeLabel = (roomType: string) => {
    const labels = {
      'single': 'Single Room',
      'double': 'Double Sharing',
      'triple': 'Triple Sharing',
      'dormitory': 'Dormitory'
    };
    return labels[roomType as keyof typeof labels] || roomType;
  };

  const getGenderIcon = (genderPreference: string) => {
    switch (genderPreference) {
      case 'male':
        return '👨';
      case 'female':
        return '👩';
      default:
        return '👥';
    }
  };

  const getAmenityIcon = (amenity: string) => {
    if (amenity.toLowerCase().includes('wifi')) return <WifiIcon className="h-3 w-3" />;
    return <CheckBadgeIcon className="h-3 w-3" />;
  };

  if (variant === 'compact') {
    return (
      <Link href={`/pg/${pg.id}`}>
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-gray-200">
          <div className="flex">
            {/* Compact Image */}
            <div className="relative w-24 h-24 bg-gray-200 flex-shrink-0">
              {pg.images && pg.images.length > 0 && !imageError ? (
                <Image
                  src={pg.images[0]}
                  alt={pg.title}
                  fill
                  className="object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <span className="text-2xl">🏠</span>
                </div>
              )}
            </div>
            
            {/* Compact Content */}
            <div className="flex-1 p-3">
              <h4 className="font-medium text-gray-900 text-sm truncate">{pg.title}</h4>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <MapPinIcon className="h-3 w-3 mr-1" />
                <span className="truncate">{pg.area}, {pg.city}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-green-600 font-semibold text-sm">
                  {formatPrice(pg.price_per_month)}<span className="text-xs text-gray-500">/mo</span>
                </span>
                <RatingStars rating={pg.rating || 0} size="xs" variant="compact" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/pg/${pg.id}`}>
      <div 
        className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100 hover:border-gray-200 ${
          variant === 'featured' ? 'ring-2 ring-blue-500 ring-opacity-20' : ''
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section */}
        <div className="relative h-56 bg-gray-200 overflow-hidden">
          {pg.images && pg.images.length > 0 && !imageError ? (
            <Image
              src={pg.images[0]}
              alt={pg.title}
              fill
              className={`object-cover transition-all duration-500 ${
                isHovered ? 'scale-110' : 'scale-100'
              } ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsImageLoading(false)}
              onError={() => {
                setImageError(true);
                setIsImageLoading(false);
              }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <div className="text-5xl mb-3">🏠</div>
                <div className="text-sm font-medium">No Image Available</div>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {isImageLoading && !imageError && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Top Row - Badges and Favorite */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
            <div className="flex flex-col space-y-2">
              {/* Featured Badge */}
              {variant === 'featured' && (
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                  ✨ Featured
                </span>
              )}
              
              {/* Available Rooms Badge */}
              {pg.available_rooms > 0 ? (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm">
                  {pg.available_rooms} room{pg.available_rooms > 1 ? 's' : ''} available
                </span>
              ) : (
                <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm">
                  Fully occupied
                </span>
              )}
            </div>

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg group/fav"
              aria-label="Add to favorites"
            >
              {localFavorited ? (
                <HeartIconSolid className="h-5 w-5 text-red-500" />
              ) : (
                <HeartIcon className="h-5 w-5 text-gray-600 group-hover/fav:text-red-500" />
              )}
            </button>
          </div>

          {/* Bottom Row - Quick View */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
              <EyeIcon className="h-5 w-5 text-gray-700" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
              {pg.title}
            </h3>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPinIcon className="h-4 w-4 mr-1.5 flex-shrink-0 text-blue-500" />
              <span className="truncate font-medium">{pg.area}, {pg.city}</span>
            </div>
          </div>

          {/* Price and Room Type */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <CurrencyRupeeIcon className="h-6 w-6 text-green-600" />
              <span className="text-2xl font-bold text-green-600">{formatPrice(pg.price_per_month)}</span>
              <span className="text-sm text-gray-500 ml-1 font-medium">/month</span>
            </div>
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border">
              <UserGroupIcon className="h-4 w-4 mr-1.5" />
              <span className="font-medium">{getRoomTypeLabel(pg.room_type)}</span>
            </div>
          </div>

          {/* Rating and Gender */}
          <div className="flex items-center justify-between mb-4">
            <RatingStars 
              rating={pg.rating || 0} 
              showValue 
              showCount={pg.total_reviews}
              size="sm"
            />
            
            <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border">
              <span className="mr-2">{getGenderIcon(pg.gender_preference)}</span>
              <span className="capitalize font-medium">{pg.gender_preference}</span>
            </div>
          </div>

          {/* Amenities */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {pg.amenities?.slice(0, 3).map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-medium border border-blue-200"
                >
                  {getAmenityIcon(amenity)}
                  <span className="ml-1">{amenity}</span>
                </span>
              ))}
              {pg.amenities && pg.amenities.length > 3 && (
                <span className="inline-flex items-center text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg font-medium border border-gray-200">
                  +{pg.amenities.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Description Preview */}
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {pg.description}
          </p>

          {/* Call to Action */}
          <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="text-blue-600 text-sm font-medium flex items-center">
              <span>View Details</span>
              <svg className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
