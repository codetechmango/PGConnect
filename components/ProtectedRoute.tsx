import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/authContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'OWNER' | 'RESIDENT' | 'ANY_AUTHENTICATED';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'ANY_AUTHENTICATED',
}) => {
  const router = useRouter();
  const { user, isOwner, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    // 1. Not authenticated -> Redirect to sign-in
    if (!user) {
      if (router.pathname.startsWith('/auth/')) return;
      const targetRole = requiredRole === 'OWNER' ? 'owner' : 'resident';
      router.replace(`/auth/signin?role=${targetRole}&redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    // 2. Owner-only route requested, but user is NOT an owner -> Redirect to resident dashboard
    if (requiredRole === 'OWNER' && !isOwner) {
      console.warn('Unauthorized access attempt: Resident account attempted to access owner route.');
      router.replace('/resident/dashboard');
      return;
    }

    // 3. Resident-only route requested, but user is an owner -> Redirect to owner dashboard
    if (requiredRole === 'RESIDENT' && isOwner) {
      console.warn('Owner account attempting to access resident portal: redirecting to owner dashboard.');
      router.replace('/owner/dashboard');
      return;
    }
  }, [user, isOwner, loading, requiredRole, router]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg animate-pulse mb-4">
          <span className="material-symbols-outlined text-2xl">apartment</span>
        </div>
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
          <span>Verifying authentication &amp; access permissions...</span>
        </div>
      </div>
    );
  }

  // If unauthenticated or role mismatch, prevent render during redirect
  if (
    !user ||
    (requiredRole === 'OWNER' && !isOwner) ||
    (requiredRole === 'RESIDENT' && isOwner)
  ) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-error-container text-on-error-container flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-2xl">lock</span>
        </div>
        <p className="text-sm font-bold text-on-surface">Redirecting to authorized portal...</p>
      </div>
    );
  }

  return <>{children}</>;
};
