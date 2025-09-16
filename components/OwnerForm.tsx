import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormData } from '../types';
import ImageUploader from './ImageUploader';
import { 
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface OwnerFormProps {
  onSubmit: (data: FormData & { images: string[] }) => Promise<void>;
  initialData?: Partial<FormData & { images: string[] }>;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

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
  'Study Room',
  'Laundry Service',
  'Housekeeping',
  '24/7 Water',
  'CCTV',
  'Fire Safety',
  'Elevator',
  'Common Room',
  'Kitchen Access'
];

export default function OwnerForm({ 
  onSubmit, 
  initialData, 
  loading = false, 
  mode = 'create' 
}: OwnerFormProps) {
  const [images, setImages] = useState<string[]>(initialData?.images || []);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    initialData?.amenities || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: initialData
  });

  const handleFormSubmit = async (data: FormData) => {
    await onSubmit({
      ...data,
      amenities: selectedAmenities,
      images
    });
  };

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Basic Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-2 mb-6">
          <BuildingOfficeIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Property Title *
            </label>
            <input
              {...register('title', { 
                required: 'Title is required',
                minLength: { value: 10, message: 'Title must be at least 10 characters' }
              })}
              type="text"
              placeholder="e.g., Comfortable PG near Metro Station"
              className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              {...register('description', { 
                required: 'Description is required',
                minLength: { value: 50, message: 'Description must be at least 50 characters' }
              })}
              rows={4}
              placeholder="Describe your PG, nearby amenities, rules, etc."
              className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Location Information */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-2 mb-6">
          <MapPinIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Location</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              {...register('city', { required: 'City is required' })}
              type="text"
              placeholder="e.g., Mumbai, Delhi, Bangalore"
              className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area/Locality *
            </label>
            <input
              {...register('area', { required: 'Area is required' })}
              type="text"
              placeholder="e.g., Andheri West, CP, Koramangala"
              className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            {errors.area && (
              <p className="mt-1 text-sm text-red-600">{errors.area.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Address *
            </label>
            <input
              {...register('address', { required: 'Address is required' })}
              type="text"
              placeholder="Complete address with landmark"
              className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Pricing and Room Details */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-2 mb-6">
          <CurrencyRupeeIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Pricing & Room Details</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price per Month (₹) *
            </label>
            <input
              {...register('price_per_month', { 
                required: 'Price is required',
                min: { value: 1000, message: 'Minimum price is ₹1000' },
                valueAsNumber: true
              })}
              type="number"
              placeholder="10000"
              min="1000"
              className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            {errors.price_per_month && (
              <p className="mt-1 text-sm text-red-600">{errors.price_per_month.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Type *
            </label>
            <select
              {...register('room_type', { required: 'Room type is required' })}
              className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select room type</option>
              {ROOM_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.room_type && (
              <p className="mt-1 text-sm text-red-600">{errors.room_type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Rooms *
            </label>
            <input
              {...register('available_rooms', { 
                required: 'Number of rooms is required',
                min: { value: 1, message: 'At least 1 room required' },
                valueAsNumber: true
              })}
              type="number"
              placeholder="5"
              min="1"
              className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
            {errors.available_rooms && (
              <p className="mt-1 text-sm text-red-600">{errors.available_rooms.message}</p>
            )}
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender Preference *
            </label>
            <div className="flex space-x-4">
              {GENDER_PREFERENCES.map(pref => (
                <label key={pref.value} className="flex items-center">
                  <input
                    {...register('gender_preference', { required: 'Gender preference is required' })}
                    type="radio"
                    value={pref.value}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{pref.label}</span>
                </label>
              ))}
            </div>
            {errors.gender_preference && (
              <p className="mt-1 text-sm text-red-600">{errors.gender_preference.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center space-x-2 mb-6">
          <CheckCircleIcon className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Amenities</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {AMENITIES_OPTIONS.map(amenity => (
            <label
              key={amenity}
              className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedAmenities.includes(amenity)}
                onChange={() => toggleAmenity(amenity)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{amenity}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <ImageUploader
          onImagesChange={setImages}
          existingImages={images}
          maxImages={8}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          onClick={() => window.history.back()}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : mode === 'create' ? 'Create Listing' : 'Update Listing'}
        </button>
      </div>
    </form>
  );
}
