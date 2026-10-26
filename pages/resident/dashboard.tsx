import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { Booking } from '../../types';
import { fetchBookings, updateBookingStatus } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/authContext';

export default function ResidentDashboardPage() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [activeBookings, setActiveBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [skipDinner, setSkipDinner] = useState(false);
  const [gatePassOtp, setGatePassOtp] = useState<string>('842910');
  const [gatePassCopied, setGatePassCopied] = useState(false);
  const [wifiCopied, setWifiCopied] = useState(false);
  const [copiedOtpId, setCopiedOtpId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchBookings(user.id, false);
      setActiveBookings(data as Booking[]);
    } catch (err) {
      console.error('Error loading resident stays & visits:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserData();

    const handleRefresh = () => {
      loadUserData();
    };

    window.addEventListener('pgconnect_bookings_updated', handleRefresh);
    window.addEventListener('pgconnect_notifications_updated', handleRefresh);
    return () => {
      window.removeEventListener('pgconnect_bookings_updated', handleRefresh);
      window.removeEventListener('pgconnect_notifications_updated', handleRefresh);
    };
  }, [loadUserData]);

  const handleCancelVisit = async (visitId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled property visit?')) return;
    try {
      await updateBookingStatus(visitId, 'cancelled', 'Cancelled by resident');
      setActionNotice('Your scheduled visit has been cancelled.');
      setTimeout(() => setActionNotice(null), 3500);
      loadUserData();
    } catch (err) {
      console.error('Failed to cancel visit:', err);
    }
  };

  const copyVisitOtp = (otp: string, id: string) => {
    navigator.clipboard?.writeText(otp);
    setCopiedOtpId(id);
    setTimeout(() => setCopiedOtpId(null), 2000);
  };

  const generateNewGatePass = () => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGatePassOtp(newOtp);
    alert(`New Biometric Gate Pass Generated: ${newOtp} (Valid for 15 minutes)`);
  };

  const copyWifi = () => {
    navigator.clipboard?.writeText('orchid#204blr');
    setWifiCopied(true);
    setTimeout(() => setWifiCopied(false), 2000);
  };

  const visits = activeBookings.filter(
    (b) =>
      b.booking_type === 'visit' ||
      b.deposit_amount === 0 ||
      (b.notes && b.notes.toUpperCase().includes('VISIT'))
  );
  const activeStays = activeBookings.filter(
    (b) =>
      b.booking_type !== 'visit' &&
      (b.deposit_amount ? b.deposit_amount > 0 : false) &&
      !(b.notes && b.notes.toUpperCase().includes('VISIT'))
  );

  const primaryStay = activeStays[0] || activeBookings[0];
  const propertyTitle = primaryStay?.pgs?.title || primaryStay?.property?.title || 'Serenity Stays Luxury Co-Living';
  const propertyAddress = primaryStay?.pgs?.address || primaryStay?.property?.address || 'HSR Layout Sector 2, Bengaluru';

  return (
    <ProtectedRoute requiredRole="RESIDENT">
      <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
      <Head>
        <title>Resident Stay Dashboard | PG Connect</title>
      </Head>

      <Navbar activeTab="resident-dashboard" />

      <main className="w-full pt-20 flex-1">
        {/* SUBHEADER: RESIDENT WELCOME BANNER */}
        <section className="bg-white border-b border-outline-variant/30 py-5 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider">
                    Resident Stay Portal
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Room #204 • Bed A (Twin Sharing)
                  </span>
                </div>
                <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mt-1">
                  Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'Resident'}
                </h1>
                <p className="text-xs text-on-surface-variant">
                  {propertyTitle} • {propertyAddress}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={generateNewGatePass}
                  className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-[#005a52] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">passkey</span>
                  <span>Turnstile Gate Pass</span>
                </button>

                <Link
                  href="/resident/tickets"
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">handyman</span>
                  <span>Raise Ticket</span>
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    router.replace('/auth/signin');
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant/60 hover:bg-red-50 hover:border-red-300 text-error text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                  title="Sign Out"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4 PRIMARY KPI SUMMARY CARDS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1: Rent & Dues */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Upcoming Rent &amp; Dues
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">calendar_clock</span>
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-extrabold text-on-surface tabular-nums">₹14,500</span>
                  <span className="text-xs text-on-surface-variant">/ Nov cycle</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                  <span>Due Nov 05 • 3 Days Grace Period</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-container-low flex items-center justify-between text-xs">
                <span className="text-secondary font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">bolt</span> 0% UPI Fee
                </span>
                <button
                  type="button"
                  onClick={() => alert('Rent payment portal: Redirecting to ICICI UPI gateway... (Zero convenience fee)')}
                  className="text-primary hover:underline font-bold"
                >
                  Pay Now →
                </button>
              </div>
            </div>

            {/* KPI 2: Security Deposit */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Security Deposit
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-secondary-container/40 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      lock
                    </span>
                  </span>
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-extrabold text-on-surface tabular-nums">₹29,000</span>
                  <span className="text-xs text-secondary font-bold">100% Protected</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Held in verified ICICI Bank Escrow #ES-883921. Guaranteed zero unauthorized deduction.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-container-low flex items-center justify-between text-xs">
                <span className="text-on-surface-variant">Lease valid 11 mos</span>
                <button
                  type="button"
                  onClick={() => alert('Escrow Certificate downloaded: ICICI Bank Escrow ID #ES-883921')}
                  className="text-primary hover:underline font-bold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">download</span> Certificate
                </button>
              </div>
            </div>

            {/* KPI 3: Today's Meals */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Today&apos;s Meals (3/4)
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">restaurant</span>
                  </span>
                </div>
                <div className="font-bold text-sm text-on-surface mb-1">Hyderabadi Veg Biryani</div>
                <p className="text-xs text-on-surface-variant mb-2">
                  Dinner serving hot at 7:30 PM • Dining Hall Floor 1
                </p>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-bold">
                    Breakfast ✅
                  </span>
                  <span className="px-2 py-0.5 rounded bg-surface-container text-secondary font-bold">
                    Lunch ✅
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-container-low flex items-center justify-between text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipDinner}
                    onChange={(e) => setSkipDinner(e.target.checked)}
                    className="w-4 h-4 rounded accent-secondary cursor-pointer"
                  />
                  <span className="text-on-surface-variant">Skip (+₹60 rebate)</span>
                </label>
                <span className="text-outline text-[11px]">Till 6:30 PM</span>
              </div>
            </div>

            {/* KPI 4: Room Wi-Fi */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                    Room Wi-Fi Credentials
                  </span>
                  <span className="w-8 h-8 rounded-lg bg-secondary-container/40 text-secondary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">wifi</span>
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-extrabold text-on-surface tabular-nums">294</span>
                  <span className="text-xs text-on-surface-variant">Mbps • 11ms Ping</span>
                </div>
                <p className="text-xs text-on-surface-variant truncate">
                  SSID: <span className="font-bold text-on-surface">Orchid_Floor2_5G</span>
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-secondary text-[11px] font-semibold">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  <span>Dual ACT Fiber (99.9% Uptime)</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-surface-container-low flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-mono text-[11px]">Pass: orchid#204blr</span>
                <button
                  type="button"
                  onClick={copyWifi}
                  className="text-primary hover:underline font-bold"
                >
                  {wifiCopied ? 'Copied!' : 'Copy Pass'}
                </button>
              </div>
            </div>
          </div>

          {actionNotice && (
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-blue-600 text-base">info</span>
                <span>{actionNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setActionNotice(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {/* SCHEDULED VISITS & INQUIRIES SECTION */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-outline-variant/30 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-surface-container-low">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">calendar_month</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-on-surface font-headline-sm">
                      My Scheduled Property Visits &amp; Inquiries
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                      {visits.length} {visits.length === 1 ? 'Visit' : 'Visits'}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Live owner confirmations, biometric turnstile passes, and direct proprietor assistance
                  </p>
                </div>
              </div>

              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold transition-colors w-fit"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Schedule New Visit</span>
              </Link>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span>Loading your property visits...</span>
              </div>
            ) : visits.length === 0 ? (
              <div className="py-8 px-4 rounded-xl bg-surface-container-low/60 border border-dashed border-outline-variant/50 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-surface-container mx-auto flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-2xl">tour</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">No Scheduled Property Visits Yet</h3>
                  <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1">
                    Looking for a new room or exploring other options? Schedule a 100% free visit with instant owner confirmation and zero agent brokerage fees.
                  </p>
                </div>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">search</span>
                  <span>Explore Verified PGs</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visits.map((visit) => {
                  const prop = visit.pgs || visit.property;
                  const title = prop?.title || prop?.name || 'Tata Homes PG';
                  const address = prop?.address || prop?.location || 'Bangalore, India';
                  const image =
                    prop?.images?.[0] ||
                    'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80';
                  const date = visit.visit_date || visit.move_in_date || visit.check_in_date;
                  const slot = visit.time_slot || '10:00 AM - 12:00 PM';
                  const sharing =
                    visit.room_type === 'double'
                      ? 'Executive Twin / Double'
                      : visit.room_type || 'Single';

                  // Deterministic 6-digit OTP for confirmed visit
                  const visitOtp =
                    (visit.metadata as any)?.gate_pass_otp ||
                    (
                      Math.abs(
                        visit.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 123456) % 900000
                      ) + 100000
                    ).toString();

                  const isConfirmed = visit.status === 'confirmed';
                  const isDeclined = visit.status === 'cancelled';
                  const isPending = !isConfirmed && !isDeclined;

                  return (
                    <div
                      key={visit.id}
                      className="p-4 sm:p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-4 hover:border-outline-variant/60 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Header: Status and Ref */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isConfirmed
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isDeclined
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isConfirmed
                                  ? 'bg-emerald-600'
                                  : isDeclined
                                  ? 'bg-rose-600'
                                  : 'bg-amber-600'
                              }`}
                            />
                            {isConfirmed
                              ? 'Visit Confirmed by Owner ✅'
                              : isDeclined
                              ? 'Visit Declined by Owner ❌'
                              : 'Pending Owner Review ⏳'}
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-mono">
                            Ref #{visit.id.slice(0, 8)}
                          </span>
                        </div>

                        {/* Property summary */}
                        <div className="flex items-start gap-3">
                          <img
                            src={image}
                            alt={title}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-outline-variant/20 shadow-2xs"
                          />
                          <div className="min-w-0 space-y-0.5">
                            <h4 className="font-bold text-sm text-on-surface truncate">{title}</h4>
                            <p className="text-xs text-on-surface-variant truncate">{address}</p>
                            <div className="flex items-center gap-2 pt-1 text-[11px] text-primary font-semibold">
                              <span className="material-symbols-outlined text-xs">meeting_room</span>
                              <span>{sharing} Sharing</span>
                            </div>
                          </div>
                        </div>

                        {/* Visit schedule badge */}
                        <div className="p-3 rounded-xl bg-white border border-outline-variant/20 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-on-surface-variant font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm text-secondary">event</span>
                              Scheduled Date:
                            </span>
                            <span className="font-bold text-on-surface">{date}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-on-surface-variant font-medium flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm text-secondary">schedule</span>
                              Time Window:
                            </span>
                            <span className="font-bold text-on-surface">{slot}</span>
                          </div>
                        </div>

                        {/* Status message or Biometric Gate Pass */}
                        {isConfirmed && (
                          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-900 to-teal-800 text-white space-y-2 shadow-xs">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-200">
                                <span className="material-symbols-outlined text-sm">sensor_door</span>
                                <span>VISITOR TURNSTILE GATE PASS</span>
                              </div>
                              <span className="text-[10px] font-semibold text-emerald-300">
                                Contactless Entry
                              </span>
                            </div>
                            <div className="flex items-center justify-between bg-black/20 px-3 py-2 rounded-lg">
                              <div>
                                <span className="text-[10px] text-white/70 block uppercase">OTP Code</span>
                                <span className="text-xl font-extrabold tracking-widest font-mono text-emerald-100">
                                  {visitOtp}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => copyVisitOtp(visitOtp, visit.id)}
                                className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
                              >
                                {copiedOtpId === visit.id ? 'Copied!' : 'Copy OTP'}
                              </button>
                            </div>
                            <p className="text-[11px] text-emerald-200 leading-tight">
                              Owner has approved your visit! Show this OTP at the turnstile gate or visitor desk on arrival.
                            </p>
                          </div>
                        )}

                        {isPending && (
                          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm text-amber-600 shrink-0 mt-0.5">hourglass_top</span>
                            <span>
                              We notified the property owner. You will receive an instant push notification and your turnstile access code once confirmed.
                            </span>
                          </div>
                        )}

                        {isDeclined && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900 leading-relaxed flex items-start gap-2">
                            <span className="material-symbols-outlined text-sm text-rose-600 shrink-0 mt-0.5">info</span>
                            <span>
                              The owner could not accommodate this specific time slot. Please reschedule or pick another verified PG home.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between gap-2">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() => handleCancelVisit(visit.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-error hover:bg-rose-50 transition-colors"
                          >
                            Cancel Visit
                          </button>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          {visit.property_id && (
                            <Link
                              href={`/pg/${visit.property_id}`}
                              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-surface-container border border-outline-variant/30 text-xs font-bold text-primary transition-colors flex items-center gap-1"
                            >
                              <span>{isDeclined ? 'Reschedule' : 'PG Details'}</span>
                              <span className="material-symbols-outlined text-xs">arrow_forward</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TWO COLUMN OPERATIONS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Food Menu & Gate Pass (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Today's Mess Menu Table */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-outline-variant/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">restaurant_menu</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-on-surface font-headline-sm">
                        Today&apos;s Mess &amp; Chef Table
                      </h2>
                      <p className="text-xs text-on-surface-variant">Hygienic Central Kitchen • Head Chef Ramu K.</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-secondary bg-secondary-container px-2.5 py-1 rounded-full">
                    Hygiene Score: 98/100
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="text-xs font-bold text-primary block">Breakfast (Served)</span>
                    <p className="text-xs text-on-surface font-medium mt-0.5">
                      Masala Dosa with Coconut Chutney &amp; Filter Coffee
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="text-xs font-bold text-primary block">Lunch (Served)</span>
                    <p className="text-xs text-on-surface font-medium mt-0.5">
                      Rajma Chawal, Boondi Raita, Phulkas &amp; Fresh Salad
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="text-xs font-bold text-primary block">Evening High Tea</span>
                    <p className="text-xs text-on-surface font-medium mt-0.5">
                      Ginger Cardamom Chai &amp; Vegetable Cutlets
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                    <span className="text-xs font-bold text-secondary block">Dinner (7:30 PM Tonight)</span>
                    <p className="text-xs text-on-surface font-medium mt-0.5">
                      Hyderabadi Dum Biryani with Mirchi ka Salan &amp; Gulab Jamun
                    </p>
                  </div>
                </div>
              </div>

              {/* Dynamic Gate Pass Card */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-outline-variant/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary-container text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">sensor_door</span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-on-surface font-headline-sm">
                        Biometric Turnstile Gate Pass
                      </h2>
                      <p className="text-xs text-on-surface-variant">Dynamic OTP for contactless campus entry</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={generateNewGatePass}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    <span>Generate New</span>
                  </button>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-primary to-primary-container text-white flex items-center justify-between shadow-md">
                  <div>
                    <span className="text-xs text-blue-200 block">CURRENT ENTRY OTP</span>
                    <span className="text-3xl font-extrabold tracking-widest font-mono block mt-1">
                      {gatePassOtp}
                    </span>
                    <span className="text-[11px] text-emerald-300 font-semibold mt-1 block">
                      Valid on all Main Gate &amp; Lift turnstiles
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(gatePassOtp);
                      setGatePassCopied(true);
                      setTimeout(() => setGatePassCopied(false), 2000);
                    }}
                    className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors"
                  >
                    {gatePassCopied ? 'Copied!' : 'Copy OTP'}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Stay Info & Service Quick Actions (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* My Stay Details */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-outline-variant/30 space-y-4">
                <h3 className="font-bold text-base text-on-surface font-title-card">
                  Active Stay Dossier
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-surface-container-low space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Property:</span>
                      <strong className="text-on-surface">{propertyTitle}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Room &amp; Bed:</span>
                      <strong className="text-on-surface">Room 204 • Bed A (Twin)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Monthly Rent:</span>
                      <strong className="text-primary font-bold">₹14,500 / mo</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Lease Duration:</span>
                      <strong className="text-on-surface">11 Months (Ends Oct 2025)</strong>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href="/resident/tickets"
                      className="flex-1 py-2.5 rounded-xl bg-surface-container text-primary hover:bg-surface-container-high text-xs font-bold text-center transition-colors"
                    >
                      Service SLA
                    </Link>
                    <Link
                      href="/resident/favorites"
                      className="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-bold text-center transition-colors"
                    >
                      Wishlist PGs
                    </Link>
                  </div>
                </div>
              </div>

              {/* Maintenance SLA Spotlight Card */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-on-surface">6-Hour SLA Repair Guarantee</h4>
                  <span className="text-[10px] font-bold text-secondary bg-secondary-container px-2 py-0.5 rounded-full">
                    Guaranteed
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Experiencing a leaky tap, Wi-Fi glitch, or AC issue? Raise a service ticket with Urban Company technicians.
                </p>
                <Link
                  href="/resident/tickets"
                  className="block w-full py-2.5 rounded-xl bg-primary text-white text-center text-xs font-bold hover:bg-primary-container shadow-xs"
                >
                  Open Maintenance SLA Tracker →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
    </ProtectedRoute>
  );
}
