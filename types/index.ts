export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  is_owner: boolean;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface PG {
  id: string;
  title: string;
  description: string;
  city: string;
  area: string;
  address: string;
  price_per_month: number;
  room_type: 'single' | 'double' | 'triple' | 'dormitory';
  gender_preference: 'male' | 'female' | 'any';
  amenities: string[];
  images: string[];
  rating: number;
  total_reviews: number;
  available_rooms: number;
  owner_id: string;
  owner?: User;
  created_at: string;
  updated_at: string;
  latitude?: number;
  longitude?: number;
}

export interface Review {
  id: string;
  pg_id: string;
  user_id: string;
  user?: User;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Booking {
  id: string;
  pg_id: string;
  pg?: PG;
  user_id: string;
  user?: User;
  check_in_date: string;
  check_out_date?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  total_amount: number;
  created_at: string;
  updated_at: string;
}

export interface SearchFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  roomType?: string;
  amenities?: string[];
  genderPreference?: string;
}

export interface FormData {
  title: string;
  description: string;
  city: string;
  area: string;
  address: string;
  price_per_month: number;
  room_type: 'single' | 'double' | 'triple' | 'dormitory';
  gender_preference: 'male' | 'female' | 'any';
  amenities: string[];
  available_rooms: number;
  latitude?: number;
  longitude?: number;
}

// Type for form data in auth pages
export interface SignInForm {
  email: string;
  password: string;
}

export interface SignUpForm {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
}

export interface OwnerRegistrationForm {
  full_name: string;
  phone: string;
}

// Type for database errors
export interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
}

// Type for API response
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  success: boolean;
}

// Type for Supabase query results
export interface SupabaseResponse<T> {
  data: T[] | T | null;
  error: {
    message: string;
    details?: string;
    hint?: string;
  } | null;
}