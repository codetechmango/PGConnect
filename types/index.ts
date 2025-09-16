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
