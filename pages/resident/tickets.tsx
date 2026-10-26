import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { ServiceTicket, TicketCategory, TicketPriority } from '../../types';
import { useAuth } from '../../lib/authContext';
import { fetchReports, createReport, fetchBookings, isSupabaseConfigured } from '../../lib/supabaseClient';

export default function MaintenanceTicketsPage() {
  const { user } = useAuth();
  const [userPropertyId, setUserPropertyId] = useState<string>('');

  // Active timer simulation for SLA
  const [secondsRemaining, setSecondsRemaining] = useState<number>(2 * 3600 + 45 * 60 + 12);
  const [tickets, setTickets] = useState<ServiceTicket[]>([
    {
      id: 'T-894',
      user_id: user?.id || 'resident-user',
      title: 'Desk Ergonomic Chair Wheel Replacement & Height Lever Fix',
      category: 'carpentry',
      priority: 'standard',
      status: 'en_route',
      description: 'The right castor wheel broke off and hydraulic height cylinder slips down during work calls.',
      room_number: 'Room #204 Ensuite',
      technician_name: 'Manoj Kumar (Urban Company)',
      eta_minutes: 15,
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'T-820',
      user_id: user?.id || 'resident-user',
      title: 'Washroom Instant Geyser Thermostat Reset',
      category: 'electrical',
      priority: 'urgent',
      status: 'resolved',
      description: 'Water was not heating above 30 degrees. Technician replaced 25L element heating coil.',
      room_number: 'Room #204 Ensuite',
      technician_name: 'Suresh P.',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ]);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('electrical');
  const [newPriority, setNewPriority] = useState<TicketPriority>('standard');
  const [newRoomArea, setNewRoomArea] = useState('Room #204');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    async function loadReports() {
      if (isSupabaseConfigured && user) {
        try {
          const bookings = await fetchBookings(user.id, false);
          if (bookings && bookings.length > 0) {
            setUserPropertyId(bookings[0].property_id || '');
          }
          const reports = await fetchReports(user.id, false);
          if (reports && reports.length > 0) {
            const mapped: ServiceTicket[] = reports.map((r: any) => ({
              id: r.id.substring(0, 8),
              user_id: user.id,
              title: r.reason,
              category: 'general',
              priority: 'standard',
              status: r.status === 'open' ? 'logged' : r.status === 'resolved' ? 'resolved' : 'in_progress',
              description: r.details,
              room_number: 'Assigned Room',
              technician_name: 'Field Technician',
              eta_minutes: 25,
              created_at: r.created_at,
            }));
            setTickets((prev) => [...mapped, ...prev]);
          }
        } catch (err) {
          console.error('Error loading reports:', err);
        }
      }
    }
    loadReports();
  }, [user]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}h ${minutes
      .toString()
      .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s remaining`;
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSubmitting(true);
    if (isSupabaseConfigured && user && userPropertyId) {
      try {
        await createReport({
          property_id: userPropertyId,
          reason: `${newTitle.trim()} [${newCategory.toUpperCase()}]`,
          details: `${newDescription.trim()} (Area: ${newRoomArea}, Priority: ${newPriority})`,
        });
      } catch (err) {
        console.error('Report submission note:', err);
      }
    }

    const created: ServiceTicket = {
      id: `T-${Math.floor(900 + Math.random() * 99)}`,
      user_id: user?.id || 'demo',
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'logged',
      description: newDescription.trim() || 'Urgent repair requested.',
      room_number: newRoomArea,
      technician_name: 'Dispatching...',
      eta_minutes: 30,
      created_at: new Date().toISOString(),
    };
    setTickets([created, ...tickets]);
    setNewTitle('');
    setNewDescription('');
    setSubmitting(false);
    alert('Service Ticket Logged! Urban Company technician dispatched to property.');
  };

  const filteredTickets = tickets.filter((t) => {
    if (activeFilter === 'in_progress') return t.status !== 'resolved';
    if (activeFilter === 'resolved') return t.status === 'resolved';
    return true;
  });

  return (
    <ProtectedRoute requiredRole="RESIDENT">
      <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
      <Head>
        <title>Service Tickets &amp; Maintenance SLA | PG Connect</title>
      </Head>

      <Navbar activeTab="tickets" />

      <main className="w-full pt-20 flex-1">
        {/* SUBHEADER: SERVICE DESK TITLE */}
        <section className="bg-white border-b border-outline-variant/30 py-5 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-wider">
                    Urban Company SLA
                  </span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    Guaranteed 6-Hour Resolution
                  </span>
                </div>
                <h1 className="font-headline-lg text-2xl sm:text-3xl font-bold text-on-surface tracking-tight mt-1">
                  Service Tickets &amp; Maintenance Tracker
                </h1>
                <p className="text-xs text-on-surface-variant">
                  Doorstep technician visits, live SLA countdowns, and historical resolution logs.
                </p>
              </div>

              <a
                href="#raise-ticket-form"
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>Raise New Ticket</span>
              </a>
            </div>
          </div>
        </section>

        {/* 4 METRIC CARDS */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Active Tickets
                </span>
                <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">timer</span>
                </span>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-primary font-headline-lg">1 In Progress</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-amber-700 font-semibold">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>SLA target: 02h 45m left</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Avg. Resolution Speed
                </span>
                <span className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">bolt</span>
                </span>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-on-surface font-headline-lg">3.2 Hours</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-secondary font-semibold">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>98.4% within 6h SLA</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Resolved Tickets
                </span>
                <span className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">task_alt</span>
                </span>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-on-surface font-headline-lg">14 Solved</div>
                <div className="mt-1 text-xs text-on-surface-variant">Across current 11-month lease</div>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-outline-variant/30 flex flex-col justify-between">
              <div className="flex items-center justify-between text-on-surface-variant mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                  Resident CSAT Rating
                </span>
                <span className="w-8 h-8 rounded-lg bg-tertiary-fixed text-on-tertiary-fixed-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-lg">star</span>
                </span>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-on-surface font-headline-lg flex items-baseline gap-1">
                  4.9 <span className="text-sm font-normal text-on-surface-variant">/ 5.0</span>
                </div>
                <div className="mt-1 text-xs text-secondary font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  <span>Urban Company Certified</span>
                </div>
              </div>
            </div>
          </div>

          {/* SPOTLIGHT: ACTIVE IN-PROGRESS TICKET */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-outline-variant/30 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-surface-container-low">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-100 text-amber-800">
                  Active Ticket #T-894
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                  <span>Technician Dispatched (In Progress)</span>
                </span>
              </div>

              {/* Countdown SLA Timer */}
              <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-xl text-primary border border-outline-variant/30">
                <span className="material-symbols-outlined text-lg">alarm</span>
                <span className="text-xs font-bold">SLA Guarantee:</span>
                <span className="text-xs font-mono font-bold text-amber-800">
                  {formatTimer(secondsRemaining)}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md">
                Desk Ergonomic Chair Wheel Replacement &amp; Height Lever Fix
              </h2>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1.5 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">chair</span> Carpentry &amp; Furniture
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">flag</span> Priority: Standard
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">person</span> Manoj Kumar (Urban Company)
                </span>
              </div>
            </div>

            {/* 5-Step Progress Stepper */}
            <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/20">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* Step 1 Done */}
                <div className="flex flex-col items-center text-center space-y-1">
                  <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xs">
                    <span className="material-symbols-outlined text-base">check</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">Ticket Logged</span>
                  <span className="text-[10px] text-on-surface-variant">11:20 AM</span>
                </div>

                {/* Step 2 Done */}
                <div className="flex flex-col items-center text-center space-y-1">
                  <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center font-bold text-xs">
                    <span className="material-symbols-outlined text-base">check</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface">Assigned</span>
                  <span className="text-[10px] text-on-surface-variant">11:35 AM</span>
                </div>

                {/* Step 3 Active */}
                <div className="flex flex-col items-center text-center space-y-1">
                  <div className="w-8 h-8 rounded-full bg-primary text-white ring-4 ring-primary-fixed flex items-center justify-center font-bold text-xs shadow-md">
                    <span className="material-symbols-outlined text-base">two_wheeler</span>
                  </div>
                  <span className="text-xs font-bold text-primary">En Route</span>
                  <span className="text-[10px] text-secondary font-bold">ETA 15 mins</span>
                </div>

                {/* Step 4 Pending */}
                <div className="flex flex-col items-center text-center space-y-1 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high text-outline flex items-center justify-center font-bold text-xs">
                    4
                  </div>
                  <span className="text-xs font-semibold text-outline">In Progress</span>
                  <span className="text-[10px] text-outline">At Room</span>
                </div>

                {/* Step 5 Pending */}
                <div className="flex flex-col items-center text-center space-y-1 opacity-60">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high text-outline flex items-center justify-center font-bold text-xs">
                    5
                  </div>
                  <span className="text-xs font-semibold text-outline">Resolved</span>
                  <span className="text-[10px] text-outline">Sign-off OTP</span>
                </div>
              </div>
            </div>
          </div>

          {/* TWO COLUMN: RAISE TICKET FORM + TICKET HISTORY */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT 7 COLS: FORM */}
            <div className="lg:col-span-7" id="raise-ticket-form">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-outline-variant/30 space-y-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Fast Doorstep Fixes
                  </span>
                  <h3 className="text-xl font-bold text-on-surface font-headline-md mt-0.5">
                    Raise New Maintenance Request
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Technician will be dispatched within guaranteed SLA window.
                  </p>
                </div>

                <form onSubmit={handleCreateTicket} className="space-y-4">
                  {/* Category Chips */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-2">Issue Category</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'electrical', label: 'Electrical / Geyser', icon: 'electric_bolt' },
                        { id: 'plumbing', label: 'Plumbing / Tap', icon: 'water_drop' },
                        { id: 'wifi', label: 'Wi-Fi / Network', icon: 'wifi' },
                        { id: 'carpentry', label: 'Carpentry / Bed', icon: 'chair' },
                        { id: 'appliance', label: 'AC / Appliance', icon: 'mode_fan' },
                        { id: 'cleaning', label: 'Deep Cleaning', icon: 'cleaning_services' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setNewCategory(cat.id as any)}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                            newCategory === cat.id
                              ? 'bg-primary text-white border-primary shadow-xs'
                              : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                          <span className="truncate">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Issue Headline</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Washroom tap dripping or Split AC not cooling"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Room / Specific Area</label>
                      <input
                        type="text"
                        value={newRoomArea}
                        onChange={(e) => setNewRoomArea(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Priority</label>
                      <select
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value as any)}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="urgent">Urgent (Water/Power failure - 2h SLA)</option>
                        <option value="standard">Standard (Fix today - 6h SLA)</option>
                        <option value="low">Low (Non-urgent - 24h SLA)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Detailed Description</label>
                    <textarea
                      rows={3}
                      placeholder="Please mention exact symptoms to help the technician carry necessary replacement parts..."
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full p-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-lg">send</span>
                        <span>Log Ticket &amp; Dispatch Urban Company Tech</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* RIGHT 5 COLS: HISTORICAL LOGS */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-outline-variant/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-on-surface font-title-card">
                    Ticket History
                  </h3>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveFilter('all')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        activeFilter === 'all' ? 'bg-primary text-white' : 'text-on-surface-variant'
                      }`}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter('resolved')}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                        activeFilter === 'resolved' ? 'bg-primary text-white' : 'text-on-surface-variant'
                      }`}
                    >
                      Resolved
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredTickets.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-primary font-mono">{t.id}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            t.status === 'resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-on-surface leading-snug">{t.title}</h4>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2">{t.description}</p>
                      <div className="flex justify-between items-center text-[10px] text-outline pt-1">
                        <span>{t.room_number || 'Room #204'}</span>
                        <span>{t.technician_name}</span>
                      </div>
                    </div>
                  ))}
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
