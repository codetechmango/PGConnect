-- ==============================================================================
-- PG CONNECT: Property Visit & Notification Migration Fix
-- Execute this script in your Supabase SQL Editor if you want database-level schema updates.
-- ==============================================================================

-- 1. Ensure 'twin' is a recognized room_type_enum value (or safely add it if enum exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'room_type_enum') THEN
    ALTER TYPE room_type_enum ADD VALUE IF NOT EXISTS 'twin';
  END IF;
END $$;

-- 2. Make room_id nullable in bookings table so that property visits (which occur before room allocation) can be recorded
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'room_id'
  ) THEN
    ALTER TABLE bookings ALTER COLUMN room_id DROP NOT NULL;
  END IF;
END $$;

-- 3. Ensure notifications table has the required columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE TABLE notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'general',
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

-- 4. Set RLS policies for notifications so users can insert and read their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications"
      ON notifications FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Authenticated users can insert notifications'
  ) THEN
    CREATE POLICY "Authenticated users can insert notifications"
      ON notifications FOR INSERT
      WITH CHECK (auth.role() = 'authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND policyname = 'Users can update their own notifications'
  ) THEN
    CREATE POLICY "Users can update their own notifications"
      ON notifications FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. RLS policies for bookings: allow authenticated users to schedule visits and owners to view & update
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Users can insert bookings'
  ) THEN
    CREATE POLICY "Users can insert bookings"
      ON bookings FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Users can view own bookings or owners view their property bookings'
  ) THEN
    CREATE POLICY "Users can view own bookings or owners view their property bookings"
      ON bookings FOR SELECT
      USING (auth.uid() = user_id OR auth.uid() = owner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'Owners and residents can update bookings'
  ) THEN
    CREATE POLICY "Owners and residents can update bookings"
      ON bookings FOR UPDATE
      USING (auth.uid() = user_id OR auth.uid() = owner_id);
  END IF;
END $$;
