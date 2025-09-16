import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SearchFilters } from '../types';
import { 
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

interface FiltersPanelProps {
  onFiltersChange: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
  className?: string;
}

const PRICE_RANGES = [
  { label: 'Under ₹10,000', min: 0, max: 10000 },
  { label: '₹10,000 - ₹15,000', min: 10000, max: 15000 },
  { label: '₹15,000 - ₹20,000', min: 15000, max: 20000 },
  { label: '₹20,000 - ₹25,000', min: 20000, max: 25000 },
  { label: 'Above ₹25,000', min: 25000, max: null }
];

const ROOM_TYPES = [
  { value: 'single', label: 'Single Room' },
  { value: 'double', label: 'Double Sharing' },
  { value: 'triple', label: 'Triple Sharing' },
  { value: 'dormitory', label: 'Dormitory' }
];

const GENDER_PREFERENCES = [
  { value: 'male', label: 'Male Only' },
  { value: 'female', label: 'Female Only' },
  { value: 'any', label: 'Mixed/Any' }
];

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

export default function FiltersPanel({ 
  onFiltersChange, 
  initialFilters = {},
  className = ''
}: FiltersPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialFilters.amenities || []
  );

  const { register, watch, setValue, reset } = useForm<SearchFilters>({
    defaultValues: initialFilters
  });

  const watchedValues = watch();

  // Update filters whenever form values change
  const handleFilterChange = () => {
    const filters: SearchFilters = {
      ...watchedValues,
      amenities: selectedAmenities,
      minPrice: watchedValues.minPrice || undefined,
      maxPrice: watchedValues.maxPrice || undefined,
      roomType: watchedValues.roomType || undefined,
      genderPreference: watchedValues.genderPreference || undefined
    };
    onFiltersChange(filters);
  };

  const toggleAmenity = (amenity: string) => {
    const updated = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter(a => a !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(updated);
    // Trigger filter change after state update
    setTimeout(handleFilterChange, 0);
  };

  const clearAllFilters = () => {
    reset();
    setSelectedAmenities([]);
    onFiltersChange({});
  };

  const handlePriceRangeSelect = (range: typeof PRICE_RANGES[0]) => {
    setValue('minPrice', range.min);
    setValue('maxPrice', range.max || undefined);
    handleFilterChange();
  };

  const hasActiveFilters = () => {
    return !!(
      watchedValues.minPrice ||
      watchedValues.maxPrice ||
      watchedValues.roomType ||
      watchedValues.genderPreference ||
      selectedAmenities.length > 0
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
            {hasActiveFilters() && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters() && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-600 hover:text-red-800 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors lg:hidden"
            >
              {isExpanded ? (
                <ChevronUpIcon className="h-5 w-5" />
              ) : (
                <ChevronDownIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Content */}
      <div className={`p-4 space-y-6 ${!isExpanded ? 'hidden lg:block' : ''}`}>
        {/* Quick Price Ranges */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Price Range</h4>
          <div className="space-y-2">
            {PRICE_RANGES.map((range, index) => (
              <button
                key={index}
                onClick={() => handlePriceRangeSelect(range)}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-200 transition-colors"
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Price Range */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Custom Range</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Min Price</label>
              <input
                {...register('minPrice', { 
                  valueAsNumber: true,
                  onChange: handleFilterChange 
                })}
                type="number"
                placeholder="5,000"
                min="0"
                className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Max Price</label>
              <input
                {...register('maxPrice', { 
                  valueAsNumber: true,
                  onChange: handleFilterChange 
                })}
                type="number"
                placeholder="25,000"
                min="0"
                className="w-full px-3 py-2 text-sm text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
        </div>

        {/* Room Type */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Room Type</h4>
          <div className="space-y-2">
            {ROOM_TYPES.map(type => (
              <label key={type.value} className="flex items-center">
                <input
                  {...register('roomType', { onChange: handleFilterChange })}
                  type="radio"
                  value={type.value}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Gender Preference */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Gender Preference</h4>
          <div className="space-y-2">
            {GENDER_PREFERENCES.map(pref => (
              <label key={pref.value} className="flex items-center">
                <input
                  {...register('genderPreference', { onChange: handleFilterChange })}
                  type="radio"
                  value={pref.value}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{pref.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Amenities ({selectedAmenities.length} selected)
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {AMENITIES_OPTIONS.map(amenity => (
              <label
                key={amenity}
                className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedAmenities.includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Apply Filters Button (Mobile) */}
        <div className="lg:hidden pt-4 border-t">
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
