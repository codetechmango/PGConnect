-- PG Finder Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
-- Note: This is usually enabled by default in Supabase

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  is_owner BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PG listings table
CREATE TABLE pgs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  address TEXT NOT NULL,
  price_per_month INTEGER NOT NULL,
  room_type TEXT NOT NULL CHECK (room_type IN ('single', 'double', 'triple', 'dormitory')),
  gender_preference TEXT NOT NULL CHECK (gender_preference IN ('male', 'female', 'any')),
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  available_rooms INTEGER NOT NULL DEFAULT 0,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pg_id UUID REFERENCES pgs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pg_id, user_id) -- One review per user per PG
);

-- Bookings table
CREATE TABLE bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pg_id UUID REFERENCES pgs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Favorites table (optional)
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pg_id UUID REFERENCES pgs(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, pg_id)
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pgs_updated_at 
  BEFORE UPDATE ON pgs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at 
  BEFORE UPDATE ON bookings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update PG rating when review is added/updated/deleted
CREATE OR REPLACE FUNCTION update_pg_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE pgs SET 
      rating = COALESCE((
        SELECT AVG(rating) 
        FROM reviews 
        WHERE pg_id = OLD.pg_id
      ), 0),
      total_reviews = (
        SELECT COUNT(*) 
        FROM reviews 
        WHERE pg_id = OLD.pg_id
      )
    WHERE id = OLD.pg_id;
    RETURN OLD;
  ELSE
    UPDATE pgs SET 
      rating = (
        SELECT AVG(rating) 
        FROM reviews 
        WHERE pg_id = NEW.pg_id
      ),
      total_reviews = (
        SELECT COUNT(*) 
        FROM reviews 
        WHERE pg_id = NEW.pg_id
      )
    WHERE id = NEW.pg_id;
    RETURN NEW;
  END IF;
END;
$$ language 'plpgsql';

-- Trigger for updating PG rating
CREATE TRIGGER update_pg_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_pg_rating();

-- Row Level Security Policies

-- Profiles: Users can read all profiles but only update their own
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- PGs: Anyone can read, only owners can create/update/delete
ALTER TABLE pgs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "PGs are viewable by everyone" ON pgs
  FOR SELECT USING (true);

CREATE POLICY "Owners can insert their own PGs" ON pgs
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their own PGs" ON pgs
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own PGs" ON pgs
  FOR DELETE USING (auth.uid() = owner_id);

-- Reviews: Users can read all, but only create/update their own
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Bookings: Users can see their own bookings, owners can see bookings for their PGs
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owners can view bookings for their PGs" ON bookings
  FOR SELECT USING (
    auth.uid() IN (
      SELECT owner_id FROM pgs WHERE id = bookings.pg_id
    )
  );

CREATE POLICY "Users can insert their own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Owners can update bookings for their PGs" ON bookings
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT owner_id FROM pgs WHERE id = bookings.pg_id
    )
  );

-- Favorites: Users can only see and modify their own favorites
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for better performance
CREATE INDEX idx_pgs_city ON pgs(city);
CREATE INDEX idx_pgs_owner_id ON pgs(owner_id);
CREATE INDEX idx_pgs_price ON pgs(price_per_month);
CREATE INDEX idx_pgs_rating ON pgs(rating);
CREATE INDEX idx_pgs_room_type ON pgs(room_type);
CREATE INDEX idx_pgs_gender_preference ON pgs(gender_preference);
CREATE INDEX idx_pgs_created_at ON pgs(created_at);

CREATE INDEX idx_reviews_pg_id ON reviews(pg_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

CREATE INDEX idx_bookings_pg_id ON bookings(pg_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_pg_id ON favorites(pg_id);

-- Storage bucket for PG images (run this in Supabase Dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pg-images', 'pg-images', true);

-- Storage policies for pg-images bucket
-- CREATE POLICY "Anyone can view PG images" ON storage.objects
--   FOR SELECT USING (bucket_id = 'pg-images');

-- CREATE POLICY "Authenticated users can upload PG images" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'pg-images' AND auth.role() = 'authenticated');

-- CREATE POLICY "Users can update their own PG images" ON storage.objects
--   FOR UPDATE USING (bucket_id = 'pg-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Users can delete their own PG images" ON storage.objects
--   FOR DELETE USING (bucket_id = 'pg-images' AND auth.uid()::text = (storage.foldername(name))[1]);
