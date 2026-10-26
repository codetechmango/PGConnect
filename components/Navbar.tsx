import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/authContext';
import { fetchNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../lib/supabaseClient';
import { AppNotification } from '../types';

interface NavbarProps {
  activeTab?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab }) => {
  const router = useRouter();
  const { user, profile, isOwner, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real-time notifications for the active user
  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    const loadNotifs = async () => {
      try {
        const list = await fetchNotifications(user.id);
        setNotifications(list);
      } catch (err) {
        console.warn('Navbar notification loading warning:', err);
      }
    };

    loadNotifs();

    const handleNotifUpdate = () => {
      loadNotifs();
    };

    window.addEventListener('pgconnect_notifications_updated', handleNotifUpdate);
    return () => {
      window.removeEventListener('pgconnect_notifications_updated', handleNotifUpdate);
    };
  }, [user?.id]);

  // Handle ⌘K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('navbar-search-input');
        if (searchInput) {
          searchInput.focus();
        } else {
          router.push('/search');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/search');
    }
  };

  const isExploreActive = activeTab === 'search' || activeTab === 'explore-pgs' || router.pathname === '/search';
  const isTicketsActive = activeTab === 'tickets' || router.pathname.startsWith('/resident/tickets');

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-outline-variant/30 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">apartment</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-primary tracking-tight font-headline-sm">
                  PG CONNECT
                </span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-bold uppercase tracking-wider">
                  Verified
                </span>
              </div>
              <span className="text-[12px] text-on-surface-variant hidden sm:inline-block">
                Find a PG That Feels Like Home
              </span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6">
          <Link
            href="/search"
            className={`py-2 text-sm font-medium transition-colors ${
              isExploreActive
                ? 'text-primary font-bold border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Explore PGs
          </Link>
          <Link
            href="/#how-it-works"
            className="py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            How It Works
          </Link>
          <Link
            href="/resident/tickets"
            className={`py-2 text-sm font-medium transition-colors ${
              isTicketsActive
                ? 'text-primary font-bold border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Maintenance SLA
          </Link>
          <Link
            href="/#why-pg-connect"
            className="py-2 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            About Escrow
          </Link>
        </nav>

        {/* Quick Search & User Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Search Input */}
          <form onSubmit={handleSearchSubmit} className="hidden xl:flex items-center bg-surface-container-low rounded-lg px-3 py-1.5 border border-outline-variant/30 focus-within:ring-2 focus-within:ring-primary focus-within:bg-white transition-all">
            <span className="material-symbols-outlined text-on-surface-variant text-base mr-2">search</span>
            <input
              id="navbar-search-input"
              type="text"
              placeholder="City, locality, tech park..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none w-48"
            />
            <kbd className="ml-2 px-1.5 py-0.5 rounded bg-white text-on-surface-variant text-[10px] font-medium shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-outline-variant/40">
              ⌘K
            </kbd>
          </form>

          {/* List Your PG CTA - Hidden for resident accounts */}
          {(!user || isOwner) && (
            <Link
              href="/owner/add-property"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary hover:bg-[#005049] text-white text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">add_business</span>
              <span>List Your PG</span>
            </Link>
          )}

          {/* User Status / Portal Access */}
          {user ? (
            <div className="flex items-center gap-2">
              {/* Real-time Notifications Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationDropdownOpen(!notificationDropdownOpen);
                    setProfileDropdownOpen(false);
                  }}
                  className="relative p-2.5 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors border border-outline-variant/40 flex items-center justify-center"
                  title="Notifications"
                  aria-label="Notifications"
                >
                  <span className="material-symbols-outlined text-[20px]">notifications</span>
                  {notifications.filter((n) => !n.is_read && !n.read).length > 0 && (
                    <span className="absolute -top-1 -right-1 px-1.5 min-w-[18px] h-[18px] rounded-full bg-primary text-white text-[10px] font-extrabold flex items-center justify-center shadow-xs border-2 border-white animate-pulse">
                      {notifications.filter((n) => !n.is_read && !n.read).length > 9 ? '9+' : notifications.filter((n) => !n.is_read && !n.read).length}
                    </span>
                  )}
                </button>

                {/* Notifications Flyout Panel */}
                {notificationDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-outline-variant/40 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setNotificationDropdownOpen(false)}
                  >
                    <div className="px-4 pb-2.5 border-b border-surface-container-low flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface">Notifications</span>
                        {notifications.filter((n) => !n.is_read && !n.read).length > 0 && (
                          <span className="px-2 py-0.2 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                            {notifications.filter((n) => !n.is_read && !n.read).length} New
                          </span>
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (user?.id) {
                              await markAllNotificationsAsRead(user.id);
                              setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true, read: true })));
                            }
                          }}
                          className="text-[11px] text-primary hover:underline font-semibold"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-surface-container-low/60 py-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-on-surface-variant space-y-1">
                          <span className="material-symbols-outlined text-3xl text-outline-variant">notifications_paused</span>
                          <p className="text-xs font-semibold text-on-surface">All caught up!</p>
                          <p className="text-[11px]">No visit notifications or alerts right now.</p>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const isUnread = !notif.is_read && !notif.read;
                          const icon =
                            notif.type === 'visit_confirmed'
                              ? 'verified'
                              : notif.type === 'visit_declined'
                              ? 'event_busy'
                              : notif.type === 'visit_scheduled'
                              ? 'calendar_month'
                              : notif.type === 'booking_created'
                              ? 'lock'
                              : 'notifications';

                          const iconBg =
                            notif.type === 'visit_confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : notif.type === 'visit_declined'
                              ? 'bg-rose-100 text-rose-800'
                              : notif.type === 'visit_scheduled'
                              ? 'bg-blue-100 text-primary'
                              : 'bg-surface-container text-on-surface-variant';

                          return (
                            <div
                              key={notif.id}
                              onClick={async () => {
                                if (user?.id) {
                                  await markNotificationAsRead(user.id, notif.id);
                                }
                                setNotificationDropdownOpen(false);
                                if (notif.link) {
                                  router.push(notif.link);
                                } else if (isOwner) {
                                  router.push('/owner/dashboard');
                                } else {
                                  router.push('/resident/dashboard');
                                }
                              }}
                              className={`p-3.5 flex items-start gap-3 cursor-pointer hover:bg-surface-container-low transition-colors ${
                                isUnread ? 'bg-primary/5' : ''
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                              </div>
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className={`text-xs truncate ${isUnread ? 'font-bold text-on-surface' : 'font-medium text-on-surface'}`}>
                                    {notif.title}
                                  </h4>
                                  {isUnread && (
                                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                                  {notif.message}
                                </p>
                                <span className="text-[10px] text-outline block pt-0.5">
                                  {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="pt-2 px-3 border-t border-surface-container-low text-center">
                      <Link
                        href={isOwner ? '/owner/dashboard' : '/resident/dashboard'}
                        onClick={() => setNotificationDropdownOpen(false)}
                        className="text-xs font-bold text-primary hover:underline block py-1"
                      >
                        {isOwner ? 'Go to Owner Dashboard Queue →' : 'Go to Resident Dashboard Visits →'}
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setNotificationDropdownOpen(false);
                  }}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-container-low transition-colors border border-outline-variant/40"
                >
                  <div className="w-9 h-9 rounded-full bg-primary-fixed text-on-primary-fixed font-bold flex items-center justify-center text-sm">
                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:flex flex-col text-left pr-1">
                    <span className="text-xs font-bold text-on-surface leading-tight truncate max-w-[110px]">
                      {profile?.full_name || user.email?.split('@')[0]}
                    </span>
                    <span className="text-[11px] text-secondary font-medium leading-tight">
                      {isOwner ? 'PG Owner • Hub' : 'Resident Portal'}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-base">expand_more</span>
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-outline-variant/40 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-3 border-b border-surface-container-low">
                      <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-on-surface truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container">
                        {isOwner ? 'Verified Property Owner' : 'Verified Resident'}
                      </span>
                    </div>

                    <div className="py-1">
                      {isOwner ? (
                        <>
                          <Link
                            href="/owner/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                          >
                            <span className="material-symbols-outlined text-base text-primary">dashboard</span>
                            <span>Owner Management Dashboard</span>
                          </Link>
                          <Link
                            href="/owner/add-property"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                          >
                            <span className="material-symbols-outlined text-base text-secondary">add_circle</span>
                            <span>Add New PG Listing Wizard</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/resident/dashboard"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                          >
                            <span className="material-symbols-outlined text-base text-primary">apartment</span>
                            <span>My Resident Stay Dashboard</span>
                          </Link>
                          <Link
                            href="/resident/tickets"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                          >
                            <span className="material-symbols-outlined text-base text-primary">handyman</span>
                            <span>Service Tickets & SLA</span>
                          </Link>
                          <Link
                            href="/resident/favorites"
                            onClick={() => setProfileDropdownOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
                          >
                            <span className="material-symbols-outlined text-base text-error">favorite</span>
                            <span>Saved Wishlist PGs</span>
                          </Link>
                        </>
                      )}

                      <div className="border-t border-surface-container-low my-1"></div>

                      <button
                        type="button"
                        onClick={async () => {
                          setProfileDropdownOpen(false);
                          await signOut();
                          router.replace('/auth/signin');
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-error hover:bg-red-50 transition-colors text-left font-medium"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link
                href="/auth/signin"
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-xs active:scale-95"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-container text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1"
              >
                <span>Join Now</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-on-surface hover:bg-surface-container-low transition-colors"
            aria-label="Toggle mobile menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-outline-variant/30 px-6 py-4 shadow-xl space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center bg-surface-container-low rounded-lg px-3 py-2 border border-outline-variant/40">
            <span className="material-symbols-outlined text-on-surface-variant text-base mr-2">search</span>
            <input
              type="text"
              placeholder="Search cities, localities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm w-full focus:outline-none"
            />
          </form>

          <div className="flex flex-col space-y-2 pt-2">
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            >
              Explore PGs
            </Link>
            <Link
              href="/resident/tickets"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-sm font-semibold text-on-surface hover:bg-surface-container-low"
            >
              Service Tickets & SLA
            </Link>
            {/* List Your PG - Hidden for residents */}
            {(!user || isOwner) && (
              <Link
                href="/owner/add-property"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-secondary hover:bg-secondary-container/20 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add_business</span>
                List Your PG
              </Link>
            )}

            {user ? (
              <>
                <Link
                  href={isOwner ? "/owner/dashboard" : "/resident/dashboard"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-sm font-bold text-primary bg-surface-container-low"
                >
                  {isOwner ? "Owner Dashboard" : "My Resident Stay"}
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await signOut();
                    router.replace('/auth/signin');
                  }}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-error hover:bg-red-50 text-left"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-surface-container-low">
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-sm font-bold text-primary bg-surface-container-low rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-sm font-bold text-white bg-primary rounded-lg shadow-sm"
                >
                  Join
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
