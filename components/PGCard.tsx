import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PG } from '../types';
import { useAuth } from '../lib/authContext';
import { isSupabaseConfigured, toggleWishlist, fetchUserWishlistPropertyIds } from '../lib/supabaseClient';

interface PGCardProps {
  pg: PG;
  isFavorited?: boolean;
  onFavoriteToggle?: (pgId: string, newState: boolean) => void;
  onScheduleVisit?: (pg: PG) => void;
}

export const PGCard: React.FC<PGCardProps> = ({
  pg,
  isFavorited,
  onFavoriteToggle,
  onScheduleVisit,
}) => {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState<boolean>(() => {
    if (typeof isFavorited === 'boolean') return isFavorited;
    if (user) {
      return fetchUserWishlistPropertyIds(user.id).includes(pg.id);
    }
    return false;
  });
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    if (typeof isFavorited === 'boolean') {
      setFavorited(isFavorited);
    } else if (user) {
      setFavorited(fetchUserWishlistPropertyIds(user.id).includes(pg.id));
    }
  }, [isFavorited, user, pg.id]);

  const fallbackImage = 'https://images.unsplash.com/photo-1555854877-bab0e662b468?w=800';
  const displayImage = pg.images && pg.images.length > 0 ? pg.images[0] : fallbackImage;

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert('Please sign in to save properties to your favorites.');
      return;
    }

    if (!isSupabaseConfigured) {
      setFavorited(!favorited);
      onFavoriteToggle?.(pg.id, !favorited);
      return;
    }

    setFavoriteLoading(true);
    try {
      const nowFav = await toggleWishlist(user.id, pg.id);
      setFavorited(nowFav);
      onFavoriteToggle?.(pg.id, nowFav);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setFavoriteLoading(false);
    }
  };

  const getGenderLabel = () => {
    if (pg.gender_preference === 'male') return 'Boys PG';
    if (pg.gender_preference === 'female') return 'Girls PG';
    return 'Boys & Girls Co-living';
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group border border-outline-variant/30 hover:-translate-y-1">
      {/* 16:10 Media Container */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface-container-low">
        <Link href={`/pg/${pg.id}`} className="block w-full h-full">
          <img
            src={displayImage}
            alt={pg.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = fallbackImage;
            }}
          />
        </Link>

        {/* Top-Left Verified Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#CCFBF1]/95 text-[#005049] text-[11px] font-bold tracking-wider backdrop-blur-sm shadow-xs pointer-events-none">
          <span className="material-symbols-outlined text-[13px] text-secondary font-bold">
            verified
          </span>
          <span>Verified PG</span>
        </div>

        {/* Top-Right Favorite Heart */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={favoriteLoading}
          aria-label={favorited ? "Remove from Wishlist" : "Save to Wishlist"}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 ${
            favorited ? 'text-error' : 'text-outline hover:text-error'
          }`}
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: favorited ? "'FILL' 1" : "'FILL' 0" }}
          >
            favorite
          </span>
        </button>

        {/* Bottom Overlay Label */}
        <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-md bg-inverse-surface/85 text-white text-[11px] font-medium backdrop-blur-xs pointer-events-none">
          {getGenderLabel()}
        </div>
      </div>

      {/* Card Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating and Distance row */}
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <span className="text-xs text-on-surface-variant flex items-center gap-1 truncate max-w-[65%]">
              <span className="material-symbols-outlined text-xs text-primary">near_me</span>
              <span className="truncate">{pg.distance_landmark || `${pg.area}, ${pg.city}`}</span>
            </span>

            <span className="flex items-center gap-1 text-xs font-bold text-on-surface bg-surface-container-high px-2 py-0.5 rounded-md">
              <span className="material-symbols-outlined text-xs text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span>{pg.rating ? Number(pg.rating).toFixed(1) : '4.5'}</span>
              <span className="text-[11px] text-on-surface-variant font-normal">
                ({pg.total_reviews || 18})
              </span>
            </span>
          </div>

          {/* Title */}
          <Link href={`/pg/${pg.id}`} className="block">
            <h3 className="font-bold text-base text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-1">
              {pg.title}
            </h3>
          </Link>
          <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
            {pg.address || `${pg.area}, ${pg.city}`}
          </p>

          {/* Amenities Pills Strip */}
          <div className="flex flex-wrap gap-1.5 my-3">
            <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-medium capitalize">
              {pg.room_type} Sharing
            </span>
            {pg.amenities && pg.amenities.slice(0, 3).map((amenity, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-medium"
              >
                {amenity}
              </span>
            ))}
            {pg.amenities && pg.amenities.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md bg-surface-container-low text-on-surface-variant text-[10px] font-semibold">
                +{pg.amenities.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Card Footer Pricing & Actions */}
        <div className="pt-3 border-t border-surface-container-low flex items-center justify-between mt-auto">
          <div>
            <span className="text-[11px] text-on-surface-variant block uppercase tracking-wide">Starts at</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-extrabold text-primary tabular-nums">
                ₹{pg.price_per_month ? pg.price_per_month.toLocaleString('en-IN') : '9,500'}
              </span>
              <span className="text-xs text-on-surface-variant font-normal">/mo</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onScheduleVisit ? (
              <button
                type="button"
                onClick={() => onScheduleVisit(pg)}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1"
              >
                <span>Schedule Visit</span>
                <span className="material-symbols-outlined text-[14px]">calendar_month</span>
              </button>
            ) : (
              <Link
                href={`/pg/${pg.id}`}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1"
              >
                <span>View Details</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
