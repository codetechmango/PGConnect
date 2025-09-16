import { supabase } from './supabaseClient';
import { User } from '@supabase/supabase-js';

export interface AuthUser extends User {
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  is_owner: boolean;
  created_at: string;
  updated_at: string;
}

// Auth state management
export const getCurrentUser = async (): Promise<{ user: AuthUser | null; error: any }> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  } catch (error) {
    return { user: null, error };
  }
};

export const getCurrentSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    return { session: null, error };
  }
};

// Authentication functions
export const signUp = async (
  email: string, 
  password: string, 
  metadata?: { full_name?: string }
) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { error };
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const updatePassword = async (password: string) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password
    });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Profile management
export const getUserProfile = async (userId: string): Promise<{ profile: Profile | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { profile: data, error };
  } catch (error) {
    return { profile: null, error };
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const createUserProfile = async (user: AuthUser) => {
  try {
    const profileData = {
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || '',
      avatar_url: user.user_metadata?.avatar_url || '',
      is_owner: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .upsert(profileData)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Owner-specific functions
export const becomeOwner = async (userId: string, additionalData?: { phone?: string; full_name?: string }) => {
  try {
    const updates: Partial<Profile> = {
      is_owner: true,
      ...additionalData
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const checkOwnerStatus = async (userId: string): Promise<{ isOwner: boolean; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_owner')
      .eq('id', userId)
      .single();
    
    return { isOwner: data?.is_owner || false, error };
  } catch (error) {
    return { isOwner: false, error };
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};

// Helper functions
export const isAuthenticated = async (): Promise<boolean> => {
  const { user } = await getCurrentUser();
  return !!user;
};

export const requireAuth = async (): Promise<{ user: AuthUser; profile: Profile } | null> => {
  const { user } = await getCurrentUser();
  if (!user) return null;

  const { profile } = await getUserProfile(user.id);
  if (!profile) return null;

  return { user, profile };
};

export const requireOwner = async (): Promise<{ user: AuthUser; profile: Profile } | null> => {
  const authData = await requireAuth();
  if (!authData || !authData.profile.is_owner) return null;
  
  return authData;
};
