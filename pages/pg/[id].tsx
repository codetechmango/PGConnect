import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { BookingModal } from '../../components/BookingModal';
import { VirtualTourModal } from '../../components/VirtualTourModal';
import { PG, Review } from '../../types';
import { supabase, isSupabaseConfigured, fetchPropertyById, fetchUserWishlist, toggleWishlist } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/authContext';

export default function PropertyDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [pg, setPg] = useState<PG | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSharing, setSelectedSharing] = useState<'single' | 'twin' | 'triple'>('twin');
  const [isVirtualTourOpen, setIsVirtualTourOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingMode, setBookingMode] = useState<'visit' | 'escrow'>('visit');
  const [isFavorited, setIsFavorited] = useState(false);
  const [moveInDate, setMoveInDate] = useState('2025-11-05');
  const [tenureMonths, setTenureMonths] = useState<number>(11);

  // New review form state
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    async function fetchProperty() {
      setLoading(true);
      if (isSupabaseConfigured) {
        try {
          const propertyData = await fetchPropertyById(id as string);
          if (propertyData) {
            setPg(propertyData);
            if (propertyData.reviews) {
              setReviews(propertyData.reviews);
            }
          }

          // Check if favorited via wishlists
          if (user) {
            const wishlistItems = await fetchUserWishlist(user.id);
            const isFav = wishlistItems.some((item: any) => item.property_id === id || item.property?.id === id);
            setIsFavorited(isFav);
          }
        } catch (err) {
          console.error('Error loading property detail:', err);
        }
      }
      setLoading(false);
    }

    fetchProperty();
  }, [id, user]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      alert('Please sign in to save this property.');
      return;
    }
    if (!pg || !isSupabaseConfigured) {
      setIsFavorited(!isFavorited);
      return;
    }

    try {
      const nowFav = await toggleWishlist(user.id, pg.id);
      setIsFavorited(nowFav);
    } catch (e) {
      console.error('Favorite error:', e);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pg) {
      alert('Please sign in to write a review.');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingReview(true);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .insert([{
            property_id: pg.id,
            user_id: user.id,
            overall_rating: newRating,
            comment: newComment.trim(),
          }])
          .select('*, profiles(*)')
          .single();

        if (error) {
          alert(`Review submission failed: ${error.message}`);
        } else if (data) {
          const formattedRev = {
            ...data,
            rating: data.overall_rating || newRating,
          };
          setReviews([formattedRev as Review, ...reviews]);
          setNewComment('');
          alert('Thank you! Your verified review has been published.');
        }
      } catch (err: any) {
        alert(err.message || 'Error submitting review');
      }
    } else {
      const mockReview: Review = {
        id: `rev-${Date.now()}`,
        property_id: pg.id,
        user_id: user.id,
        rating: newRating,
        comment: newComment,
        created_at: new Date().toISOString(),
      };
      setReviews([mockReview, ...reviews]);
      setNewComment('');
    }
    setSubmittingReview(false);
  };

  // Pricing calculations
  const getSelectedPrice = () => {
    const base = pg?.price_per_month || 15000;
    if (selectedSharing === 'single') return Math.round(base * 1.45);
    if (selectedSharing === 'triple') return Math.round(base * 0.65);
    return base;
  };

  const currentPrice = getSelectedPrice();
  const securityDeposit = currentPrice * 2;
  const maintenanceFee = 1500;
  const couponDiscount = 1000;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="flex items-center gap-3 text-primary font-bold">
            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            <span>Loading accommodation dossier...</span>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!pg) {
    return (
      <div className="min-h-screen bg-surface flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center pt-24 px-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-container text-primary flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-3xl">home_work</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface font-headline-sm">Property Not Found</h2>
          <p className="text-sm text-on-surface-variant max-w-md mt-2">
            The requested accommodation could not be found or has been unlisted by the proprietor.
          </p>
          <Link
            href="/search"
            className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-sm"
          >
            Explore Other PGs
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const defaultImages = [
    pg.images?.[0] || 'https://images.unsplash.com/photo-1555854877-bab0e662b468?w=1200',
    pg.images?.[1] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    pg.images?.[2] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    pg.images?.[3] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800',
  ];

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
      <Head>
        <title>{pg.title} | PG Connect</title>
      </Head>

      <Navbar activeTab="explore-pgs" />

      <main className="w-full pt-20 flex-1">
        {/* SUBHEADER: BREADCRUMBS & TOP TITLE BAR */}
        <section className="bg-white border-b border-outline-variant/30 py-4 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    href="/search"
                    className="inline-flex items-center gap-1 text-xs text-on-surface-variant hover:text-primary font-semibold"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    <span>Back to Search</span>
                  </Link>
                  <span className="text-outline-variant">•</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold">
                    <span className="material-symbols-outlined text-[13px]">verified</span>
                    Verified Campus
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-[11px] font-bold">
                    <span className="material-symbols-outlined text-[13px]">bolt</span>
                    Filling Fast
                  </span>
                </div>

                <h1 className="font-headline-lg text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                  {pg.title}
                </h1>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-on-surface-variant">
                  <div className="flex items-center gap-1 text-on-surface font-bold">
                    <span className="flex items-center text-amber-500">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      <span>{pg.rating ? Number(pg.rating).toFixed(1) : '4.8'}</span>
                    </span>
                    <span className="text-on-surface-variant font-normal">
                      ({reviews.length || pg.total_reviews || 88} Verified Reviews)
                    </span>
                  </div>
                  <span className="text-outline-variant">•</span>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm text-primary">pin_drop</span>
                    <span>{pg.address || `${pg.area}, ${pg.city}`}</span>
                  </div>
                  <span className="text-outline-variant">•</span>
                  <span className="text-secondary font-semibold">
                    {pg.distance_landmark || `Convenient Metro Access in ${pg.city}`}
                  </span>
                </div>
              </div>

              {/* Action Buttons: 360 Walkthrough & Favorite */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsVirtualTourOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high text-primary hover:bg-primary-fixed text-xs font-bold shadow-xs transition-all hover:scale-[1.02]"
                >
                  <span className="material-symbols-outlined text-lg text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    360
                  </span>
                  <span>Virtual 360° Walkthrough</span>
                </button>

                <button
                  type="button"
                  onClick={handleFavoriteToggle}
                  className={`w-10 h-10 rounded-xl border border-outline-variant/40 flex items-center justify-center transition-all ${
                    isFavorited ? 'text-error bg-red-50' : 'text-on-surface-variant hover:text-error bg-white'
                  }`}
                  aria-label="Save to Wishlist"
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ fontVariationSettings: isFavorited ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    favorite
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* PHOTO BENTO GALLERY SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 grid-rows-2 gap-3 h-[320px] sm:h-[420px] md:h-[460px] rounded-2xl overflow-hidden shadow-md">
            {/* Main Facade Hero (Large Left Span) */}
            <div
              onClick={() => setIsVirtualTourOpen(true)}
              className="relative md:col-span-2 lg:col-span-3 row-span-2 group overflow-hidden bg-surface-container cursor-pointer"
            >
              <img
                src={defaultImages[0]}
                alt="Main Property View"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/70 via-transparent to-black/20 pointer-events-none"></div>
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-on-surface text-xs font-bold shadow-sm">
                <span className="material-symbols-outlined text-xs text-secondary">verified</span>
                <span>Verified Campus View</span>
              </div>
              <div className="absolute bottom-4 left-4 text-white">
                <span className="font-bold text-lg drop-shadow-sm block">{pg.title}</span>
                <p className="text-xs text-blue-100 opacity-90 drop-shadow-sm">{pg.area}, {pg.city}</p>
              </div>
            </div>

            {/* Top Tile 1: Twin Sharing Bedroom */}
            <div
              onClick={() => setIsVirtualTourOpen(true)}
              className="relative md:col-span-2 lg:col-span-2 group overflow-hidden bg-surface-container cursor-pointer hidden md:block"
            >
              <img
                src={defaultImages[1]}
                alt="Twin Sharing Bed & Workstations"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <span className="absolute bottom-2.5 left-3 text-xs font-bold text-white drop-shadow">
                Twin Sharing Bed &amp; Workstations
              </span>
            </div>

            {/* Top Tile 2: Cafeteria */}
            <div
              onClick={() => setIsVirtualTourOpen(true)}
              className="relative lg:col-span-1 group overflow-hidden bg-surface-container cursor-pointer hidden lg:block"
            >
              <img
                src={defaultImages[2]}
                alt="Mess & Cafe"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              <span className="absolute bottom-2.5 left-3 text-[11px] font-bold text-white drop-shadow">
                Mess &amp; Cafe
              </span>
            </div>

            {/* Bottom Tile 1: Washroom */}
            <div
              onClick={() => setIsVirtualTourOpen(true)}
              className="relative md:col-span-1 lg:col-span-2 group overflow-hidden bg-surface-container cursor-pointer hidden md:block"
            >
              <img
                src={defaultImages[3]}
                alt="Clean Washrooms"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              <span className="absolute bottom-2.5 left-3 text-xs font-bold text-white drop-shadow">
                Ensuite Washrooms
              </span>
            </div>

            {/* Bottom Tile 2: Action Tile */}
            <div
              onClick={() => setIsVirtualTourOpen(true)}
              className="relative md:col-span-1 lg:col-span-1 group overflow-hidden bg-primary text-white cursor-pointer flex flex-col items-center justify-center p-4 text-center hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-3xl mb-1 text-secondary-container">
                photo_library
              </span>
              <span className="font-bold text-base leading-tight text-white">+18 Photos</span>
              <span className="text-[11px] text-blue-200 mt-1">360° VR Tour</span>
            </div>
          </div>

          {/* Physical Audit Verification Strip */}
          <div className="mt-4 px-4 py-3 rounded-xl bg-surface-container-low flex flex-wrap items-center justify-between gap-3 border border-outline-variant/30">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-base">verified_user</span>
              <span className="text-xs text-on-surface">
                <strong>Physically Audited by PG Connect:</strong> Property hygiene, biometric lock integrity, and fire exits certified by Field Team.
              </span>
            </div>
            <button
              type="button"
              onClick={() => alert('45-Point Inspection Report: All safety, Wi-Fi speed (294 Mbps), kitchen hygiene, and biometric security tests passed.')}
              className="text-xs text-secondary hover:text-emerald-800 font-bold underline"
            >
              View 45-Point Inspection Report
            </button>
          </div>
        </section>

        {/* TWO-COLUMN MASTER CANVAS: DETAILS (68%) / BOOKING SIDEBAR (32%) */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ================= LEFT COLUMN ================= */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* SECTION A: Room Types & Sharing Options */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-outline-variant/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Transparent Inventory
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md">
                      Available Sharing Options
                    </h2>
                  </div>
                  <span className="text-xs text-on-surface-variant flex items-center gap-1 font-semibold">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Live Availability
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Single Private Room */}
                  <div
                    onClick={() => setSelectedSharing('single')}
                    className={`cursor-pointer p-4 rounded-2xl transition-all border flex flex-col justify-between ${
                      selectedSharing === 'single'
                        ? 'bg-surface-container-high border-primary ring-2 ring-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface text-[11px] font-bold">
                          Single Room
                        </span>
                        <span className="text-error text-[10px] font-bold">1 Bed Left</span>
                      </div>
                      <h3 className="font-bold text-sm text-on-surface">Private Master Suite</h3>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Attached Balcony, Split AC, Dedicated 1.2m Work Desk
                      </p>
                    </div>
                    <div className="mt-4 pt-3 bg-white/70 p-2.5 rounded-xl border border-outline-variant/20">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-extrabold text-primary tabular-nums">
                          ₹{Math.round((pg.price_per_month || 15000) * 1.45).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-on-surface-variant">/ month</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant block mt-0.5">
                        Security Deposit: ₹{(Math.round((pg.price_per_month || 15000) * 1.45) * 2).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Twin Sharing (Default) */}
                  <div
                    onClick={() => setSelectedSharing('twin')}
                    className={`cursor-pointer p-4 rounded-2xl transition-all border flex flex-col justify-between relative ${
                      selectedSharing === 'twin'
                        ? 'bg-surface-container-high border-primary ring-2 ring-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-3 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Most Popular
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed text-[11px] font-bold">
                          Twin Sharing
                        </span>
                        <span className="text-secondary text-[10px] font-bold">3 Beds Open</span>
                      </div>
                      <h3 className="font-bold text-sm text-on-surface">Executive Double Room</h3>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Spacious 240 sq.ft, Twin Single Storage Beds &amp; Dual Study Setup
                      </p>
                    </div>
                    <div className="mt-4 pt-3 bg-white p-2.5 rounded-xl border border-outline-variant/20">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-extrabold text-primary tabular-nums">
                          ₹{Number(pg.price_per_month || 15000).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-on-surface-variant">/ bed / mo</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant block mt-0.5">
                        Security Deposit: ₹{(Number(pg.price_per_month || 15000) * 2).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Triple Sharing */}
                  <div
                    onClick={() => setSelectedSharing('triple')}
                    className={`cursor-pointer p-4 rounded-2xl transition-all border flex flex-col justify-between ${
                      selectedSharing === 'triple'
                        ? 'bg-surface-container-high border-primary ring-2 ring-primary shadow-sm'
                        : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest text-on-surface text-[11px] font-bold">
                          Triple Sharing
                        </span>
                        <span className="text-secondary text-[10px] font-bold">Pocket Friendly</span>
                      </div>
                      <h3 className="font-bold text-sm text-on-surface">Economy Triple Room</h3>
                      <p className="text-xs text-on-surface-variant mt-1">
                        3 Beds with lockers, attached washroom, study corner
                      </p>
                    </div>
                    <div className="mt-4 pt-3 bg-white/70 p-2.5 rounded-xl border border-outline-variant/20">
                      <div className="flex items-baseline gap-1">
                        <span className="text-base font-extrabold text-primary tabular-nums">
                          ₹{Math.round((pg.price_per_month || 15000) * 0.65).toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-on-surface-variant">/ bed / mo</span>
                      </div>
                      <span className="text-[10px] text-on-surface-variant block mt-0.5">
                        Security Deposit: ₹{(Math.round((pg.price_per_month || 15000) * 0.65) * 2).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: Food & Mess Experience */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-outline-variant/30">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Chef Prepared Nutrition
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md">
                      Food &amp; Dining Schedule
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                    <span className="material-symbols-outlined text-sm">restaurant</span>
                    FSSAI Certified
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="text-xs font-bold text-primary block">Breakfast</span>
                    <span className="text-[11px] text-on-surface-variant block mb-1">7:30 AM - 9:45 AM</span>
                    <p className="text-xs text-on-surface font-medium">Idli Sambhar / Poha, Eggs, Tea &amp; Filter Coffee</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="text-xs font-bold text-primary block">Lunch</span>
                    <span className="text-[11px] text-on-surface-variant block mb-1">12:30 PM - 2:30 PM</span>
                    <p className="text-xs text-on-surface font-medium">Dal Tadka, Seasonal Sabzi, Phulkas, Rice &amp; Curd</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="text-xs font-bold text-primary block">Evening Snacks</span>
                    <span className="text-[11px] text-on-surface-variant block mb-1">5:00 PM - 6:30 PM</span>
                    <p className="text-xs text-on-surface font-medium">Samosa / Biscuits with Special Masala Chai</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="text-xs font-bold text-primary block">Dinner</span>
                    <span className="text-[11px] text-on-surface-variant block mb-1">7:30 PM - 10:00 PM</span>
                    <p className="text-xs text-on-surface font-medium">Paneer / Chicken Curry (Wed/Sun), Biryani &amp; Gulab Jamun</p>
                  </div>
                </div>
              </div>

              {/* SECTION C: Amenities Grid */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-outline-variant/30">
                <div className="mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    All-Inclusive Amenities
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md">
                    Campus Facilities &amp; Inclusions
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Col 1 */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide block">
                      Connectivity &amp; Power
                    </span>
                    <ul className="space-y-2 text-xs text-on-surface">
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">wifi</span>
                        <span><strong>300 Mbps Fiber</strong> (Dual Load Balancing)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">electric_bolt</span>
                        <span><strong>100% 24x7 Power Backup</strong> (Heavy DG Set)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">cleaning_services</span>
                        <span><strong>Daily Housekeeping</strong> &amp; linen changes</span>
                      </li>
                    </ul>
                  </div>

                  {/* Col 2 */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide block">
                      Safety &amp; Biometrics
                    </span>
                    <ul className="space-y-2 text-xs text-on-surface">
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">fingerprint</span>
                        <span><strong>Biometric Access Control</strong> at turnstiles</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">videocam</span>
                        <span><strong>64 HD CCTV Cameras</strong> (Corridors/Entry)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">shield_person</span>
                        <span><strong>24x7 Uniformed Guards</strong> on site</span>
                      </li>
                    </ul>
                  </div>

                  {/* Col 3 */}
                  <div className="space-y-2.5">
                    <span className="text-xs font-bold text-primary uppercase tracking-wide block">
                      Lifestyle &amp; Recreation
                    </span>
                    <ul className="space-y-2 text-xs text-on-surface">
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">fitness_center</span>
                        <span><strong>Rooftop Fitness Gym</strong> &amp; Yoga Area</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">local_laundry_service</span>
                        <span><strong>Commercial Washers</strong> &amp; Dryers</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-base">two_wheeler</span>
                        <span>Covered EV &amp; Two-Wheeler Parking</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SECTION D: House Rules */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-outline-variant/30">
                <div className="mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Community Standards
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md">
                    House Guidelines &amp; Policies
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-base">lock_clock</span>
                      <span className="text-xs font-bold">Gate Timings</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      24/7 biometric credential entry. Guests permitted till 9:30 PM in lounge.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-base">volume_off</span>
                      <span className="text-xs font-bold">Quiet Hours</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      11:00 PM to 6:30 AM in all corridors for quiet study &amp; sleep.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-base">smoke_free</span>
                      <span className="text-xs font-bold">No Smoking in Rooms</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      Terrace open-air zone available. Strictly non-smoking inside bedrooms.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-primary">
                      <span className="material-symbols-outlined text-base">receipt_long</span>
                      <span className="text-xs font-bold">Notice Period</span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      30 days notice required prior to check-out for full deposit refund.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION E: Verified Reviews & Real Review Submission */}
              <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-outline-variant/30 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                      Verified Residents
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md">
                      Resident Feedback &amp; Ratings
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-extrabold text-primary font-headline-lg">
                      {pg.rating ? Number(pg.rating).toFixed(1) : '4.8'}
                    </span>
                    <div className="flex flex-col">
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <span
                            key={s}
                            className="material-symbols-outlined text-sm"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-on-surface-variant">
                        Based on {reviews.length || pg.total_reviews || 88} verified stays
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score breakdown bars */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <div>
                    <span className="text-[11px] text-on-surface-variant block">Cleanliness</span>
                    <span className="text-sm font-bold text-on-surface">4.9 / 5.0</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-on-surface-variant block">Food Quality</span>
                    <span className="text-sm font-bold text-on-surface">4.7 / 5.0</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-on-surface-variant block">Wi-Fi &amp; Work</span>
                    <span className="text-sm font-bold text-on-surface">4.9 / 5.0</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-on-surface-variant block">Safety &amp; Staff</span>
                    <span className="text-sm font-bold text-on-surface">5.0 / 5.0</span>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-3">
                  {reviews.length > 0 ? (
                    reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-xs flex items-center justify-center">
                              {rev.profiles?.full_name?.charAt(0) || 'R'}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-on-surface">
                                  {rev.profiles?.full_name || 'Verified Resident'}
                                </span>
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-secondary-container text-on-secondary-container text-[10px] font-bold">
                                  <span className="material-symbols-outlined text-[10px]">verified</span>
                                  Tenant
                                </span>
                              </div>
                              <span className="text-[10px] text-on-surface-variant">
                                Stayed in {pg.title}
                              </span>
                            </div>
                          </div>

                          <div className="flex text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span
                                key={s}
                                className="material-symbols-outlined text-xs"
                                style={{ fontVariationSettings: s <= rev.rating ? "'FILL' 1" : "'FILL' 0" }}
                              >
                                star
                              </span>
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-on-surface leading-relaxed">{rev.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-surface-container-low text-center text-xs text-on-surface-variant">
                      No resident reviews published yet. Be the first to share your experience below!
                    </div>
                  )}
                </div>

                {/* Add Review Form */}
                <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-surface-container-low space-y-3">
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Write a Verified Resident Review
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant">Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="text-amber-500"
                        >
                          <span
                            className="material-symbols-outlined text-xl"
                            style={{ fontVariationSettings: star <= newRating ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            star
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Describe the rooms, food quality, Wi-Fi speed, and owner responsiveness..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl bg-surface-container-low text-xs border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container shadow-xs"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Verified Review'}
                  </button>
                </form>
              </div>
            </div>

            {/* ================= RIGHT COLUMN (STICKY BOOKING CARD) ================= */}
            <div className="lg:col-span-4 sticky top-24 space-y-4">
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-outline-variant/30 space-y-5">
                {/* Starting Rent Block */}
                <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/20">
                  <span className="text-[11px] text-on-surface-variant uppercase font-semibold block tracking-wider">
                    Monthly Rent ({selectedSharing.toUpperCase()})
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-extrabold text-primary tabular-nums font-price-lg">
                      ₹{currentPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-on-surface-variant">/ month</span>
                  </div>
                  <span className="text-[11px] text-secondary font-semibold block mt-1">
                    Zero Brokerage • FSSAI Food Included
                  </span>
                </div>

                {/* Move-in Date & Lease Tenure */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Move-in Date</label>
                    <input
                      type="date"
                      value={moveInDate}
                      onChange={(e) => setMoveInDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Lease Tenure</label>
                    <select
                      value={tenureMonths}
                      onChange={(e) => setTenureMonths(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value={1}>1 Month (Flexible Trial)</option>
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months</option>
                      <option value={11}>11 Months (Standard Agreement)</option>
                    </select>
                  </div>
                </div>

                {/* Ledger Breakdown Table */}
                <div className="pt-2 border-t border-surface-container-low space-y-2 text-xs text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>Monthly Accommodation Fee</span>
                    <span className="font-semibold text-on-surface">₹{currentPrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Maintenance &amp; High-Speed Wi-Fi</span>
                    <span className="font-semibold text-on-surface">₹{maintenanceFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Deposit (ICICI Escrow)</span>
                    <span className="font-semibold text-on-surface">₹{securityDeposit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-secondary">
                    <span>Early Bird Digital Coupon</span>
                    <span className="font-semibold">-₹{couponDiscount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-surface-container-low flex justify-between font-bold text-sm text-on-surface">
                    <span>Total Move-in Commitment</span>
                    <span className="text-primary tabular-nums">
                      ₹{(currentPrice + maintenanceFee + securityDeposit - couponDiscount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* CTA Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode('escrow');
                      setIsBookingModalOpen(true);
                    }}
                    className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">lock</span>
                    <span>Lock Bed with ₹1,000 Escrow Token</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode('visit');
                      setIsBookingModalOpen(true);
                    }}
                    className="w-full py-3 rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-[0.98]"
                  >
                    <span className="material-symbols-outlined text-base">calendar_month</span>
                    <span>Schedule Free Property Visit</span>
                  </button>
                </div>

                {/* Trust Seal Footer */}
                <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#99F6E4] flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-lg">verified_user</span>
                  <p className="text-[11px] text-[#005049] leading-tight">
                    100% refundable token. If you cancel after your physical visit, your ₹1,000 is refunded to your UPI account instantly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Booking Modal */}
      <BookingModal
        pg={pg}
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        selectedRoomType={selectedSharing}
        initialBookingType={bookingMode}
      />

      {/* Virtual Tour Modal */}
      <VirtualTourModal
        isOpen={isVirtualTourOpen}
        onClose={() => setIsVirtualTourOpen(false)}
        propertyTitle={pg.title}
      />

      <Footer />
    </div>
  );
}
