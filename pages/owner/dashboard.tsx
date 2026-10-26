import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { PG, Booking } from '../../types';
import { fetchOwnerProperties, fetchBookings, updateBookingStatus } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/authContext';

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [properties, setProperties] = useState<PG[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<string>('all');
  const [activeQueueTab, setActiveQueueTab] = useState<'all' | 'escrow' | 'visits'>('all');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadOwnerData() {
      setLoading(true);
      if (user) {
        try {
          const [props, bks] = await Promise.all([
            fetchOwnerProperties(user.id),
            fetchBookings(user.id, true),
          ]);
          setProperties(props);
          setBookings(bks);
        } catch (err) {
          console.error('Error loading owner data:', err);
        }
      }
      setLoading(false);
    }

    loadOwnerData();

    // Auto-refresh when new visits or updates are scheduled
    const handleBookingsUpdate = () => {
      if (user) {
        fetchBookings(user.id, true).then((bks) => setBookings(bks));
      }
    };
    window.addEventListener('pgconnect_bookings_updated', handleBookingsUpdate);
    return () => window.removeEventListener('pgconnect_bookings_updated', handleBookingsUpdate);
  }, [user]);

  const handleUpdateBookingStatus = async (
    bookingId: string,
    status: 'confirmed' | 'cancelled',
    notes?: string
  ) => {
    try {
      const res = await updateBookingStatus(bookingId, status, notes);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status, ...(res.data || {}) } : b))
      );
      const msg = status === 'confirmed' ? 'Visit approved! Resident notified.' : 'Visit request declined and resident notified.';
      setActionSuccessMsg(msg);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err) {
      console.error('Failed to update booking:', err);
    }
  };

  const visitsList = bookings.filter(
    (b) =>
      b.booking_type === 'visit' ||
      b.deposit_amount === 0 ||
      (b.notes && b.notes.toUpperCase().includes('VISIT'))
  );
  const escrowList = bookings.filter(
    (b) =>
      b.booking_type === 'escrow' ||
      (b.deposit_amount && b.deposit_amount > 0 && !(b.notes && b.notes.toUpperCase().includes('VISIT')))
  );
  const pendingVisitsCount = visitsList.filter((b) => b.status === 'pending').length;
  const pendingEscrowCount = escrowList.filter((b) => b.status === 'pending').length;
  const totalPendingInquiries = pendingVisitsCount + pendingEscrowCount;

  const filteredBookings =
    activeQueueTab === 'visits'
      ? visitsList
      : activeQueueTab === 'escrow'
      ? escrowList
      : bookings;

  return (
    <ProtectedRoute requiredRole="OWNER">
      <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
        <Head>
          <title>Owner Management Dashboard | PG Connect</title>
        </Head>

        <Navbar activeTab="owner-dashboard" />

      <main className="w-full pt-20 flex-1">
        {/* SUBHEADER: OWNER CONTROL PANEL */}
        <section className="bg-white border-b border-outline-variant/30 py-5 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-primary text-xs font-bold uppercase tracking-wider">
                    Owner Hub
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Automated Operations
                  </span>
                </div>
                <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mt-1">
                  Proprietor Management Dashboard
                </h1>
                <p className="text-xs text-on-surface-variant">
                  Monitor real-time bed occupancies, approve escrow bookings, and track collection ledgers.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Link
                  href="/owner/add-property"
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-base">add_circle</span>
                  <span>Add New Property</span>
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    router.replace('/auth/signin');
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-outline-variant/60 hover:bg-red-50 hover:border-red-300 text-error text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
                  title="Sign Out of Owner Account"
                >
                  <span className="material-symbols-outlined text-base">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4 TOP KPI METRICS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Collections Health
                </span>
                <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-on-surface tabular-nums">₹12,45,000</span>
                  <span className="text-xs text-secondary font-bold flex items-center">
                    <span className="material-symbols-outlined text-[14px]">trending_up</span> +8.4%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden mt-1">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '95%' }}></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-0.5">
                  <span>95.0% realized</span>
                  <span>Target: ₹13,10,000</span>
                </div>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Bed Occupancy Rate
                </span>
                <div className="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">bed</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-on-surface">82 <span className="text-sm font-semibold text-outline">/ 87</span></span>
                  <span className="text-sm font-bold text-primary">94.2%</span>
                </div>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-on-surface-variant font-medium">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary"></span> 82 Active</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> 5 Vacant</span>
                </div>
              </div>
            </div>

            {/* KPI 3: Actionable Inquiries */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Actionable Inquiries
                </span>
                <div className="w-8 h-8 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">person_pin_circle</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-on-surface">
                    {totalPendingInquiries} Pending
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    totalPendingInquiries > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {totalPendingInquiries > 0 ? 'Action req.' : 'All clear'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
                  <span>{pendingEscrowCount} Escrow awaiting approval</span>
                  <span className="text-primary font-semibold">{pendingVisitsCount} Visits requested</span>
                </div>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Open Service Tickets
                </span>
                <div className="w-8 h-8 rounded-lg bg-error-container text-on-error-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">handyman</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-on-surface">3 Active</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-800 font-bold">
                    1 Urgent
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
                  <span>AC Unit #204 + 2 Cleaning</span>
                  <span className="text-secondary font-semibold">Avg SLA: 3.2h</span>
                </div>
              </div>
            </div>
          </div>

          {/* REAL-TIME FLOOR & BED MATRIX */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-outline-variant/30 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">door_front</span>
                  <h2 className="text-lg font-bold text-on-surface font-title-card">
                    Real-Time Floor Matrix • Serenity Stays Campus
                  </h2>
                  <span className="text-[10px] text-secondary bg-secondary-container px-2 py-0.5 rounded-full font-bold">
                    Live Synced
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Click any bed node to view rental tenure, KYC dossier, or initiate rapid onboarding.
                </p>
              </div>

              {/* Floor Filter Pills */}
              <div className="flex items-center bg-surface-container-low rounded-xl p-1 border border-outline-variant/20">
                {['all', 'floor1', 'floor2', 'floor3'].map((fl) => (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => setSelectedFloor(fl)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedFloor === fl
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {fl === 'all' ? 'All Floors' : fl === 'floor1' ? 'Floor 1' : fl === 'floor2' ? 'Floor 2' : 'Floor 3 (Terrace)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Matrix Legend */}
            <div className="flex flex-wrap items-center gap-4 py-2 px-3.5 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20">
              <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Vacant / Ready to Rent</span>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>Notice Served (&lt;30 Days)</span>
              </div>
              <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
                <span>Sanitizing / Inspection</span>
              </div>
            </div>

            {/* Room Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Room 101 */}
              <div className="bg-surface-container-low rounded-xl p-3.5 border border-outline-variant/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-on-surface">Room 101 (Twin)</span>
                  <span className="text-[10px] font-bold text-secondary bg-emerald-100 px-1.5 py-0.2 rounded">100% Full</span>
                </div>
                <div className="space-y-1">
                  <div className="p-2 rounded-lg bg-white flex items-center justify-between text-xs">
                    <span className="font-medium text-on-surface">Bed A: Aditya Kulkarni</span>
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  </div>
                  <div className="p-2 rounded-lg bg-white flex items-center justify-between text-xs">
                    <span className="font-medium text-on-surface">Bed B: Pranav J.</span>
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/20">
                  <span>₹15,000 / bed</span>
                  <span className="text-secondary font-bold">Lease active</span>
                </div>
              </div>

              {/* Room 102 */}
              <div className="bg-surface-container-low rounded-xl p-3.5 border border-outline-variant/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-on-surface">Room 102 (Twin)</span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">1 Vacant</span>
                </div>
                <div className="space-y-1">
                  <div className="p-2 rounded-lg bg-white flex items-center justify-between text-xs">
                    <span className="font-medium text-on-surface">Bed A: Siddharth</span>
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 flex items-center justify-between text-xs border border-amber-200">
                    <span className="font-bold text-amber-800">Bed B: Open Bed</span>
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/20">
                  <span>₹15,000 / bed</span>
                  <span className="text-primary font-bold">Ready to Move</span>
                </div>
              </div>

              {/* Room 201 */}
              <div className="bg-surface-container-low rounded-xl p-3.5 border border-outline-variant/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-on-surface">Room 201 (Single)</span>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.2 rounded">Notice</span>
                </div>
                <div className="space-y-1">
                  <div className="p-2 rounded-lg bg-white flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-on-surface block">Bed S: Ananya K.</span>
                      <span className="text-[10px] text-error font-semibold">Vacates in 26 days</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/20">
                  <span>₹22,000 / mo</span>
                  <span className="text-secondary font-bold">Pre-bookable</span>
                </div>
              </div>

              {/* Room 301 */}
              <div className="bg-surface-container-low rounded-xl p-3.5 border border-outline-variant/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-on-surface">Room 301 (Terrace)</span>
                  <span className="text-[10px] font-bold text-secondary bg-emerald-100 px-1.5 py-0.2 rounded">100% Full</span>
                </div>
                <div className="space-y-1">
                  <div className="p-2 rounded-lg bg-white flex items-center justify-between text-xs">
                    <span className="font-medium text-on-surface">Private: Rohan Varma</span>
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] text-on-surface-variant pt-1 border-t border-outline-variant/20">
                  <span>₹28,500 / mo</span>
                  <span className="text-secondary font-bold">Annual Advance</span>
                </div>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN OPERATIONAL LAYOUT: LEADS & LEDGER */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: INCOMING TENANT REQUESTS & ESCROW QUEUE (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-outline-variant/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-tertiary-fixed text-tertiary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    </div>
                    <h2 className="text-base font-bold text-on-surface font-title-card">
                      Tenant Requests &amp; Escrow Bookings
                    </h2>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                      {bookings.length} Queue
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveQueueTab('all')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        activeQueueTab === 'all' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant'
                      }`}
                    >
                      All ({bookings.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveQueueTab('escrow')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        activeQueueTab === 'escrow' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant'
                      }`}
                    >
                      Escrow Tokens ({escrowList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveQueueTab('visits')}
                      className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                        activeQueueTab === 'visits' ? 'bg-primary text-white shadow-xs' : 'text-on-surface-variant'
                      }`}
                    >
                      Visits ({visitsList.length})
                    </button>
                  </div>
                </div>

                {actionSuccessMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
                    <span>{actionSuccessMsg}</span>
                  </div>
                )}

                {/* Queue Items */}
                <div className="space-y-3">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => {
                      const isVisit =
                        booking.booking_type === 'visit' ||
                        booking.deposit_amount === 0 ||
                        (booking.notes && booking.notes.toUpperCase().includes('VISIT'));
                      const residentName =
                        booking.profiles?.full_name || booking.user_name || 'Resident Seeker';
                      const residentPhone =
                        booking.profiles?.phone || booking.user_phone || '';
                      const propertyTitle =
                        booking.property?.title ||
                        booking.pgs?.title ||
                        booking.property?.name ||
                        'Property Accommodation';
                      const visitDate =
                        booking.visit_date || booking.move_in_date || booking.check_in_date;
                      const timeSlot = booking.time_slot || '10:00 AM - 12:00 PM';
                      const sharingType =
                        booking.room_type === 'double'
                          ? 'Double / Twin'
                          : booking.room_type || 'Single';

                      return (
                        <div
                          key={booking.id}
                          className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 space-y-3 hover:border-outline-variant transition-all shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-xl bg-primary text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                                {residentName.charAt(0).toUpperCase()}
                              </div>
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-sm text-on-surface">
                                    {residentName}
                                  </span>
                                  {isVisit ? (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-primary border border-blue-200 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[12px]">calendar_month</span>
                                      Physical Visit (Free ₹0)
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                      <span className="material-symbols-outlined text-[12px]">lock</span>
                                      ₹1k Escrow Locked
                                    </span>
                                  )}
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                                    KYC Verified
                                  </span>
                                </div>

                                <p className="text-xs text-on-surface-variant font-medium">
                                  <strong>{propertyTitle}</strong> • {sharingType} Sharing
                                </p>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant pt-0.5">
                                  <span className="flex items-center gap-1 text-on-surface font-semibold">
                                    <span className="material-symbols-outlined text-sm text-primary">event</span>
                                    {visitDate} ({timeSlot})
                                  </span>
                                  {residentPhone && (
                                    <span className="flex items-center gap-1">
                                      <span className="material-symbols-outlined text-sm text-secondary">call</span>
                                      +91 {residentPhone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize block ${
                                  booking.status === 'confirmed'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : booking.status === 'cancelled'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                }`}
                              >
                                {booking.status === 'confirmed'
                                  ? 'Accepted ✅'
                                  : booking.status === 'cancelled'
                                  ? 'Declined ❌'
                                  : 'Pending Action'}
                              </span>
                              <span className="text-[10px] text-on-surface-variant mt-1 block">
                                Ref: {booking.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          {booking.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                              <button
                                type="button"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'cancelled')}
                                className="px-3.5 py-1.5 rounded-xl border border-red-200 text-error hover:bg-red-50 text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                              >
                                <span className="material-symbols-outlined text-[14px]">close</span>
                                <span>Decline Request</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateBookingStatus(booking.id, 'confirmed')}
                                className="px-4 py-1.5 rounded-xl bg-secondary hover:bg-[#005049] text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                              >
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                <span>Accept &amp; Issue Gate Pass</span>
                              </button>
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                              <span className="text-[11px]">
                                {booking.status === 'confirmed'
                                  ? '✓ Visit confirmed. Biometric turnstile OTP and proprietor arrival pass sent to resident.'
                                  : '✕ Visit declined. Resident notified to choose another time or accommodation.'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateBookingStatus(
                                    booking.id,
                                    booking.status === 'confirmed' ? 'cancelled' : 'confirmed'
                                  )
                                }
                                className="text-primary text-[11px] font-bold hover:underline"
                              >
                                {booking.status === 'confirmed' ? 'Change to Decline' : 'Re-Approve Visit'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 rounded-xl bg-surface-container-low text-center text-xs text-on-surface-variant space-y-2 border border-dashed border-outline-variant/40">
                      <span className="material-symbols-outlined text-3xl text-on-surface-variant">inbox</span>
                      <p className="font-semibold text-sm text-on-surface">No {activeQueueTab === 'all' ? 'pending requests' : activeQueueTab} at this moment.</p>
                      <p className="text-[11px] text-on-surface-variant max-w-sm mx-auto">
                        When prospective residents schedule a visit or lock beds on your properties, their requests will appear here for one-click approval.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: RENT COLLECTIONS & MY PROPERTIES ROSTER (5 Cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Properties List */}
              <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-outline-variant/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-on-surface font-title-card">
                    My Managed Properties
                  </h3>
                  <Link
                    href="/owner/add-property"
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    + Add New
                  </Link>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <div className="p-4 rounded-xl bg-surface-container-low text-center text-xs text-on-surface-variant animate-pulse">
                      Loading properties...
                    </div>
                  ) : properties.length > 0 ? (
                    properties.map((p) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <h4 className="font-bold text-xs text-on-surface">{p.title}</h4>
                          <p className="text-[11px] text-on-surface-variant">{p.area}, {p.city}</p>
                          <span className="text-[10px] text-secondary font-semibold">
                            ₹{p.price_per_month?.toLocaleString('en-IN')}/mo • {p.available_rooms} Rooms Available
                          </span>
                        </div>
                        <Link
                          href={`/pg/${p.id}`}
                          className="px-3 py-1.5 rounded-lg bg-white text-primary text-xs font-bold border border-outline-variant/30 hover:bg-surface-container shadow-xs"
                        >
                          View
                        </Link>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-surface-container-low text-center text-xs text-on-surface-variant">
                      <p>No properties added by your account yet.</p>
                      <Link
                        href="/owner/add-property"
                        className="inline-block mt-2 text-primary font-bold hover:underline"
                      >
                        Launch 6-Step Property Wizard →
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Rent Ledger Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-outline-variant/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-on-surface font-title-card">
                    Recent Rent Receipts
                  </h3>
                  <span className="text-[10px] text-secondary font-bold">UPI Auto-Reconciled</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-surface-container-low flex justify-between items-center">
                    <div>
                      <span className="font-bold text-on-surface block">Rohan Varma (Room 301)</span>
                      <span className="text-[10px] text-on-surface-variant">Paid via ICICI UPI</span>
                    </div>
                    <span className="font-bold text-secondary">₹28,500 ✅</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-container-low flex justify-between items-center">
                    <div>
                      <span className="font-bold text-on-surface block">Aditya Kulkarni (Room 101)</span>
                      <span className="text-[10px] text-on-surface-variant">Paid via HDFC Netbanking</span>
                    </div>
                    <span className="font-bold text-secondary">₹15,000 ✅</span>
                  </div>
                </div>
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
