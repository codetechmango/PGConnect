import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { SearchFilters } from '../types';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  loading?: boolean;
}

const AMENITIES_OPTIONS = [
  'WiFi',
  'AC',
  'Washing Machine',
  'TV',
  'Fridge',
  'Parking',
  'Security',
  'Mess/Food',
  'Power Backup',
  'Water Supply',
  'Gym',
  'Study Room'
];

const ROOM_TYPES = [
  { value: '', label: 'All Room Types' },
  { value: 'single', label: 'Single Room' },
  { value: 'double', label: 'Double Sharing' },
  { value: 'triple', label: 'Triple Sharing' },
  { value: 'dormitory', label: 'Dormitory' }
];

const GENDER_PREFERENCES = [
  { value: '', label: 'Any Gender' },
  { value: 'male', label: 'Male Only' },
  { value: 'female', label: 'Female Only' },
  { value: 'any', label: 'Mixed/Any' }
];

const QUICK_PRICE_RANGES = [
  { label: 'Under ₹10K', min: 0, max: 10000 },
  { label: '₹10K - ₹15K', min: 10000, max: 15000 },
  { label: '₹15K - ₹25K', min: 15000, max: 25000 },
  { label: 'Above ₹25K', min: 25000, max: null }
];

export default function SearchBar({ onSearch, loading = false }: SearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const { register, handleSubmit, watch, setValue, reset } = useForm<SearchFilters>();

  const onSubmit = (data: SearchFilters) => {
    // Clean up the data
    const filters: SearchFilters = {
      ...data,
      minPrice: data.minPrice || undefined,
      maxPrice: data.maxPrice || undefined,
      roomType: data.roomType || undefined,
      genderPreference: data.genderPreference || undefined,
      amenities: data.amenities?.filter(Boolean) || []
    };
    onSearch(filters);
  };

  const clearFilters = () => {
    reset();
    onSearch({});
  };

  const watchedAmenities = watch('amenities') || [];
  const watchedCity = watch('city');
  const watchedMinPrice = watch('minPrice');
  const watchedMaxPrice = watch('maxPrice');

  const toggleAmenity = (amenity: string) => {
    const current = watchedAmenities as string[];
    const updated = current.includes(amenity)
      ? current.filter(a => a !== amenity)
      : [...current, amenity];
    setValue('amenities', updated);
  };

  const setQuickPriceRange = (range: typeof QUICK_PRICE_RANGES[0]) => {
    setValue('minPrice', range.min);
    setValue('maxPrice', range.max || undefined);
  };

  const hasFilters = () => {
    return !!(watchedCity || watchedMinPrice || watchedMaxPrice || watchedAmenities.length > 0);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Main Search Bar */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* City Search Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPinIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('city')}
                type="text"
                placeholder="Enter city name (e.g., Mumbai, Delhi, Bangalore)"
                className="w-full pl-12 pr-4 py-4 text-lg text-gray-900 placeholder-gray-500 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-6 py-4 rounded-xl transition-all duration-200 font-medium ${
                  showFilters 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                }`}
              >
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Filters</span>
                {hasFilters() && (
                  <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    !
                  </span>
                )}
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg font-medium"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <MagnifyingGlassIcon className="h-5 w-5" />
                )}
                <span>{loading ? 'Searching...' : 'Search'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t border-gray-200 bg-gray-50">
            <div className="p-6 space-y-8">
              {/* Quick Price Filters */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2">
                    Quick
                  </span>
                  Price Ranges
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {QUICK_PRICE_RANGES.map((range, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setQuickPriceRange(range)}
                      className="px-4 py-3 text-sm font-medium text-gray-700 bg-white hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-lg transition-all duration-200"
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Price Range */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Custom Price Range</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Min Price (₹/month)
                    </label>
                    <input
                      {...register('minPrice', { valueAsNumber: true })}
                      type="number"
                      placeholder="5,000"
                      min="0"
                      className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Price (₹/month)
                    </label>
                    <input
                      {...register('maxPrice', { valueAsNumber: true })}
                      type="number"
                      placeholder="25,000"
                      min="0"
                      className="w-full px-4 py-3 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Room Type and Gender */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Preferences</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Type
                    </label>
                    <select
                      {...register('roomType')}
                      className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      {ROOM_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender Preference
                    </label>
                    <select
                      {...register('genderPreference')}
                      className="w-full px-4 py-3 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                    >
                      {GENDER_PREFERENCES.map(pref => (
                        <option key={pref.value} value={pref.value}>
                          {pref.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-4">
                  Amenities 
                  {watchedAmenities.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {watchedAmenities.length} selected
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {AMENITIES_OPTIONS.map(amenity => (
                    <label
                      key={amenity}
                      className={`flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 ${
                        watchedAmenities.includes(amenity)
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={watchedAmenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  {hasFilters() && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-all duration-200 font-medium"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 shadow-lg font-medium"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
