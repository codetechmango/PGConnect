import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { SearchBar } from '../components/SearchBar';
import { PGCard } from '../components/PGCard';
import { BookingModal } from '../components/BookingModal';
import { PG } from '../types';
import { fetchProperties, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAuth } from '../lib/authContext';

export default function HomePage() {
  const { user, isOwner } = useAuth();
  const [pgs, setPgs] = useState<PG[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'student' | 'pro' | 'budget'>('all');
  const [selectedPgForVisit, setSelectedPgForVisit] = useState<PG | null>(null);

  useEffect(() => {
    async function fetchFeaturedPGs() {
      setLoading(true);
      if (isSupabaseConfigured) {
        try {
          const data = await fetchProperties();
          if (data) {
            setPgs(data);
          }
        } catch (err) {
          console.error('Error fetching properties from Supabase:', err);
        }
      }
      setLoading(false);
    }

    fetchFeaturedPGs();
  }, []);

  const filteredPgs = pgs.filter((pg) => {
    if (selectedCategory === 'student') return pg.price_per_month <= 12000 || pg.room_type === 'triple';
    if (selectedCategory === 'pro') return pg.room_type === 'single' || pg.room_type === 'double';
    if (selectedCategory === 'budget') return pg.price_per_month <= 10000;
    return true;
  });

  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
      <Head>
        <title>PG Connect | Find a PG That Feels Like Home</title>
      </Head>

      <Navbar activeTab="home" />

      <main className="w-full pt-20 bg-surface flex-1">
        {/* HERO SECTION */}
        <section className="relative w-full bg-surface-container-low overflow-hidden pb-16 pt-8 md:pt-14 border-b border-outline-variant/30">
          {/* Ambient Backdrop Glows */}
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-secondary-container/30 blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/4 right-0 w-80 h-80 rounded-full bg-primary-fixed/40 blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
            {/* Trust Indicator Pills */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6 p-1.5 rounded-full bg-white shadow-xs border border-outline-variant/30">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                <span className="material-symbols-outlined text-[14px]">verified</span>
                100% Physically Audited
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">price_check</span>
                Zero Hidden Brokerage
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">handshake</span>
                Direct Owner Connect
              </span>
              <span className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-semibold">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                Instant Escrow Protection
              </span>
            </div>

            {/* Hero Typography */}
            <div className="text-center max-w-4xl flex flex-col items-center gap-3 mb-8">
              <h1 className="font-headline-xl text-3xl sm:text-5xl lg:text-6xl text-primary font-extrabold tracking-tight">
                Find a PG That Feels Like Home
              </h1>
              <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl font-normal leading-relaxed">
                Discover verified, secure, and fully-managed paying guest accommodations across India&apos;s top education and tech hubs.
              </p>
            </div>

            {/* High-Conversion Multi-Parameter Search Widget */}
            <SearchBar />

            {/* Trending Location Hub Chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-4xl mt-6">
              <span className="text-xs text-on-surface-variant font-medium">Trending Hubs:</span>
              {[
                { city: 'Bangalore', label: 'Koramangala, BLR' },
                { city: 'Bangalore', label: 'HSR Layout' },
                { city: 'Bangalore', label: 'Whitefield' },
                { city: 'Hyderabad', label: 'Madhapur, HYD' },
                { city: 'Pune', label: 'Viman Nagar, Pune' },
                { city: 'Chennai', label: 'Velachery, Chennai' },
              ].map((hub, idx) => (
                <Link
                  key={idx}
                  href={`/search?city=${hub.city}&q=${encodeURIComponent(hub.label.split(',')[0])}`}
                  className="px-3 py-1 rounded-full bg-white text-on-surface text-xs font-medium shadow-xs hover:bg-surface-container-high transition-colors flex items-center gap-1 border border-outline-variant/30"
                >
                  <span className="material-symbols-outlined text-secondary text-sm">location_on</span>
                  <span>{hub.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* 4 VALUE PROPOSITIONS (BENTO-STYLE CARDS) */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="why-pg-connect">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider">
                  The PG Connect Standard
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-primary font-headline-lg tracking-tight">
                Renting Reimagined for India&apos;s New Generation
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant max-w-md">
              We replaced shady brokers and surprise lease deductions with transparent physical auditing and bank-grade digital tenancy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-outline-variant/30 group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">verified_user</span>
                </div>
                <h3 className="font-bold text-base text-on-surface mb-2 font-title-card">
                  Physically Audited Stays
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Every PG undergoes a comprehensive 45-point audit covering biometric locks, kitchen hygiene, fire compliance, and real Wi-Fi tests.
                </p>
              </div>
              <div className="mt-6 pt-4 flex items-center gap-1 text-secondary text-xs font-bold">
                <span>45-Point Checklist</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-outline-variant/30 group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary mb-5 group-hover:bg-secondary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">money_off</span>
                </div>
                <h3 className="font-bold text-base text-on-surface mb-2 font-title-card">
                  Zero Brokerage Guarantee
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Direct rates negotiated transparently with PG proprietors. No hidden broker cuts, unitemized electricity fees, or surprise markups.
                </p>
              </div>
              <div className="mt-6 pt-4 flex items-center gap-1 text-secondary text-xs font-bold">
                <span>Direct Owner Pricing</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-outline-variant/30 group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary-container mb-5 group-hover:bg-primary-container group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">handyman</span>
                </div>
                <h3 className="font-bold text-base text-on-surface mb-2 font-title-card">
                  6-Hour Repair SLA
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Instant ticket logging with Urban Company technicians. Rapid fixes for plumbing, electrical, and Wi-Fi issues guaranteed by our SLA.
                </p>
              </div>
              <Link href="/resident/tickets" className="mt-6 pt-4 flex items-center gap-1 text-secondary text-xs font-bold hover:underline">
                <span>Maintenance SLA Tracker</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {/* Feature 4 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between border border-outline-variant/30 group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary mb-5 group-hover:bg-secondary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-2xl">account_balance</span>
                </div>
                <h3 className="font-bold text-base text-on-surface mb-2 font-title-card">
                  Escrow-Protected Deposits
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Your security deposit is locked in ICICI Bank escrow. Peace of mind move-out with guaranteed settlement within 7 business days.
                </p>
              </div>
              <div className="mt-6 pt-4 flex items-center gap-1 text-secondary text-xs font-bold">
                <span>Bank-Grade Escrow</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          </div>
        </section>

        {/* CURATED COLLECTIONS & FEATURED PROPERTIES */}
        <section className="w-full bg-surface-container-low py-16 border-y border-outline-variant/30" id="featured-listings">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div>
                <span className="text-xs text-secondary font-bold uppercase tracking-wider">
                  Curated Collections
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-primary font-headline-lg tracking-tight">
                  Verified Stays in High Demand
                </h2>
              </div>

              {/* Segmented Tab Switchers */}
              <div className="flex flex-wrap items-center gap-2 p-1.5 bg-surface-container rounded-xl shadow-inner border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === 'all'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  All Properties
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('student')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === 'student'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  For Students
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('pro')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === 'pro'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Working Professionals
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('budget')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    selectedCategory === 'budget'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Pocket Friendly (&lt;₹10k)
                </button>
              </div>
            </div>

            {/* Properties Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-outline-variant/30"></div>
                ))}
              </div>
            ) : filteredPgs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredPgs.map((pg) => (
                  <PGCard
                    key={pg.id}
                    pg={pg}
                    onScheduleVisit={(p) => setSelectedPgForVisit(p)}
                  />
                ))}
              </div>
            ) : (
              /* Polished Empty State */
              <div className="bg-white rounded-3xl p-12 text-center max-w-xl mx-auto border border-outline-variant/30 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-container text-primary mx-auto flex items-center justify-center">
                  <span className="material-symbols-outlined text-3xl">apartment</span>
                </div>
                <h3 className="text-xl font-bold text-on-surface">No Properties Found Yet</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  The database has no published accommodations matching this filter. PG owners can add listings using the Add Property Wizard, or explore other locations.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  {(!user || isOwner) && (
                    <Link
                      href="/owner/add-property"
                      className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-container shadow-sm"
                    >
                      + Add PG Listing
                    </Link>
                  )}
                  <Link
                    href="/search"
                    className="px-4 py-2 rounded-xl bg-surface-container text-primary text-xs font-bold hover:bg-surface-container-high"
                  >
                    Explore Catalog
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-10 text-center">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary-container transition-all hover:scale-[1.02]"
              >
                <span>Browse All 48+ Verified Stays</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS 3-STEP FLOW */}
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16" id="how-it-works">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs text-secondary font-bold uppercase tracking-wider">
              Hassle-Free Tenancy
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-primary font-headline-lg tracking-tight mt-1">
              Move In In 3 Easy Steps
            </h2>
            <p className="text-sm text-on-surface-variant mt-2">
              From discovering the ideal locality to sleeping in your new bed—completely digital and broker-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 text-center space-y-3 relative">
              <div className="w-12 h-12 rounded-full bg-primary-fixed text-on-primary-fixed font-bold text-lg mx-auto flex items-center justify-center">
                01
              </div>
              <h3 className="font-bold text-base text-on-surface">Explore Verified Spaces</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Filter by verified Wi-Fi speed, mess meal inclusions, gate timings, and student vs tech-park proximity.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 text-center space-y-3 relative">
              <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container font-bold text-lg mx-auto flex items-center justify-center">
                02
              </div>
              <h3 className="font-bold text-base text-on-surface">Schedule Visit or VR Tour</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Book a free in-person property visit with dynamic gate pass OTP, or inspect panoramic 360° virtual rooms online.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-outline-variant/30 text-center space-y-3 relative">
              <div className="w-12 h-12 rounded-full bg-surface-container-highest text-primary font-bold text-lg mx-auto flex items-center justify-center">
                03
              </div>
              <h3 className="font-bold text-base text-on-surface">Lock Deposit in Escrow</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Pay your deposit safely into ICICI Escrow. Sign your digital lease agreement and collect your biometric keys on day 1.
              </p>
            </div>
          </div>
        </section>

        {/* OWNER CALLOUT BANNER - Only shown to visitors and owners, hidden for residents */}
        {(!user || isOwner) && (
          <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="relative w-full rounded-3xl bg-gradient-to-r from-primary via-[#12285e] to-primary-container p-8 sm:p-12 text-white overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-secondary/30 blur-2xl pointer-events-none"></div>

              <div className="relative z-10 max-w-xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-secondary-fixed">
                  <span className="material-symbols-outlined text-sm">domain</span>
                  <span className="uppercase tracking-wider">For PG Owners &amp; Hostels</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  Own a PG? Maximize Your Occupancy With Zero Hassle.
                </h2>
                <p className="text-sm text-blue-100/90 leading-relaxed">
                  List your property in under 10 minutes. Get verified corporate and student tenants with complete police &amp; KYC verification. Enjoy{' '}
                  <span className="text-white font-semibold">0% commission for your first 60 days</span>.
                </p>

                <div className="flex items-center gap-6 pt-2">
                  <div>
                    <span className="text-xl font-bold block text-secondary-fixed">94%</span>
                    <span className="text-[11px] text-blue-200">Avg. Occupancy</span>
                  </div>
                  <div className="w-px h-8 bg-white/20"></div>
                  <div>
                    <span className="text-xl font-bold block text-secondary-fixed">48 Hrs</span>
                    <span className="text-[11px] text-blue-200">Tenant Placement</span>
                  </div>
                  <div className="w-px h-8 bg-white/20"></div>
                  <div>
                    <span className="text-xl font-bold block text-secondary-fixed">₹0</span>
                    <span className="text-[11px] text-blue-200">Listing Fee</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <Link
                  href="/owner/add-property"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-secondary text-white hover:bg-[#005a52] font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">add_business</span>
                  <span>List Your PG Now</span>
                </Link>
                <Link
                  href="/owner/dashboard"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm flex items-center justify-center gap-1.5 transition-colors border border-white/20"
                >
                  <span>Owner Hub Demo</span>
                  <span className="material-symbols-outlined text-base">dashboard</span>
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Booking Modal */}
      <BookingModal
        pg={selectedPgForVisit}
        isOpen={Boolean(selectedPgForVisit)}
        onClose={() => setSelectedPgForVisit(null)}
      />

      <Footer />
    </div>
  );
}
