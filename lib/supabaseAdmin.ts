import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables for admin client');
}

// Admin client with service role key for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper functions for admin operations
export const createUserProfile = async (userId: string, profileData: Record<string, unknown>) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: userId,
      ...profileData,
    });
  return { data, error };
};

export const updateUserProfile = async (userId: string, updates: Record<string, unknown>) => {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  return { data, error };
};

export const deleteUser = async (userId: string) => {
  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  return { data, error };
};

export const createBookingAsAdmin = async (bookingData: Record<string, unknown>) => {
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .insert(bookingData);
  return { data, error };
};
