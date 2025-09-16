import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { supabase, getCurrentUser } from '../../lib/supabaseClient';
import { PG, Review } from '../../types';
import { User } from '@supabase/supabase-js';
import RatingStars from '../../components/RatingStars';
import {
  MapPinIcon,
  CurrencyRupeeIcon,
  UserGroupIcon,
  HeartIcon,
  ShareIcon,
  PhoneIcon,
  CalendarIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

export default function PGDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [pg, setPg] = useState<PG | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const loadPGDetails = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    
    try {
      const { data, error: pgError } = await supabase
        .from('pgs')
        .select(`
          *,
          owner:profiles(id, full_name, email, phone)
        `)
        .eq('id', id)
        .single();

      if (pgError) throw pgError;
      setPg(data);
    } catch (error) {
      console.error('Error loading PG details:', error);
      setError('Failed to load PG details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReviews = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    
    try {
      const { data, error: reviewsError } = await supabase
        .from('reviews')
        .select(`
          *,
          user:profiles(id, full_name)
        `)
        .eq('pg_id', id)
        .order('created_at', { ascending: false });

      if (reviewsError) throw reviewsError;
      setReviews(data || []);
    } catch (_error) {
      console.error('Error loading reviews:', _error);
    }
  }, [id]);

  const checkUser = useCallback(async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
    } catch (_error) {
      // User not signed in
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadPGDetails();
      loadReviews();
    }
  }, [id, loadPGDetails, loadReviews]);

  useEffect(() => {
    checkUser();
  }, [checkUser]);

  const handleBooking = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }

    setBookingLoading(true);
    try {
      const response = await fetch('/api/createBooking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pg_id: id,
          user_id: user.id,
          check_in_date: new Date().toISOString().split('T')[0],
          total_amount: pg?.price_per_month || 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create booking');
      }

      await response.json();
      alert('Booking request submitted successfully! The owner will contact you soon.');
      
    } catch (error) {
      console.error('Booking error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create booking');
    } finally {
      setBookingLoading(false);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      router.push('/auth/signin');
      return;
    }
    
    setIsFavorited(!isFavorited);
    // TODO: Implement favorites API
  };

  const nextImage = () => {
    if (pg?.images && pg.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === pg.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (pg?.images && pg.images.length > 0) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? pg.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !pg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">PG Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The PG you&apos;re looking for doesn&apos;t exist.'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{pg.title} - PG Finder</title>
        <meta name="description" content={pg.description} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Image Gallery */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
            <div className="relative h-96 md:h-[500px]">
              {pg.images && pg.images.length > 0 ? (
                <>
                  <Image
                    src={pg.images[currentImageIndex]}
                    alt={`${pg.title} - Image ${currentImageIndex + 1}`}
                    fill
                    className="object-cover"
                  />
                  {pg.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-75 rounded-full shadow-md hover:bg-opacity-100 transition-all"
                      >
                        <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-white bg-opacity-75 rounded-full shadow-md hover:bg-opacity-100 transition-all"
                      >
                        <ChevronRightIcon className="h-6 w-6 text-gray-700" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {pg.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentImageIndex(index)}
                            className={`w-3 h-3 rounded-full transition-all ${
                              index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No images available</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Header */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{pg.title}</h1>
                    <div className="flex items-center space-x-4 text-gray-600">
                      <div className="flex items-center space-x-1">
                        <MapPinIcon className="h-5 w-5" />
                        <span>{pg.area}, {pg.city}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <RatingStars rating={pg.rating} size="sm" />
                        <span className="text-sm">({pg.total_reviews} reviews)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleFavorite}
                      className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      {isFavorited ? (
                        <HeartIconSolid className="h-6 w-6 text-red-500" />
                      ) : (
                        <HeartIcon className="h-6 w-6 text-gray-600" />
                      )}
                    </button>
                    <button className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                      <ShareIcon className="h-6 w-6 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
                    <UserGroupIcon className="h-4 w-4" />
                    <span className="capitalize">{pg.room_type} sharing</span>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm">
                    <CheckCircleIcon className="h-4 w-4" />
                    <span className="capitalize">{pg.gender_preference} only</span>
                  </div>
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-sm">
                    <CalendarIcon className="h-4 w-4" />
                    <span>{pg.available_rooms} rooms available</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About this PG</h2>
                <p className="text-gray-700 leading-relaxed">{pg.description}</p>
              </div>

              {/* Amenities */}
              {pg.amenities && pg.amenities.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {pg.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-2 text-gray-700">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Reviews ({reviews.length})</h2>
                
                {reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {review.user?.full_name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-gray-900">
                                {review.user?.full_name || 'Anonymous User'}
                              </h4>
                              <RatingStars rating={review.rating} size="sm" />
                            </div>
                            <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                            <p className="text-sm text-gray-500 mt-2">
                              {new Date(review.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <StarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No reviews yet. Be the first to review this PG!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Booking Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="flex items-center space-x-1">
                        <CurrencyRupeeIcon className="h-6 w-6 text-gray-600" />
                        <span className="text-3xl font-bold text-gray-900">
                          {pg.price_per_month.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-600">per month</p>
                    </div>
                  </div>

                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading || pg.available_rooms === 0}
                    className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {bookingLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Booking...
                      </div>
                    ) : pg.available_rooms === 0 ? (
                      'No Rooms Available'
                    ) : (
                      'Book Now'
                    )}
                  </button>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-600">
                      You won&apos;t be charged yet. The owner will contact you to confirm.
                    </p>
                  </div>
                </div>

                {/* Contact Card */}
                {pg.owner && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Owner</h3>
                    
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-lg">
                          {pg.owner.full_name?.[0]?.toUpperCase() || 'O'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {pg.owner.full_name || 'PG Owner'}
                        </h4>
                        <p className="text-sm text-gray-600">Property Owner</p>
                      </div>
                    </div>

                    {pg.owner.phone && (
                      <a
                        href={`tel:${pg.owner.phone}`}
                        className="flex items-center justify-center space-x-2 w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <PhoneIcon className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-700">Call Owner</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Location Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                  <div className="space-y-2">
                    <p className="text-gray-700">{pg.address}</p>
                    <p className="text-gray-600">{pg.area}, {pg.city}</p>
                  </div>
                  
                  {(pg.latitude && pg.longitude) && (
                    <button className="mt-4 w-full py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      View on Map
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}