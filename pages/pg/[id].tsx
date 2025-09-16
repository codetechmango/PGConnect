import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import { supabase, getCurrentUser } from '../../lib/supabaseClient';
import { PG, Review, User } from '../../types';
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

  useEffect(() => {
    if (id) {
      loadPGDetails();
      loadReviews();
    }
  }, [id]);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { user } = await getCurrentUser();
    setUser(user);
  };

  const loadPGDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('pgs')
        .select(`
          *,
          owner:profiles(id, full_name, email, phone)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPg(data);
    } catch (error: any) {
      console.error('Error loading PG details:', error);
      setError('Failed to load PG details');
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          user:profiles(id, full_name)
        `)
        .eq('pg_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error: any) {
      console.error('Error loading reviews:', error);
    }
  };

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

      const booking = await response.json();
      alert('Booking request submitted successfully! The owner will contact you soon.');
      
    } catch (error: any) {
      console.error('Booking error:', error);
      alert(error.message || 'Failed to create booking');
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
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'PG not found'}
          </h2>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
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
        {/* Image Gallery */}
        <div className="relative h-96 md:h-[500px] bg-gray-200">
          {pg.images && pg.images.length > 0 ? (
            <>
              <Image
                src={pg.images[currentImageIndex]}
                alt={pg.title}
                fill
                className="object-cover"
                priority
              />
              
              {pg.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                  >
                    <ChevronLeftIcon className="h-6 w-6" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                  >
                    <ChevronRightIcon className="h-6 w-6" />
                  </button>
                  
                  {/* Image indicators */}
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
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
              <div className="text-center text-gray-600">
                <div className="text-6xl mb-4">🏠</div>
                <div>No Images Available</div>
              </div>
            </div>
          )}

          {/* Action buttons overlay */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={toggleFavorite}
              className="p-3 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all"
            >
              {isFavorited ? (
                <HeartIconSolid className="h-6 w-6 text-red-500" />
              ) : (
                <HeartIcon className="h-6 w-6 text-gray-600" />
              )}
            </button>
            <button className="p-3 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all">
              <ShareIcon className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Basic Info */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{pg.title}</h1>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPinIcon className="h-5 w-5 mr-1" />
                      <span>{pg.area}, {pg.city}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <RatingStars rating={pg.rating || 0} showValue />
                      {pg.total_reviews > 0 && (
                        <span className="text-sm text-gray-500">
                          ({pg.total_reviews} reviews)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-green-600 flex items-center">
                      <CurrencyRupeeIcon className="h-8 w-8" />
                      {formatPrice(pg.price_per_month)}
                    </div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t">
                  <div className="text-center">
                    <UserGroupIcon className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                    <div className="text-sm font-medium">{getRoomTypeLabel(pg.room_type)}</div>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl mb-1 block">
                      {pg.gender_preference === 'male' ? '👨' : pg.gender_preference === 'female' ? '👩' : '👥'}
                    </span>
                    <div className="text-sm font-medium capitalize">{pg.gender_preference}</div>
                  </div>
                  <div className="text-center">
                    <CheckCircleIcon className="h-6 w-6 mx-auto text-green-500 mb-1" />
                    <div className="text-sm font-medium">{pg.available_rooms} Available</div>
                  </div>
                  <div className="text-center">
                    <CalendarIcon className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                    <div className="text-sm font-medium">Immediate</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About this PG</h2>
                <p className="text-gray-700 whitespace-pre-line">{pg.description}</p>
              </div>

              {/* Address */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
                <div className="flex items-start space-x-3">
                  <MapPinIcon className="h-6 w-6 text-gray-400 mt-1" />
                  <div>
                    <p className="text-gray-700">{pg.address}</p>
                    <p className="text-sm text-gray-500 mt-1">{pg.area}, {pg.city}</p>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {pg.amenities?.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reviews */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Reviews {reviews.length > 0 && `(${reviews.length})`}
                </h2>
                
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.slice(0, 5).map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="font-medium text-gray-900">
                              {review.user?.full_name || 'Anonymous'}
                            </div>
                            <RatingStars rating={review.rating} size="sm" />
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No reviews yet. Be the first to review!</p>
                )}
              </div>
            </div>

            {/* Booking Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <div className="text-center mb-6">
                  <div className="text-2xl font-bold text-green-600 flex items-center justify-center">
                    <CurrencyRupeeIcon className="h-6 w-6" />
                    {formatPrice(pg.price_per_month)}
                  </div>
                  <div className="text-sm text-gray-500">per month</div>
                </div>

                <div className="space-y-4 mb-6">
                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading || pg.available_rooms === 0}
                    className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {bookingLoading ? 'Processing...' : 'Book Now'}
                  </button>

                  {pg.owner?.phone && (
                    <a
                      href={`tel:${pg.owner.phone}`}
                      className="w-full py-3 border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center"
                    >
                      <PhoneIcon className="h-5 w-5 mr-2" />
                      Call Owner
                    </a>
                  )}
                </div>

                {/* Owner Info */}
                {pg.owner && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">Owner Details</h3>
                    <div className="text-sm text-gray-600">
                      <p>{pg.owner.full_name}</p>
                      <p>{pg.owner.email}</p>
                      {pg.owner.phone && <p>{pg.owner.phone}</p>}
                    </div>
                  </div>
                )}

                {/* Quick Info */}
                <div className="border-t pt-4 mt-4">
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available Rooms:</span>
                      <span className="font-medium">{pg.available_rooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room Type:</span>
                      <span className="font-medium">{getRoomTypeLabel(pg.room_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gender:</span>
                      <span className="font-medium capitalize">{pg.gender_preference}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
