import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { PG, SearchFilters } from '../types';
import SearchBar from '../components/SearchBar';
import PGCard from '../components/PGCard';
import { 
  MapIcon, 
  AdjustmentsHorizontalIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const [pgs, setPgs] = useState<PG[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({});

  // Load popular PGs on initial load
  useEffect(() => {
    loadPopularPGs();
  }, []);

  const loadPopularPGs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('pgs')
        .select(`
          *,
          owner:profiles(id, full_name, email)
        `)
        .eq('available_rooms', 'gt', 0)
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setPgs(data || []);
    } catch (error: any) {
      console.error('Error loading PGs:', error);
      setError('Failed to load PGs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setCurrentFilters(filters);

    try {
      let query = supabase
        .from('pgs')
        .select(`
          *,
          owner:profiles(id, full_name, email)
        `);

      // Apply filters
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.minPrice) {
        query = query.gte('price_per_month', filters.minPrice);
      }

      if (filters.maxPrice) {
        query = query.lte('price_per_month', filters.maxPrice);
      }

      if (filters.roomType) {
        query = query.eq('room_type', filters.roomType);
      }

      if (filters.genderPreference) {
        query = query.eq('gender_preference', filters.genderPreference);
      }

      if (filters.amenities && filters.amenities.length > 0) {
        query = query.contains('amenities', filters.amenities);
      }

      // Only show available PGs
      query = query.gt('available_rooms', 0);

      // Order by rating and recency
      query = query.order('rating', { ascending: false });
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setPgs(data || []);
    } catch (error: any) {
      console.error('Error searching PGs:', error);
      setError('Failed to search PGs');
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async (pgId: string, isFavorited: boolean) => {
    // TODO: Implement favorites functionality
    console.log('Favorite toggled:', pgId, isFavorited);
  };

  return (
    <>
      <Head>
        <title>PG Finder - Find Your Perfect Paying Guest Accommodation</title>
        <meta name="description" content="Find and book the best PG accommodations near you. Search by city, price, amenities and more." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Find Your Perfect PG
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                Discover comfortable and affordable paying guest accommodations near you
              </p>
            </div>

            {/* Search Bar */}
            <div className="max-w-4xl mx-auto">
              <SearchBar onSearch={handleSearch} loading={loading} />
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {hasSearched ? 'Search Results' : 'Popular PGs'}
              </h2>
              <p className="text-gray-600 mt-1">
                {hasSearched && pgs.length > 0 && `Found ${pgs.length} results`}
                {hasSearched && currentFilters.city && ` in ${currentFilters.city}`}
                {!hasSearched && 'Highly rated PGs across cities'}
              </p>
            </div>

            {pgs.length > 0 && (
              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-500">
                  <MapIcon className="h-4 w-4 mr-1" />
                  <span>Map View (Coming Soon)</span>
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading PGs</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => hasSearched ? handleSearch(currentFilters) : loadPopularPGs()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No Results */}
          {!loading && !error && hasSearched && pgs.length === 0 && (
            <div className="text-center py-12">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No PGs Found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search filters or search in a different city
              </p>
              <button
                onClick={() => {
                  setHasSearched(false);
                  setCurrentFilters({});
                  loadPopularPGs();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Show Popular PGs
              </button>
            </div>
          )}

          {/* Results Grid */}
          {!loading && !error && pgs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pgs.map((pg) => (
                <PGCard
                  key={pg.id}
                  pg={pg}
                  onFavoriteToggle={handleFavoriteToggle}
                />
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        {!hasSearched && (
          <div className="bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Are you a PG Owner?
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                  List your property on PG Finder and connect with potential tenants easily
                </p>
                <Link
                  href="/owner/register"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                  List Your PG
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
