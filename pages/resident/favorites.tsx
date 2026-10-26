import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { PGCard } from '../../components/PGCard';
import { BookingModal } from '../../components/BookingModal';
import { PG } from '../../types';
import { isSupabaseConfigured, fetchUserWishlist } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/authContext';

export default function FavoritesPage() {
  const { user } = useAuth();
  const [favoritePgs, setFavoritePgs] = useState<PG[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPgForVisit, setSelectedPgForVisit] = useState<PG | null>(null);

  useEffect(() => {
    async function loadFavorites() {
      setLoading(true);
      if (isSupabaseConfigured && user) {
        try {
          const items = await fetchUserWishlist(user.id);
          const list = items.map((it: any) => it.property).filter(Boolean);
          setFavoritePgs(list);
        } catch (err) {
          console.error('Error fetching favorites:', err);
        }
      }
      setLoading(false);
    }

    loadFavorites();
  }, [user]);

  const handleFavoriteToggle = (pgId: string, newState: boolean) => {
    if (!newState) {
      setFavoritePgs(favoritePgs.filter((p) => p.id !== pgId));
    }
  };

  return (
    <ProtectedRoute requiredRole="ANY_AUTHENTICATED">
      <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
        <Head>
          <title>Saved Properties | PG Connect</title>
        </Head>

      <Navbar activeTab="favorites" />

      <main className="w-full pt-20 flex-1">
        {/* SUBHEADER */}
        <section className="bg-white border-b border-outline-variant/30 py-5 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-error text-xs font-bold uppercase tracking-wider">
                    Wishlist
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {favoritePgs.length} Saved Stays
                  </span>
                </div>
                <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mt-1">
                  My Saved Accommodations
                </h1>
                <p className="text-xs text-on-surface-variant">
                  Keep track of your preferred properties, compare tariffs, and schedule free physical visits.
                </p>
              </div>

              <Link
                href="/search"
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-base">search</span>
                <span>Discover More PGs</span>
              </Link>
            </div>
          </div>
        </section>

        {/* MAIN GRID */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-outline-variant/30"></div>
              ))}
            </div>
          ) : favoritePgs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoritePgs.map((pg) => (
                <PGCard
                  key={pg.id}
                  pg={pg}
                  isFavorited={true}
                  onFavoriteToggle={handleFavoriteToggle}
                  onScheduleVisit={(p) => setSelectedPgForVisit(p)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center max-w-lg mx-auto border border-outline-variant/30 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-surface-container text-error mx-auto flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">favorite_border</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface font-headline-sm">
                No Saved Accommodations Yet
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Click the heart icon on any PG card to bookmark accommodations for quick comparison and easy visit scheduling.
              </p>
              <Link
                href="/search"
                className="inline-block px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container shadow-xs"
              >
                Browse Catalog →
              </Link>
            </div>
          )}
        </section>
      </main>

      {/* Booking Modal */}
      <BookingModal
        pg={selectedPgForVisit}
        isOpen={Boolean(selectedPgForVisit)}
        onClose={() => setSelectedPgForVisit(null)}
      />

      <Footer />
    </div>
    </ProtectedRoute>
  );
}
