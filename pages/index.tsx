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
      const { data, error: queryError } = await supabase
        .from('pgs')
        .select(`
          *,
          owner:profiles(id, full_name, email)
        `)
        .gt('available_rooms', 0)
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(12);

      if (queryError) throw queryError;
      setPgs(data || []);
    } catch (error) {
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
        `)
        .gt('available_rooms', 0);

      // Apply filters
      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.minPrice !== undefined) {
        query = query.gte('price_per_month', filters.minPrice);
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte('price_per_month', filters.maxPrice);
      }

      if (filters.roomType && filters.roomType !== 'any') {
        query = query.eq('room_type', filters.roomType);
      }

      if (filters.genderPreference && filters.genderPreference !== 'any') {
        query = query.eq('gender_preference', filters.genderPreference);
      }

      if (filters.amenities && filters.amenities.length > 0) {
        query = query.contains('amenities', filters.amenities);
      }

      const { data, error: queryError } = await query
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (queryError) throw queryError;
      setPgs(data || []);
    } catch (error) {
      console.error('Error searching PGs:', error);
      setError('Failed to search PGs');
    } finally {
      setLoading(false);
    }
  };

  const getResultsText = () => {
    if (!hasSearched) return 'Popular PGs';
    if (loading) return 'Searching...';
    if (pgs.length === 0) return 'No PGs found';
    return `${pgs.length} PGs found`;
  };

  const getResultsSubtext = () => {
    if (!hasSearched) return 'Highly rated PGs across cities';
    if (currentFilters.city) return `in ${currentFilters.city}`;
    return 'matching your criteria';
  };

  return (
    <>
      <Head>
        <title>PG Finder - Find Your Perfect Paying Guest Accommodation</title>
        <meta name="description" content="Find and book the best PG accommodations near you. Search by city, price, amenities and more." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section with Search */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Perfect PG</h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                Discover comfortable and affordable paying guest accommodations near you
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <SearchBar onSearch={handleSearch} />
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{getResultsText()}</h2>
              <p className="text-gray-600 mt-1">{getResultsSubtext()}</p>
            </div>
            
            {hasSearched && (
              <button 
                onClick={loadPopularPGs}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <AdjustmentsHorizontalIcon className="h-4 w-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>

          {error && (
            <div className="mb-6 flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                  <div className="w-full h-48 bg-gray-200"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : pgs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pgs.map((pg) => (
                <PGCard key={pg.id} pg={pg} />
              ))}
            </div>
          ) : hasSearched ? (
            <div className="text-center py-16">
              <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">No PGs found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search filters or explore other locations.
              </p>
              <button
                onClick={loadPopularPGs}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MapIcon className="h-5 w-5 mr-2" />
                Browse All PGs
              </button>
            </div>
          ) : null}
        </div>

        {/* Call-to-Action Section */}
        <div className="bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Are you a PG Owner?</h2>
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
      </div>
    </>
  );
}