-- ==============================================================================
-- PG CONNECT — ROW LEVEL SECURITY (RLS) POLICIES FOR PROPERTY PUBLISHING
-- ==============================================================================
-- Run this migration in your Supabase Dashboard -> SQL Editor to ensure
-- authenticated PG Owners have full permission to create and manage their listings,
-- rooms, beds, images, and amenities, while keeping resident access secure.

-- 1. Enable RLS on all relevant tables (safe, idempotent)
ALTER TABLE IF EXISTS public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.property_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- 2. PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. OWNERS TABLE POLICIES
DROP POLICY IF EXISTS "Owners are viewable by everyone" ON public.owners;
CREATE POLICY "Owners are viewable by everyone"
ON public.owners FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can create their owner profile" ON public.owners;
CREATE POLICY "Users can create their owner profile"
ON public.owners FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Owners can update their own record" ON public.owners;
CREATE POLICY "Owners can update their own record"
ON public.owners FOR UPDATE
TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- 4. PROPERTIES TABLE POLICIES
DROP POLICY IF EXISTS "Public properties are viewable by everyone" ON public.properties;
CREATE POLICY "Public properties are viewable by everyone"
ON public.properties FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Owners can insert their own properties" ON public.properties;
CREATE POLICY "Owners can insert their own properties"
ON public.properties FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can update their own properties" ON public.properties;
CREATE POLICY "Owners can update their own properties"
ON public.properties FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Owners can delete their own properties" ON public.properties;
CREATE POLICY "Owners can delete their own properties"
ON public.properties FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- 5. ROOMS TABLE POLICIES
DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON public.rooms;
CREATE POLICY "Public rooms are viewable by everyone"
ON public.rooms FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Owners can insert rooms for their properties" ON public.rooms;
CREATE POLICY "Owners can insert rooms for their properties"
ON public.rooms FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = rooms.property_id
    AND properties.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can update rooms for their properties" ON public.rooms;
CREATE POLICY "Owners can update rooms for their properties"
ON public.rooms FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = rooms.property_id
    AND properties.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can delete rooms for their properties" ON public.rooms;
CREATE POLICY "Owners can delete rooms for their properties"
ON public.rooms FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = rooms.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- 6. BEDS TABLE POLICIES
DROP POLICY IF EXISTS "Public beds are viewable by everyone" ON public.beds;
CREATE POLICY "Public beds are viewable by everyone"
ON public.beds FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Owners can insert beds for their rooms" ON public.beds;
CREATE POLICY "Owners can insert beds for their rooms"
ON public.beds FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.rooms
    JOIN public.properties ON properties.id = rooms.property_id
    WHERE rooms.id = beds.room_id
    AND properties.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can update beds for their rooms" ON public.beds;
CREATE POLICY "Owners can update beds for their rooms"
ON public.beds FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rooms
    JOIN public.properties ON properties.id = rooms.property_id
    WHERE rooms.id = beds.room_id
    AND properties.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can delete beds for their rooms" ON public.beds;
CREATE POLICY "Owners can delete beds for their rooms"
ON public.beds FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rooms
    JOIN public.properties ON properties.id = rooms.property_id
    WHERE rooms.id = beds.room_id
    AND properties.owner_id = auth.uid()
  )
);

-- 7. PROPERTY IMAGES TABLE POLICIES
DROP POLICY IF EXISTS "Public property images are viewable by everyone" ON public.property_images;
CREATE POLICY "Public property images are viewable by everyone"
ON public.property_images FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Owners can insert property images" ON public.property_images;
CREATE POLICY "Owners can insert property images"
ON public.property_images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
    AND properties.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can update property images" ON public.property_images;
CREATE POLICY "Owners can update property images"
ON public.property_images FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
    AND properties.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can delete property images" ON public.property_images;
CREATE POLICY "Owners can delete property images"
ON public.property_images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_images.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- 8. PROPERTY AMENITIES TABLE POLICIES
DROP POLICY IF EXISTS "Public property amenities are viewable by everyone" ON public.property_amenities;
CREATE POLICY "Public property amenities are viewable by everyone"
ON public.property_amenities FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Owners can insert property amenities" ON public.property_amenities;
CREATE POLICY "Owners can insert property amenities"
ON public.property_amenities FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_amenities.property_id
    AND properties.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Owners can delete property amenities" ON public.property_amenities;
CREATE POLICY "Owners can delete property amenities"
ON public.property_amenities FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = property_amenities.property_id
    AND properties.owner_id = auth.uid()
  )
);

-- 9. AMENITIES TABLE (read-only for all users, pre-populated or managed)
DROP POLICY IF EXISTS "Public amenities are viewable by everyone" ON public.amenities;
CREATE POLICY "Public amenities are viewable by everyone"
ON public.amenities FOR SELECT
USING (true);

-- 10. WISHLISTS & WISHLIST ITEMS POLICIES
DROP POLICY IF EXISTS "Users can view their own wishlists" ON public.wishlists;
CREATE POLICY "Users can view their own wishlists"
ON public.wishlists FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own wishlist" ON public.wishlists;
CREATE POLICY "Users can create their own wishlist"
ON public.wishlists FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own wishlist" ON public.wishlists;
CREATE POLICY "Users can delete their own wishlist"
ON public.wishlists FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can view their own wishlist items"
ON public.wishlist_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.wishlists
    WHERE wishlists.id = wishlist_items.wishlist_id
    AND wishlists.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can insert their own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can insert their own wishlist items"
ON public.wishlist_items FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.wishlists
    WHERE wishlists.id = wishlist_items.wishlist_id
    AND wishlists.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete their own wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can delete their own wishlist items"
ON public.wishlist_items FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.wishlists
    WHERE wishlists.id = wishlist_items.wishlist_id
    AND wishlists.user_id = auth.uid()
  )
);

