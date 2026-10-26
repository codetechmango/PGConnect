export type UserRole = 'tenant' | 'student' | 'owner' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  role?: string;
  is_owner?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type RoomType = 'single' | 'double' | 'triple' | 'dormitory';
export type GenderPreference = 'male' | 'female' | 'any';

export interface RoomOption {
  id?: string;
  type: string;
  title: string;
  description?: string;
  price_per_month: number;
  security_deposit: number;
  available_beds: number;
  total_beds?: number;
  ac_available?: boolean;
  attached_bathroom?: boolean;
  balcony?: boolean;
  amenities?: string[];
  is_popular?: boolean;
}

export interface PG {
  id: string;
  title: string;
  name?: string;
  slug?: string;
  description: string;
  city: string;
  area: string;
  landmark?: string;
  address: string;
  state?: string;
  pincode?: string;
  price_per_month: number;
  room_type: RoomType;
  gender_preference: GenderPreference;
  amenities: string[];
  images: string[];
  rating: number;
  total_reviews: number;
  available_rooms: number;
  owner_id: string;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  updated_at?: string;
  // Extended fields from actual properties table
  is_verified?: boolean;
  is_featured?: boolean;
  verified?: boolean;
  distance_landmark?: string;
  deposit_months?: number;
  notice_period_days?: number;
  food_available?: boolean;
  food_type?: string;
  food_included?: boolean;
  food_types?: string[];
  rules?: string | null;
  gate_closing_time?: string | null;
  rooms?: any[];
  property_images?: any[];
  property_amenities?: any[];
  reviews?: any[];
}

export interface Review {
  id: string;
  property_id?: string;
  pg_id?: string;
  user_id: string;
  overall_rating?: number;
  cleanliness_rating?: number;
  food_rating?: number;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: Profile;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  property_id?: string;
  pg_id?: string;
  user_id: string;
  owner_id?: string;
  room_id?: string | null;
  bed_id?: string | null;
  room_type?: string;
  move_in_date?: string;
  check_in_date?: string;
  check_out_date?: string | null;
  monthly_rent?: number;
  deposit_amount?: number;
  total_amount?: number;
  status: BookingStatus;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  property?: any;
  pgs?: PG;
  profiles?: Profile;
  // Extended fields for visits and notifications
  booking_type?: 'visit' | 'escrow';
  user_name?: string;
  user_phone?: string;
  user_email?: string;
  time_slot?: string;
  visit_date?: string;
  owner_comment?: string;
  metadata?: Record<string, any>;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'visit_scheduled' | 'visit_confirmed' | 'visit_declined' | 'booking_created' | 'general';
  link?: string;
  is_read?: boolean;
  read?: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface Favorite {
  id: string;
  wishlist_id?: string;
  property_id?: string;
  user_id?: string;
  pg_id?: string;
  created_at: string;
  property?: any;
  pgs?: PG;
}

export type TicketCategory =
  | 'plumbing'
  | 'electrical'
  | 'carpentry'
  | 'wifi'
  | 'appliance'
  | 'cleaning'
  | 'general';

export type TicketPriority = 'urgent' | 'standard' | 'low';
export type TicketStatus = 'logged' | 'assigned' | 'en_route' | 'in_progress' | 'resolved';

export interface ServiceTicket {
  id: string;
  user_id: string;
  pg_id?: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  room_number?: string;
  technician_name?: string;
  eta_minutes?: number;
  sla_deadline?: string;
  created_at: string;
  updated_at?: string;
  pgs?: PG;
}

export interface FilterState {
  searchQuery: string;
  city: string;
  area: string;
  gender: 'all' | 'male' | 'female' | 'any';
  minPrice: number;
  maxPrice: number;
  roomTypes: string[];
  amenities: string[];
  superVerifiedOnly: boolean;
  radiusKm: number;
  sortBy: 'recommended' | 'price_asc' | 'price_desc' | 'rating' | 'distance';
}
