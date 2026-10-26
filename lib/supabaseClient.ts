import { createClient } from '@supabase/supabase-js';
import { Booking, AppNotification, BookingStatus } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'your_supabase_project_url' &&
  !supabaseUrl.includes('example.com')
);

// Fallback dummy client for build-time safety when env vars are not yet populated
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'pg-images';

/**
 * Upload an image file to Supabase Storage
 */
export async function uploadPropertyImage(file: File, folder: string = 'properties'): Promise<string | null> {
  if (!isSupabaseConfigured) {
    console.warn('Supabase credentials not configured. Using local preview object URL.');
    return URL.createObjectURL(file);
  }

  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error.message);
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Unexpected error uploading image:', err);
    return null;
  }
}

/**
 * Transforms a raw row from the `properties` table (with joined rooms, images, amenities, reviews)
 * into the normalized `PG` interface expected by the UI.
 */
export function transformPropertyToPG(item: any): any {
  if (!item) return null;

  // Images
  const rawImages = (item.property_images || [])
    .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((img: any) => img.url)
    .filter(Boolean);
  const images = rawImages.length > 0 ? rawImages : [
    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=1200&q=80'
  ];

  // Amenities
  const amenities = (item.property_amenities || [])
    .map((pa: any) => pa.amenity?.name)
    .filter(Boolean);

  // Rooms and pricing
  const rooms = item.rooms || [];
  const rents = rooms.map((r: any) => Number(r.rent_per_month)).filter((n: number) => !isNaN(n) && n > 0);
  const price_per_month = rents.length > 0 ? Math.min(...rents) : 0;

  // Total available rooms / beds
  const available_rooms = rooms.filter((r: any) => {
    if (r.beds && Array.isArray(r.beds)) {
      return r.beds.some((b: any) => b.status === 'available');
    }
    return (r.total_beds ?? 0) > 0;
  }).length;

  // Primary room type
  const roomTypesFound = Array.from(new Set(rooms.map((r: any) => r.room_type).filter(Boolean)));
  const primaryRoomType = (roomTypesFound[0] as any) || 'single';

  // Reviews & Rating
  const reviews = item.reviews || [];
  const ratings = reviews.map((rev: any) => Number(rev.overall_rating)).filter((n: number) => !isNaN(n) && n > 0);
  const avgRating = ratings.length > 0 ? Number((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)) : 4.5;

  return {
    id: item.id,
    title: item.name || 'PG Accommodation',
    name: item.name,
    slug: item.slug || item.id,
    description: item.description || '',
    city: item.city || '',
    area: item.area || item.landmark || '',
    landmark: item.landmark || '',
    address: item.address || '',
    state: item.state || '',
    pincode: item.pincode || '',
    price_per_month: price_per_month || Number(item.starting_rent) || 0,
    room_type: primaryRoomType,
    gender_preference: item.gender_preference || 'any',
    amenities,
    images,
    rating: avgRating,
    total_reviews: reviews.length,
    available_rooms,
    owner_id: item.owner_id || '',
    latitude: item.latitude ? Number(item.latitude) : null,
    longitude: item.longitude ? Number(item.longitude) : null,
    is_verified: Boolean(item.is_verified),
    verified: Boolean(item.is_verified),
    is_featured: Boolean(item.is_featured),
    food_available: Boolean(item.food_available),
    food_type: item.food_type || 'Veg & Non-Veg',
    food_included: Boolean(item.food_available),
    food_types: item.food_type ? [item.food_type] : ['Veg', 'Non-Veg'],
    rules: item.rules,
    gate_closing_time: item.gate_closing_time,
    rooms,
    property_images: item.property_images || [],
    property_amenities: item.property_amenities || [],
    reviews,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

const PROPERTY_SELECT_QUERY = `
  id, name, slug, description, address, city, area, landmark, state, pincode, starting_rent,
  gender_preference, rules, gate_closing_time, food_available, food_type,
  is_verified, is_featured, status, created_at, updated_at, owner_id,
  property_images(id, url, is_cover, display_order, caption),
  rooms(id, name, room_type, rent_per_month, deposit_amount, total_beds, ac_available, attached_bathroom, balcony, beds(id, bed_name, status)),
  property_amenities(amenity:amenities(id, name, category)),
  reviews(id, user_id, overall_rating, cleanliness_rating, food_rating, comment, created_at)
`;

/**
 * Fetch all properties from Supabase with full joined details
 */
export async function fetchProperties(filters?: {
  city?: string;
  gender?: string;
  minPrice?: number;
  maxPrice?: number;
  isVerified?: boolean;
}) {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('properties')
      .select(PROPERTY_SELECT_QUERY)
      .in('status', ['approved', 'draft', 'pending_approval']);

    if (filters?.city && filters.city !== 'all') {
      query = query.ilike('city', `%${filters.city}%`);
    }

    if (filters?.gender && filters.gender !== 'any' && filters.gender !== 'all') {
      query = query.eq('gender_preference', filters.gender);
    }

    if (filters?.isVerified) {
      query = query.eq('is_verified', true);
    }

    const { data, error } = await query;
    if (error) {
      // If status column doesn't match 'active', retry without status filter
      const fallback = await supabase.from('properties').select(PROPERTY_SELECT_QUERY);
      if (!fallback.error && fallback.data) {
        return fallback.data.map(transformPropertyToPG);
      }
      console.error('Error fetching properties from Supabase:', error.message);
      return [];
    }

    return (data || []).map(transformPropertyToPG);
  } catch (err) {
    console.error('Failed to query properties:', err);
    return [];
  }
}

/**
 * Fetch a single property by its UUID or slug
 */
export async function fetchPropertyById(idOrSlug: string) {
  if (!isSupabaseConfigured || !idOrSlug) return null;

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    let query = supabase.from('properties').select(PROPERTY_SELECT_QUERY);

    if (isUuid) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.or(`slug.eq.${idOrSlug},id.eq.${idOrSlug}`);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.error('Error fetching property details:', error.message);
      return null;
    }

    return data ? transformPropertyToPG(data) : null;
  } catch (err) {
    console.error('Failed to get property by id:', err);
    return null;
  }
}

/**
 * Fetch owner's managed properties
 */
export async function fetchOwnerProperties(ownerId: string) {
  if (!isSupabaseConfigured || !ownerId) return [];

  try {
    const { data, error } = await supabase
      .from('properties')
      .select(PROPERTY_SELECT_QUERY)
      .eq('owner_id', ownerId);

    if (error) {
      console.error('Error fetching owner properties:', error.message);
      return [];
    }
    return (data || []).map(transformPropertyToPG);
  } catch (err) {
    console.error('Failed to fetch owner properties:', err);
    return [];
  }
}

// --- LOCAL STORAGE HELPERS FOR WISHLIST PERSISTENCE ---
export function fetchUserWishlistPropertyIds(userId: string): string[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(`pgconnect_wishlist_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setUserWishlistPropertyIds(userId: string, ids: string[]): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    localStorage.setItem(`pgconnect_wishlist_${userId}`, JSON.stringify(ids));
  } catch (e) {
    console.warn('Could not persist wishlist locally:', e);
  }
}

/**
 * Fetch user's wishlist items
 */
export async function fetchUserWishlist(userId: string) {
  if (!userId) return [];

  const localIds = fetchUserWishlistPropertyIds(userId);

  // 1. Try server API route first if session token exists
  if (typeof window !== 'undefined') {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch('/api/wishlist', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json.items)) {
            const remoteItems = json.items
              .filter((it: any) => it.property)
              .map((it: any) => ({
                id: it.id,
                property_id: it.property_id,
                wishlist_id: it.wishlist_id,
                created_at: it.created_at,
                property: transformPropertyToPG(it.property),
              }));
            const remoteIds = remoteItems.map((r: any) => r.property_id);
            setUserWishlistPropertyIds(userId, remoteIds);
            return remoteItems;
          }
        }
      }
    } catch (apiErr) {
      console.warn('API wishlist fetch notice:', apiErr);
    }
  }

  // 2. Attempt direct Supabase lookup
  if (isSupabaseConfigured) {
    try {
      const { data: wishlist } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (wishlist) {
        const { data: items, error } = await supabase
          .from('wishlist_items')
          .select(`
            id, property_id, wishlist_id, created_at,
            property:properties(${PROPERTY_SELECT_QUERY})
          `)
          .eq('wishlist_id', wishlist.id);

        if (!error && items) {
          const remoteItems = items
            .filter((it: any) => it.property)
            .map((it: any) => ({
              id: it.id,
              property_id: it.property_id,
              wishlist_id: it.wishlist_id,
              created_at: it.created_at,
              property: transformPropertyToPG(it.property),
            }));

          // Sync remote property IDs into local persistence
          const remoteIds = remoteItems.map((r: any) => r.property_id);
          setUserWishlistPropertyIds(userId, remoteIds);

          return remoteItems;
        }
      }
    } catch (err) {
      console.warn('Supabase wishlist lookup warning:', err);
    }
  }

  // 3. Fallback: If Supabase has no wishlist rows yet (e.g. RLS pending), resolve locally saved properties
  if (localIds.length > 0 && isSupabaseConfigured) {
    try {
      const { data: properties, error: propErr } = await supabase
        .from('properties')
        .select(PROPERTY_SELECT_QUERY)
        .in('id', localIds);

      if (!propErr && properties && properties.length > 0) {
        return properties.map((prop: any) => ({
          id: prop.id,
          property_id: prop.id,
          wishlist_id: 'local',
          created_at: prop.created_at || new Date().toISOString(),
          property: transformPropertyToPG(prop),
        }));
      }
    } catch (fallbackErr) {
      console.warn('Fallback wishlist property fetch error:', fallbackErr);
    }
  }

  return [];
}

/**
 * Toggle property in user's wishlist
 */
export async function toggleWishlist(userId: string, propertyId: string): Promise<boolean> {
  if (!userId || !propertyId) return false;

  // 1. Update persistent local mirror immediately
  const currentIds = fetchUserWishlistPropertyIds(userId);
  const exists = currentIds.includes(propertyId);
  const nextIds = exists ? currentIds.filter((id: string) => id !== propertyId) : [...currentIds, propertyId];
  setUserWishlistPropertyIds(userId, nextIds);
  const nowFav = !exists;

  // 2. Try server API route first if session token exists
  if (typeof window !== 'undefined') {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ propertyId }),
        });
        if (res.ok) {
          const json = await res.json();
          if (typeof json.favorited === 'boolean') {
            return json.favorited;
          }
        }
      }
    } catch (apiErr) {
      console.warn('API wishlist toggle notice:', apiErr);
    }
  }

  // 3. Synchronize directly to Supabase wishlists and wishlist_items tables
  if (isSupabaseConfigured) {
    try {
      let { data: wishlist } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!wishlist) {
        const { data: created, error: createErr } = await supabase
          .from('wishlists')
          .insert([{ user_id: userId }])
          .select('id')
          .single();

        if (!createErr && created) {
          wishlist = created;
        }
      }

      if (wishlist) {
        const { data: existing } = await supabase
          .from('wishlist_items')
          .select('id')
          .eq('wishlist_id', wishlist.id)
          .eq('property_id', propertyId)
          .maybeSingle();

        if (existing && !nowFav) {
          // Remove from Supabase
          await supabase.from('wishlist_items').delete().eq('id', existing.id);
        } else if (!existing && nowFav) {
          // Add to Supabase
          await supabase.from('wishlist_items').insert([{
            wishlist_id: wishlist.id,
            property_id: propertyId,
          }]);
        }
      }
    } catch (syncErr) {
      console.warn('Supabase wishlist synchronization warning:', syncErr);
    }
  }

  return nowFav;
}

// --- ROOM TYPE NORMALIZATION ---
export function normalizeRoomType(type?: string): 'single' | 'double' | 'triple' | 'dormitory' {
  if (!type) return 'double';
  const lower = String(type).toLowerCase().trim();
  if (lower === 'twin') return 'double';
  if (lower === 'single') return 'single';
  if (lower === 'double') return 'double';
  if (lower === 'triple') return 'triple';
  if (lower === 'dormitory' || lower === 'dorm') return 'dormitory';
  return 'double';
}

// --- LOCAL STORAGE HELPERS FOR VISITS & BOOKINGS ---
const VISITS_STORAGE_KEY = 'pgconnect_scheduled_visits';

export function getAllLocalVisits(): Booking[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(VISITS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Failed to parse local visits:', e);
    return [];
  }
}

export function saveLocalVisit(visit: Booking): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getAllLocalVisits();
    const index = current.findIndex((b) => b.id === visit.id);
    let next: Booking[];
    if (index >= 0) {
      next = [...current];
      next[index] = { ...next[index], ...visit, updated_at: new Date().toISOString() };
    } else {
      next = [visit, ...current];
    }
    localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('pgconnect_bookings_updated', { detail: { booking: visit } }));
  } catch (e) {
    console.warn('Failed to save local visit:', e);
  }
}

export function updateLocalVisitStatus(
  bookingId: string,
  status: BookingStatus,
  ownerComment?: string
): Booking | null {
  if (typeof window === 'undefined') return null;
  try {
    const current = getAllLocalVisits();
    const index = current.findIndex((b) => b.id === bookingId);
    if (index >= 0) {
      const updated: Booking = {
        ...current[index],
        status,
        owner_comment: ownerComment || current[index].owner_comment,
        updated_at: new Date().toISOString(),
      };
      current[index] = updated;
      localStorage.setItem(VISITS_STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent('pgconnect_bookings_updated', { detail: { booking: updated } }));
      return updated;
    }
  } catch (e) {
    console.warn('Failed to update local visit status:', e);
  }
  return null;
}

// --- NOTIFICATION HELPERS ---
const NOTIFICATIONS_STORAGE_PREFIX = 'pgconnect_notifications_';

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  if (!userId) return [];
  let remoteList: AppNotification[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, title, message, type, is_read, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        remoteList = data.map((n: any) => ({
          id: n.id,
          user_id: n.user_id,
          title: n.title,
          message: n.message,
          type: n.type || 'general',
          is_read: Boolean(n.is_read),
          read: Boolean(n.is_read),
          created_at: n.created_at || new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.warn('Supabase notifications lookup note:', err);
    }
  }

  // Local notifications
  let localList: AppNotification[] = [];
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(`${NOTIFICATIONS_STORAGE_PREFIX}${userId}`);
      if (raw) localList = JSON.parse(raw);
    } catch (e) {
      console.warn('Local notifications read error:', e);
    }
  }

  // Merge remote and local (avoiding duplicates by id)
  const mergedMap = new Map<string, AppNotification>();
  for (const n of remoteList) {
    mergedMap.set(n.id, n);
  }
  for (const n of localList) {
    if (!mergedMap.has(n.id)) {
      mergedMap.set(n.id, n);
    } else {
      const existing = mergedMap.get(n.id)!;
      if (n.is_read) existing.is_read = true;
    }
  }

  return Array.from(mergedMap.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function sendNotification(payload: {
  user_id: string;
  title: string;
  message: string;
  type?: 'visit_scheduled' | 'visit_confirmed' | 'visit_declined' | 'booking_created' | 'general';
  link?: string;
  metadata?: Record<string, any>;
}): Promise<AppNotification> {
  const newNotif: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: payload.user_id,
    title: payload.title,
    message: payload.message,
    type: payload.type || 'general',
    link: payload.link || '',
    is_read: false,
    read: false,
    created_at: new Date().toISOString(),
    metadata: payload.metadata,
  };

  // 1. Save in local storage
  if (typeof window !== 'undefined' && payload.user_id) {
    try {
      const key = `${NOTIFICATIONS_STORAGE_PREFIX}${payload.user_id}`;
      const raw = localStorage.getItem(key);
      const list: AppNotification[] = raw ? JSON.parse(raw) : [];
      list.unshift(newNotif);
      localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
      window.dispatchEvent(
        new CustomEvent('pgconnect_notifications_updated', { detail: { notification: newNotif } })
      );
    } catch (e) {
      console.warn('Could not store notification locally:', e);
    }
  }

  // 2. Try inserting into Supabase
  if (isSupabaseConfigured && payload.user_id) {
    try {
      await supabase.from('notifications').insert([{
        user_id: payload.user_id,
        title: payload.title,
        message: payload.message,
        type: payload.type || 'general',
        is_read: false,
      }]);
    } catch (err) {
      console.warn('Supabase notification insertion note:', err);
    }
  }

  return newNotif;
}

export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  if (typeof window !== 'undefined' && userId) {
    try {
      const key = `${NOTIFICATIONS_STORAGE_PREFIX}${userId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const list: AppNotification[] = JSON.parse(raw);
        const next = list.map((n) => (n.id === notificationId ? { ...n, is_read: true, read: true } : n));
        localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(
          new CustomEvent('pgconnect_notifications_updated', { detail: { notificationId } })
        );
      }
    } catch (e) {
      console.warn('Local notification update error:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    } catch (err) {
      console.warn('Supabase notification mark-read note:', err);
    }
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  if (typeof window !== 'undefined' && userId) {
    try {
      const key = `${NOTIFICATIONS_STORAGE_PREFIX}${userId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const list: AppNotification[] = JSON.parse(raw);
        const next = list.map((n) => ({ ...n, is_read: true, read: true }));
        localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(
          new CustomEvent('pgconnect_notifications_updated', { detail: { allRead: true } })
        );
      }
    } catch (e) {
      console.warn('Local notification update error:', e);
    }
  }

  if (isSupabaseConfigured && userId) {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
    } catch (err) {
      console.warn('Supabase notification mark-all-read note:', err);
    }
  }
}

/**
 * Fetch bookings & visits for a resident or owner
 */
export async function fetchBookings(userId: string, isOwner: boolean = false): Promise<Booking[]> {
  if (!userId) return [];
  const remoteBookings: Booking[] = [];

  // 1. Fetch remote bookings from Supabase
  if (isSupabaseConfigured) {
    try {
      const filterCol = isOwner ? 'owner_id' : 'user_id';
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id, user_id, owner_id, property_id, room_id, bed_id, status,
          room_type, move_in_date, monthly_rent, deposit_amount, notes, created_at, updated_at,
          property:properties(${PROPERTY_SELECT_QUERY}),
          resident_profile:profiles!bookings_user_id_fkey(id, full_name, email, phone)
        `)
        .eq(filterCol, userId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        for (const b of data) {
          const transformedProp = transformPropertyToPG(b.property);
          const isVisit = b.deposit_amount === 0 || (b.notes && b.notes.toUpperCase().includes('VISIT'));

          let timeSlot = '10:00 AM - 12:00 PM';
          let phone = (b.resident_profile as any)?.phone || '';
          let residentName = (b.resident_profile as any)?.full_name || '';

          if (b.notes) {
            const slotMatch = b.notes.match(/Slot:\s*([^|]+)/i) || b.notes.match(/requested for\s*([^.]+)/i);
            if (slotMatch) timeSlot = slotMatch[1].trim();
            const phoneMatch = b.notes.match(/Contact:\s*([^\s|]+)/i) || b.notes.match(/Phone:\s*([^\s|]+)/i);
            if (phoneMatch) phone = phoneMatch[1].trim();
            const nameMatch = b.notes.match(/Resident:\s*([^|]+)/i);
            if (nameMatch) residentName = nameMatch[1].trim();
          }

          remoteBookings.push({
            ...b,
            check_in_date: b.move_in_date || b.created_at,
            total_amount: b.monthly_rent || 0,
            booking_type: isVisit ? 'visit' : 'escrow',
            time_slot: timeSlot,
            visit_date: b.move_in_date,
            user_phone: phone,
            user_name: residentName || (b.resident_profile as any)?.full_name || 'Resident Seeker',
            user_email: (b.resident_profile as any)?.email || '',
            property: transformedProp,
            pgs: transformedProp,
            profiles: (b.resident_profile as any) || {
              id: b.user_id,
              full_name: residentName || 'Resident Seeker',
              email: '',
              phone,
            },
          });
        }
      }
    } catch (err) {
      console.warn('Supabase fetchBookings warning:', err);
    }
  }

  // 2. Fetch local visits from synchronized store
  const allLocal = getAllLocalVisits();
  const filteredLocal = allLocal.filter((b) => (isOwner ? b.owner_id === userId : b.user_id === userId));

  // 3. Merge avoiding duplicates (local overrides status if more recent)
  const map = new Map<string, Booking>();
  for (const b of remoteBookings) {
    map.set(b.id, b);
  }
  for (const b of filteredLocal) {
    if (!map.has(b.id)) {
      map.set(b.id, b);
    } else {
      const existing = map.get(b.id)!;
      map.set(b.id, {
        ...existing,
        ...b,
        status: b.status || existing.status,
      });
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Update a visit or booking status (Accept or Deny)
 */
export async function updateBookingStatus(
  bookingId: string,
  status: 'confirmed' | 'cancelled',
  ownerNotes?: string
): Promise<{ success: boolean; data?: Booking; error?: string }> {
  // 1. Update in local store
  let updatedRecord = updateLocalVisitStatus(bookingId, status, ownerNotes);

  // 2. Update in Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId)
        .select()
        .maybeSingle();

      if (!error && data) {
        if (!updatedRecord) {
          updatedRecord = {
            ...data,
            check_in_date: data.move_in_date,
            total_amount: data.monthly_rent,
          };
        }
      }
    } catch (err: any) {
      console.warn('Supabase booking status update warning:', err);
    }
  }

  // 3. Notify the RESIDENT about the owner's decision!
  if (updatedRecord && updatedRecord.user_id) {
    const propTitle =
      updatedRecord.property?.title ||
      updatedRecord.pgs?.title ||
      updatedRecord.property?.name ||
      'PG Accommodation';
    const visitDate = updatedRecord.visit_date || updatedRecord.move_in_date || 'scheduled date';
    const timeSlot = updatedRecord.time_slot || 'scheduled time window';

    if (status === 'confirmed') {
      const gatePassOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await sendNotification({
        user_id: updatedRecord.user_id,
        title: '🎉 Visit Scheduled Confirmed!',
        message: `The owner of ${propTitle} accepted your property visit for ${visitDate} (${timeSlot}). Biometric Turnstile Gate Pass OTP: ${gatePassOtp}. Proprietor is expecting your arrival!`,
        type: 'visit_confirmed',
        link: '/resident/dashboard',
        metadata: {
          booking_id: bookingId,
          property_id: updatedRecord.property_id,
          status: 'confirmed',
          gate_pass_otp: gatePassOtp,
        },
      });
    } else {
      await sendNotification({
        user_id: updatedRecord.user_id,
        title: '❌ Visit Request Declined',
        message: `The owner of ${propTitle} was unable to host your visit scheduled for ${visitDate} (${timeSlot})${ownerNotes ? `: "${ownerNotes}"` : '.'
          } You can choose another date or explore other verified PGs.`,
        type: 'visit_declined',
        link: '/resident/dashboard',
        metadata: {
          booking_id: bookingId,
          property_id: updatedRecord.property_id,
          status: 'cancelled',
        },
      });
    }
  }

  return { success: true, data: updatedRecord || undefined };
}

/**
 * Create a new booking or schedule visit
 */
export async function createBooking(payload: {
  property_id: string;
  user_id: string;
  owner_id?: string;
  room_id?: string;
  bed_id?: string;
  room_type?: string;
  move_in_date: string;
  monthly_rent?: number;
  deposit_amount?: number;
  notes?: string;
  booking_type?: 'visit' | 'escrow';
  user_name?: string;
  user_phone?: string;
  user_email?: string;
  time_slot?: string;
  visit_date?: string;
  property_title?: string;
  property_image?: string;
  property_address?: string;
  property_city?: string;
}): Promise<{ data: Booking; error?: string }> {
  const normalizedRoomType = normalizeRoomType(payload.room_type);
  let ownerId = payload.owner_id;

  // 1. Resolve owner_id from properties table if missing
  if (!ownerId && payload.property_id && isSupabaseConfigured) {
    try {
      const { data: propData } = await supabase
        .from('properties')
        .select('owner_id, name, address, city')
        .eq('id', payload.property_id)
        .maybeSingle();
      if (propData?.owner_id) {
        ownerId = propData.owner_id;
      }
      if (!payload.property_title && propData?.name) {
        payload.property_title = propData.name;
        payload.property_address = propData.address;
        payload.property_city = propData.city;
      }
    } catch (e) {
      console.warn('Could not resolve property owner:', e);
    }
  }

  // 2. Format notes with rich visit details
  const visitDate = payload.visit_date || payload.move_in_date;
  const timeSlot = payload.time_slot || '10:00 AM - 12:00 PM';
  const residentName = payload.user_name || 'Resident Seeker';
  const residentPhone = payload.user_phone || '';
  const isVisit = payload.booking_type === 'visit' || payload.deposit_amount === 0;

  const formattedNotes =
    payload.notes ||
    (isVisit
      ? `[VISIT] Date: ${visitDate} | Slot: ${timeSlot} | Resident: ${residentName} | Contact: ${residentPhone}`
      : `[ESCROW] Move-in: ${visitDate} | Resident: ${residentName} | Contact: ${residentPhone}`);

  let createdId = `BK-${Date.now().toString(36).toUpperCase()}`;

  // 3. Attempt direct Supabase insert
  if (isSupabaseConfigured) {
    try {
      let roomId = payload.room_id || null;
      if (!roomId && payload.property_id) {
        const { data: rooms } = await supabase
          .from('rooms')
          .select('id')
          .eq('property_id', payload.property_id)
          .limit(1);
        if (rooms && rooms.length > 0) {
          roomId = rooms[0].id;
        }
      }

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          property_id: payload.property_id,
          user_id: payload.user_id,
          owner_id: ownerId || null,
          room_id: roomId,
          bed_id: payload.bed_id || null,
          room_type: normalizedRoomType,
          move_in_date: visitDate,
          monthly_rent: payload.monthly_rent || 0,
          deposit_amount: payload.deposit_amount || 0,
          status: 'pending',
          notes: formattedNotes,
        }])
        .select()
        .single();

      if (!error && data) {
        createdId = data.id;
      } else if (error) {
        console.warn('Supabase booking insert notice (falling back to synchronized store):', error.message);
      }
    } catch (dbErr: any) {
      console.warn('Supabase booking insert warning:', dbErr);
    }
  }

  // 4. Construct complete Booking object
  const bookingRecord: Booking = {
    id: createdId,
    property_id: payload.property_id,
    user_id: payload.user_id,
    owner_id: ownerId || undefined,
    room_type: normalizedRoomType,
    move_in_date: visitDate,
    check_in_date: visitDate,
    monthly_rent: payload.monthly_rent || 0,
    deposit_amount: payload.deposit_amount || 0,
    total_amount: payload.deposit_amount || 0,
    status: 'pending',
    notes: formattedNotes,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    booking_type: isVisit ? 'visit' : 'escrow',
    user_name: residentName,
    user_phone: residentPhone,
    user_email: payload.user_email,
    time_slot: timeSlot,
    visit_date: visitDate,
    property: {
      id: payload.property_id,
      title: payload.property_title || 'PG Accommodation',
      name: payload.property_title || 'PG Accommodation',
      address: payload.property_address || '',
      city: payload.property_city || '',
      images: payload.property_image ? [payload.property_image] : [],
      price_per_month: payload.monthly_rent || 0,
      room_type: normalizedRoomType,
      owner_id: ownerId,
    },
    pgs: {
      id: payload.property_id,
      title: payload.property_title || 'PG Accommodation',
      name: payload.property_title || 'PG Accommodation',
      address: payload.property_address || '',
      city: payload.property_city || '',
      images: payload.property_image ? [payload.property_image] : [],
      price_per_month: payload.monthly_rent || 0,
      room_type: normalizedRoomType,
      owner_id: ownerId || '',
    } as any,
    profiles: {
      id: payload.user_id,
      email: payload.user_email || '',
      full_name: residentName,
      phone: residentPhone,
    },
  };

  // 5. Persist locally to synchronized store
  saveLocalVisit(bookingRecord);

  // 6. Send notification to the OWNER
  if (ownerId) {
    await sendNotification({
      user_id: ownerId,
      title: isVisit ? '📅 New Property Visit Scheduled' : '🔒 New Bed Escrow Lock Request',
      message: isVisit
        ? `${residentName} scheduled a free property visit for ${payload.property_title || 'your property'} on ${visitDate} (${timeSlot}). Mobile: +91 ${residentPhone}.`
        : `${residentName} locked a bed with ₹1,000 escrow token for ${payload.property_title || 'your property'}. Move-in: ${visitDate}.`,
      type: isVisit ? 'visit_scheduled' : 'booking_created',
      link: '/owner/dashboard',
      metadata: {
        booking_id: bookingRecord.id,
        property_id: payload.property_id,
        resident_id: payload.user_id,
        resident_name: residentName,
        resident_phone: residentPhone,
        visit_date: visitDate,
        time_slot: timeSlot,
      },
    });
  }

  return { data: bookingRecord };
}

/**
 * Fetch reports / service tickets from the `reports` table
 */
export async function fetchReports(userIdOrOwnerId: string, isOwner: boolean = false) {
  if (!isSupabaseConfigured || !userIdOrOwnerId) return [];

  try {
    let query = supabase
      .from('reports')
      .select(`
        id, status, owner_id, property_id, reason, details, created_at, updated_at,
        property:properties(id, name, address)
      `)
      .order('created_at', { ascending: false });

    if (isOwner) {
      query = query.eq('owner_id', userIdOrOwnerId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching reports:', error.message);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Failed to fetch reports:', err);
    return [];
  }
}

/**
 * Create a maintenance report / complaint in the `reports` table
 */
export async function createReport(payload: {
  property_id: string;
  owner_id?: string;
  reason: string;
  details: string;
}) {
  if (!isSupabaseConfigured) return { error: 'Supabase not configured' };

  try {
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        property_id: payload.property_id,
        owner_id: payload.owner_id || null,
        reason: payload.reason,
        details: payload.details,
        status: 'open',
      }])
      .select()
      .single();

    if (error) return { error: error.message };
    return { data };
  } catch (err: any) {
    return { error: err.message || 'Failed to file report' };
  }
}
