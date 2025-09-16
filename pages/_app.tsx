import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      // Handle auth state changes if needed
      if (event === 'SIGNED_OUT') {
        // Redirect to home on sign out
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Pages that don't need navbar
  const pagesWithoutNavbar = ['/auth/signin', '/auth/signup'];
  const showNavbar = !pagesWithoutNavbar.includes(router.pathname);

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavbar && <Navbar />}
      <main className={showNavbar ? 'pt-0' : ''}>
        <Component {...pageProps} />
      </main>
    </div>
  );
}
