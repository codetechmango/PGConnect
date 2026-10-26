import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { PGCard } from '../components/PGCard';
import { BookingModal } from '../components/BookingModal';
import { PG } from '../types';
import { fetchProperties, isSupabaseConfigured } from '../lib/supabaseClient';

export default function SearchPage() {
  const router = useRouter();
  const { q, city, gender, room_type, minPrice, maxPrice } = router.query;

  const [allPgs, setAllPgs] = useState<PG[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPgForVisit, setSelectedPgForVisit] = useState<PG | null>(null);

  // Filters State
  const [searchLocation, setSearchLocation] = useState<string>((q as string) || (city as string) || '');
  const [selectedGender, setSelectedGender] = useState<string>((gender as string) || 'all');
  const [radiusKm, setRadiusKm] = useState<number>(3);
  const [priceMin, setPriceMin] = useState<number>(minPrice ? Number(minPrice) : 0);
  const [priceMax, setPriceMax] = useState<number>(maxPrice ? Number(maxPrice) : 25000);
  const [superVerifiedOnly, setSuperVerifiedOnly] = useState<boolean>(true);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState<string[]>(
    room_type ? [room_type as string] : []
  );
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('recommended');

  // Sync from router query
  useEffect(() => {
    if (q || city) {
      setSearchLocation((q as string) || (city as string) || '');
    }
    if (gender) {
      setSelectedGender(gender as string);
    }
    if (room_type) {
      setSelectedRoomTypes([room_type as string]);
    }
    if (minPrice) {
      setPriceMin(Number(minPrice));
    }
  }, [q, city, gender, room_type, minPrice]);

  // Fetch properties from Supabase
  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      if (isSupabaseConfigured) {
        try {
          const data = await fetchProperties();
          if (data) {
            setAllPgs(data);
          }
        } catch (err) {
          console.error('Error querying Supabase listings:', err);
        }
      }
      setLoading(false);
    }

    fetchListings();
  }, []);

  // Filter and Sort Logic
  const filteredProperties = useMemo(() => {
    let result = [...allPgs];

    // Location / Query search
    if (searchLocation.trim()) {
      const query = searchLocation.toLowerCase().trim();
      result = result.filter(
        (pg) =>
          pg.city?.toLowerCase().includes(query) ||
          pg.area?.toLowerCase().includes(query) ||
          pg.title?.toLowerCase().includes(query) ||
          pg.address?.toLowerCase().includes(query)
      );
    }

    // Gender filter
    if (selectedGender !== 'all') {
      result = result.filter((pg) => {
        if (selectedGender === 'male') return pg.gender_preference === 'male' || pg.gender_preference === 'any';
        if (selectedGender === 'female') return pg.gender_preference === 'female' || pg.gender_preference === 'any';
        if (selectedGender === 'coliving') return pg.gender_preference === 'any';
        return true;
      });
    }

    // Price Range Filter
    if (priceMin > 0) {
      result = result.filter((pg) => pg.price_per_month >= priceMin);
    }
    if (priceMax) {
      result = result.filter((pg) => pg.price_per_month <= priceMax);
    }

    // Room Types
    if (selectedRoomTypes.length > 0) {
      result = result.filter((pg) => selectedRoomTypes.includes(pg.room_type));
    }

    // Amenities
    if (selectedAmenities.length > 0) {
      result = result.filter((pg) => {
        if (!pg.amenities) return false;
        return selectedAmenities.every((amenity) =>
          pg.amenities.some((a) => a.toLowerCase().includes(amenity.toLowerCase()))
        );
      });
    }

    // Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => a.price_per_month - b.price_per_month);
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => b.price_per_month - a.price_per_month);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [allPgs, searchLocation, selectedGender, priceMin, priceMax, selectedRoomTypes, selectedAmenities, sortBy]);

  const toggleRoomType = (type: string) => {
    if (selectedRoomTypes.includes(type)) {
      setSelectedRoomTypes(selectedRoomTypes.filter((t) => t !== type));
    } else {
      setSelectedRoomTypes([...selectedRoomTypes, type]);
    }
  };

  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleResetFilters = () => {
    setSearchLocation('');
    setSelectedGender('all');
    setPriceMax(25000);
    setSelectedRoomTypes([]);
    setSelectedAmenities([]);
    setSuperVerifiedOnly(true);
    setRadiusKm(3);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
      <Head>
        <title>Explore Verified PGs &amp; Hostels | PG Connect</title>
      </Head>

      <Navbar activeTab="search" />

      <main className="w-full pt-20 flex-1">
        {/* SUBHEADER RESULTS SUMMARY & ACTIVE CHIPS */}
        <section className="bg-white border-b border-outline-variant/30 py-4 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-base sm:text-lg text-on-surface font-headline-sm">
                  Showing <strong className="text-primary font-extrabold">{filteredProperties.length}</strong> Verified PGs
                </span>
                {searchLocation && (
                  <span className="text-on-surface-variant text-sm font-medium">
                    in {searchLocation}
                  </span>
                )}
                <span className="text-outline-variant hidden sm:inline">|</span>

                {/* Active Removable Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {searchLocation && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold">
                      {searchLocation}
                      <button
                        type="button"
                        onClick={() => setSearchLocation('')}
                        className="material-symbols-outlined text-xs hover:opacity-75"
                      >
                        close
                      </button>
                    </span>
                  )}
                  {selectedGender !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold capitalize">
                      {selectedGender === 'male' ? 'Boys PG' : selectedGender === 'female' ? 'Girls PG' : 'Co-living'}
                      <button
                        type="button"
                        onClick={() => setSelectedGender('all')}
                        className="material-symbols-outlined text-xs hover:opacity-75"
                      >
                        close
                      </button>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-semibold">
                    Up to ₹{priceMax.toLocaleString('en-IN')}
                  </span>
                  {selectedRoomTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold capitalize"
                    >
                      {type} Room
                      <button
                        type="button"
                        onClick={() => toggleRoomType(type)}
                        className="material-symbols-outlined text-xs hover:opacity-75"
                      >
                        close
                      </button>
                    </span>
                  ))}
                  {selectedAmenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className="material-symbols-outlined text-xs hover:opacity-75"
                      >
                        close
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                <span className="text-xs text-on-surface-variant font-medium whitespace-nowrap">Sort By:</span>
                <div className="relative inline-block">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-surface-container-low text-on-surface font-semibold text-xs py-2 pl-3 pr-8 rounded-xl border border-outline-variant/30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="recommended">Recommended (Verified First)</option>
                    <option value="price_asc">Rent: Low to High</option>
                    <option value="price_desc">Rent: High to Low</option>
                    <option value="rating">Highest Rated (4.5+)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-2.5 text-on-surface-variant pointer-events-none text-base">
                    expand_more
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 12-COLUMN DISCOVERY CANVAS: FILTERS SIDEBAR + LISTINGS */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT STICKY FILTER SIDEBAR (3-4 cols) */}
            <aside className="lg:col-span-4 xl:col-span-3 sticky top-24 space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 space-y-5 max-h-[calc(100vh-120px)] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-surface-container-low">
                  <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-base text-primary">filter_alt</span>
                    <span>Filters</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Reset All
                  </button>
                </div>

                {/* SuperVerified Toggle Banner */}
                <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#99F6E4] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-xl">verified</span>
                    <div>
                      <span className="text-xs font-bold text-on-surface block">SuperVerified™</span>
                      <span className="text-[10px] text-on-surface-variant block">100% physically audited</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={superVerifiedOnly}
                    onChange={(e) => setSuperVerifiedOnly(e.target.checked)}
                    className="w-4 h-4 accent-secondary rounded cursor-pointer"
                  />
                </div>

                {/* Location Search Bar in Sidebar */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    City or Area
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Koramangala, Delhi..."
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="w-full h-9 pl-3 pr-8 rounded-xl bg-surface-container-low text-xs border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {searchLocation && (
                      <button
                        type="button"
                        onClick={() => setSearchLocation('')}
                        className="absolute right-2 top-2 text-on-surface-variant hover:text-on-surface"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Radius Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      Search Radius
                    </span>
                    <span className="text-xs text-secondary font-bold">Within {radiusKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-secondary"
                  />
                  <div className="flex justify-between text-[10px] text-on-surface-variant font-medium">
                    <span>1 km</span>
                    <span>5 km</span>
                    <span>10 km</span>
                    <span>15 km</span>
                  </div>
                </div>

                {/* Gender Preference Radio Grid */}
                <div className="space-y-2 pt-1 border-t border-surface-container-low">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                    Gender Preference
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'male', label: 'Boys PG' },
                      { id: 'female', label: 'Girls PG' },
                      { id: 'coliving', label: 'Co-Living' },
                      { id: 'all', label: 'All' },
                    ].map((g) => (
                      <label
                        key={g.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                          selectedGender === g.id
                            ? 'bg-primary-fixed/40 border-primary text-primary'
                            : 'bg-surface-container-low border-transparent text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender_filter"
                          checked={selectedGender === g.id}
                          onChange={() => setSelectedGender(g.id)}
                          className="accent-primary"
                        />
                        <span>{g.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Monthly Rent Slider */}
                <div className="space-y-2 pt-1 border-t border-surface-container-low">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                      Max Monthly Rent
                    </span>
                    <span className="text-xs font-bold text-primary">₹{priceMax.toLocaleString('en-IN')}</span>
                  </div>
                  <input
                    type="range"
                    min="6000"
                    max="25000"
                    step="1000"
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-on-surface-variant">
                    <span>Min: ₹6,000</span>
                    <span>Max: ₹25,000+</span>
                  </div>
                </div>

                {/* Sharing & Room Type Checkboxes */}
                <div className="space-y-2 pt-1 border-t border-surface-container-low">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                    Room Type &amp; Sharing
                  </span>
                  <div className="space-y-1.5 text-xs text-on-surface">
                    {[
                      { id: 'single', label: 'Single Private Room' },
                      { id: 'double', label: 'Twin Sharing (2-Bed)' },
                      { id: 'triple', label: 'Triple Sharing (Budget)' },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 hover:bg-surface-container-low p-1.5 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRoomTypes.includes(item.id)}
                          onChange={() => toggleRoomType(item.id)}
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Amenities Checkboxes */}
                <div className="space-y-2 pt-1 border-t border-surface-container-low">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider block">
                    Popular Amenities
                  </span>
                  <div className="space-y-1.5 text-xs text-on-surface">
                    {[
                      { id: 'WiFi', label: 'High-Speed Wi-Fi' },
                      { id: 'AC', label: 'Air Conditioner (AC)' },
                      { id: 'Mess/Food', label: 'Food / 3 Meals' },
                      { id: 'Gym', label: 'Fitness Gym' },
                      { id: 'Power Backup', label: '100% Power Backup' },
                      { id: 'Security', label: 'Biometric / CCTV Security' },
                    ].map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 hover:bg-surface-container-low p-1.5 rounded-lg cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAmenities.includes(item.id)}
                          onChange={() => toggleAmenity(item.id)}
                          className="w-4 h-4 rounded accent-secondary cursor-pointer"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* RIGHT MAIN CONTENT: PROPERTY GRID (8-9 cols) */}
            <section className="lg:col-span-8 xl:col-span-9 space-y-6">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl h-80 animate-pulse border border-outline-variant/30"
                    ></div>
                  ))}
                </div>
              ) : filteredProperties.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProperties.map((pg) => (
                    <PGCard
                      key={pg.id}
                      pg={pg}
                      onScheduleVisit={(p) => setSelectedPgForVisit(p)}
                    />
                  ))}
                </div>
              ) : (
                /* Polished Empty State */
                <div className="bg-white rounded-3xl p-12 text-center border border-outline-variant/30 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container text-primary mx-auto flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl">search_off</span>
                  </div>
                  <h3 className="text-xl font-bold text-on-surface font-headline-sm">
                    No accommodations match your filter criteria
                  </h3>
                  <p className="text-xs text-on-surface-variant max-w-md mx-auto leading-relaxed">
                    Try expanding your budget slider, resetting the gender preference to &apos;All&apos;, or broadening your locality search.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container shadow-sm transition-all"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Booking / Visit Modal */}
      <BookingModal
        pg={selectedPgForVisit}
        isOpen={Boolean(selectedPgForVisit)}
        onClose={() => setSelectedPgForVisit(null)}
      />

      <Footer />
    </div>
  );
}
