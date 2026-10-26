import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Profile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  isOwner: boolean;
  signIn: (email: string, password?: string) => Promise<{ error?: string; profile?: Profile | null }>;
  signUp: (
    email: string,
    password?: string,
    fullName?: string,
    phone?: string,
    isOwner?: boolean
  ) => Promise<{ error?: string; requiresEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  session: null,
  loading: true,
  isOwner: false,
  signIn: async () => ({ error: 'Auth not initialized' }),
  signUp: async () => ({ error: 'Auth not initialized' }),
  signOut: async () => { },
  refreshProfile: async () => { },
  updateProfile: async () => ({ error: 'Auth not initialized' }),
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch or create profile for authenticated user
  const fetchProfile = async (userId: string, userEmail?: string): Promise<Profile | null> => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error.message);
      }

      if (data) {
        const formatted = {
          ...data,
          is_owner: (data.role || '').toUpperCase() === 'OWNER',
        };
        setProfile(formatted as Profile);
        return formatted as Profile;
      }

      // If user is authenticated in Supabase Auth but profile row is missing, insert one
      if (userEmail) {
        const newProfile: any = {
          id: userId,
          email: userEmail.trim().toLowerCase(),
          full_name: userEmail.split('@')[0],
          role: 'USER',
        };
        const { data: inserted, error: insertErr } = await supabase
          .from('profiles')
          .insert([newProfile])
          .select()
          .single();

        if (!insertErr && inserted) {
          const formatted = {
            ...inserted,
            is_owner: (inserted as any).role === 'OWNER',
          };
          setProfile(formatted as Profile);
          return formatted as Profile;
        }
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
    }
    return null;
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Initial session lookup warning:', error.message);
        }

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user || null);
          if (initialSession?.user) {
            await fetchProfile(initialSession.user.id, initialSession.user.email);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user || null);

      if (newSession?.user) {
        await fetchProfile(newSession.user.id, newSession.user.email);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id, user.email);
    }
  };

  const signIn = async (email: string, password: string = 'Password123!') => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Supabase credentials are not yet configured in .env.local. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      };
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!cleanEmail) {
      return { error: 'Please enter your email address.' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        if (error.message.includes('Email not confirmed')) {
          return {
            error:
              'Email address not yet confirmed. Please check your inbox for the verification link, or disable "Confirm email" in Supabase Dashboard > Authentication > Providers > Email.',
          };
        }
        if (error.message.includes('Invalid login credentials')) {
          return { error: 'Invalid email or password. Please verify your credentials and try again.' };
        }
        return { error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        const fetchedProfile = await fetchProfile(data.user.id, data.user.email);
        return { profile: fetchedProfile };
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'An error occurred during sign in.' };
    }
  };

  const signUp = async (
    email: string,
    password: string = 'Password123!',
    fullName?: string,
    phone?: string,
    isOwner: boolean = false
  ) => {
    if (!isSupabaseConfigured) {
      return {
        error: 'Supabase credentials are not yet configured in .env.local. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
      };
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = phone ? String(phone).trim() : '';

    // Client-side format sanity checks
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      return { error: 'Please enter a valid email address (e.g. name@gmail.com).' };
    }
    if (!password || password.length < 6) {
      return { error: 'Password must be at least 6 characters long.' };
    }

    // Try server-side admin registration endpoint first (bypasses rate limit if service role key is present)
    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          fullName: fullName?.trim(),
          phone: cleanPhone,
          isOwner,
        }),
      });

      if (regRes.ok) {
        const regData = await regRes.json();
        if (regData.success) {
          // User was created with email_confirm: true on the server!
          // Now sign in immediately to obtain user session
          const signInRes = await signIn(cleanEmail, password);
          if (signInRes.error) {
            return { error: signInRes.error };
          }
          return {};
        }
      } else {
        const regData = await regRes.json().catch(() => ({}));
        if (!regData.fallbackToClient) {
          return { error: regData.error || 'Server registration failed' };
        }
      }
    } catch (apiErr) {
      // If API route failed or network error, proceed to client fallback
      console.warn('Server registration route skipped, falling back to client signup:', apiErr);
    }

    // Fallback: Standard client-side Supabase Auth signUp
    try {
      const userRole = isOwner ? 'OWNER' : 'USER';
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName?.trim(),
            phone: cleanPhone,
            role: userRole,
          },
        },
      });

      if (error) {
        if (
          error.status === 429 ||
          error.message?.toLowerCase().includes('rate limit') ||
          (error as any).code === 'over_email_send_rate_limit'
        ) {
          return {
            error:
              'Supabase email rate limit exceeded (Free tier default mailer allows only ~3 confirmation emails per hour).\n\nTo fix this: Go to your Supabase Dashboard > Authentication > Providers > Email, and turn OFF "Confirm email". This allows instant, unlimited registrations.',
          };
        }
        if (
          error.status === 400 &&
          (error.message?.toLowerCase().includes('validate email') ||
            error.message?.toLowerCase().includes('invalid format'))
        ) {
          return {
            error:
              'Invalid email format. Please provide a standard email address (e.g. name@gmail.com) and avoid test or disposable domains.',
          };
        }
        if (error.message?.toLowerCase().includes('already registered')) {
          return {
            error: 'An account with this email address already exists. Please sign in instead.',
          };
        }
        return { error: error.message };
      }

      // Check if user already exists (Supabase Gotrue returns user with empty identities when email confirmation is active)
      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        return {
          error: 'An account with this email address already exists. Please sign in instead.',
        };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);

        // 1. Explicitly create profile entry
        try {
          const profilePayload: any = {
            id: data.user.id,
            email: cleanEmail,
            full_name: fullName?.trim() || cleanEmail.split('@')[0],
            phone: cleanPhone || null,
            role: userRole,
          };

          const { error: profileErr } = await supabase.from('profiles').upsert(profilePayload);
          if (profileErr) {
            console.warn('Profile upsert note:', profileErr.message);
          }

          // 2. If owner, ensure entry in `owners` table
          if (isOwner) {
            const { error: ownerErr } = await supabase.from('owners').upsert({
              profile_id: data.user.id,
              business_name: fullName?.trim() || 'PG Host Operator',
              verification_status: 'pending',
            }, { onConflict: 'profile_id' });
            if (ownerErr) {
              console.warn('Owner record note:', ownerErr.message);
            }
          }

          await fetchProfile(data.user.id, cleanEmail);
        } catch (e) {
          console.warn('Profile/Owner creation error:', e);
        }

        // If email confirmation is enabled on Supabase, session is null until user confirms via email
        if (!data.session) {
          return { requiresEmailConfirmation: true };
        }
      }

      return {};
    } catch (err: any) {
      return { error: err.message || 'An error occurred during registration.' };
    }
  };

  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Supabase signOut notice:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      if (typeof window !== 'undefined') {
        try {
          // Clear any cached Supabase tokens in localStorage to prevent stale session persistence
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('sb-') || key.includes('supabase.auth.token')) {
              localStorage.removeItem(key);
            }
          });
          sessionStorage.clear();
        } catch (e) {
          console.warn('Storage purge notice:', e);
        }
      }
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !isSupabaseConfigured) {
      return { error: 'Not authenticated' };
    }

    try {
      // Security: Strip role, is_owner, and id fields to prevent client-side privilege escalation
      const safeUpdates = { ...(updates as any) };
      delete safeUpdates.role;
      delete safeUpdates.is_owner;
      delete safeUpdates.id;

      const { data, error } = await supabase
        .from('profiles')
        .update(safeUpdates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) return { error: error.message };

      if (data) {
        setProfile({
          ...data,
          is_owner: (data as any).role === 'OWNER',
        } as Profile);
      }
      return {};
    } catch (err: any) {
      return { error: err.message || 'Failed to update profile' };
    }
  };

  const isOwner = useMemo(() => {
    const roleUpper = (profile?.role || '').toUpperCase();
    return roleUpper === 'OWNER' || Boolean(profile?.is_owner);
  }, [profile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isOwner,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
