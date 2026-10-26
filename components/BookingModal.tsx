import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { PG } from '../types';
import { useAuth } from '../lib/authContext';
import { createBooking, normalizeRoomType } from '../lib/supabaseClient';

interface BookingModalProps {
  pg: PG | null;
  isOpen: boolean;
  onClose: () => void;
  selectedRoomType?: string;
  initialBookingType?: 'visit' | 'escrow';
}

export const BookingModal: React.FC<BookingModalProps> = ({
  pg,
  isOpen,
  onClose,
  selectedRoomType = 'double',
  initialBookingType = 'visit',
}) => {
  const router = useRouter();
  const { user, profile } = useAuth();

  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const [bookingType, setBookingType] = useState<'visit' | 'escrow'>(initialBookingType);
  const [roomType, setRoomType] = useState<string>(normalizeRoomType(selectedRoomType));
  const [scheduledDate, setScheduledDate] = useState<string>(getTomorrowDate());
  const [timeSlot, setTimeSlot] = useState<string>('10:00 AM - 12:00 PM');
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [successBookingId, setSuccessBookingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialBookingType) {
      setBookingType(initialBookingType);
    }
  }, [initialBookingType, isOpen]);

  useEffect(() => {
    if (selectedRoomType) {
      setRoomType(normalizeRoomType(selectedRoomType));
    }
  }, [selectedRoomType, isOpen]);

  useEffect(() => {
    if (user && isOpen) {
      const defaultName = profile?.full_name || (user.user_metadata as any)?.full_name || user.email?.split('@')[0] || '';
      const defaultPhone = profile?.phone || (user.user_metadata as any)?.phone || '';
      setFullName((prev) => prev || defaultName);
      setPhone((prev) => prev || defaultPhone);
    }
  }, [user, profile, isOpen]);

  if (!isOpen || !pg) return null;

  const calculateAmount = () => {
    if (bookingType === 'visit') return 0;
    return 1000;
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('Please sign in or create an account to schedule a visit or reserve a room.');
      router.push('/auth/signin');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Please enter your mobile or WhatsApp contact number.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await createBooking({
        property_id: pg.id,
        user_id: user.id,
        owner_id: pg.owner_id || undefined,
        room_type: normalizeRoomType(roomType),
        move_in_date: scheduledDate,
        monthly_rent: pg.price_per_month,
        deposit_amount: calculateAmount(),
        booking_type: bookingType,
        user_name: fullName.trim() || profile?.full_name || user.email?.split('@')[0] || 'Resident Seeker',
        user_phone: phone.trim(),
        user_email: user.email || '',
        time_slot: timeSlot,
        visit_date: scheduledDate,
        property_title: pg.title || pg.name,
        property_image: pg.images?.[0] || '',
        property_address: pg.address,
        property_city: pg.city,
      });

      if (result.error) {
        setErrorMsg(result.error);
      } else if (result.data) {
        setSuccessBookingId(result.data.id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit visit request');
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-outline-variant/40 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-container-low text-on-surface-variant hover:text-on-surface flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {successBookingId ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary-container text-secondary mx-auto flex items-center justify-center animate-bounce">
              <span className="material-symbols-outlined text-3xl font-bold">check_circle</span>
            </div>
            <h3 className="text-2xl font-bold text-on-surface font-headline-sm">
              {bookingType === 'visit' ? 'Visit Request Sent to Owner!' : 'Bed Escrow Locked!'}
            </h3>
            <p className="text-sm text-on-surface-variant">
              Booking Ref: <strong className="text-primary font-mono">{successBookingId}</strong> for{' '}
              <strong>{pg.title}</strong>.
            </p>
            <div className="p-4 rounded-xl bg-surface-container-low text-xs text-on-surface-variant text-left space-y-2 border border-outline-variant/30">
              <div className="flex justify-between">
                <span>Date:</span>
                <strong className="text-on-surface">{scheduledDate}</strong>
              </div>
              <div className="flex justify-between">
                <span>Time Slot:</span>
                <strong className="text-on-surface">{timeSlot}</strong>
              </div>
              <div className="flex justify-between">
                <span>Sharing Option:</span>
                <strong className="text-on-surface capitalize">
                  {roomType === 'double' ? 'Double / Twin' : roomType} Sharing
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Contact:</span>
                <strong className="text-on-surface">+91 {phone}</strong>
              </div>
              <div className="flex justify-between border-t border-outline-variant/20 pt-1.5">
                <span>Owner Notification:</span>
                <span className="text-secondary font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  Dispatched in Real-time
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#99F6E4] text-left text-xs text-[#005049] space-y-1">
              <p className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">notifications_active</span>
                What happens next?
              </p>
              <p className="text-[11px] leading-relaxed">
                The PG owner has been notified. Once they accept your visit slot, you will receive an in-app confirmation with the dynamic biometric gate pass OTP to show at arrival.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/resident/dashboard');
                }}
                className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-container transition-colors shadow-sm"
              >
                Track in My Dashboard →
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3 px-5 rounded-xl border border-outline-variant/50 text-on-surface-variant font-bold text-xs hover:bg-surface-container-low transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                Verified Resident Access
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-sm">
                Reserve or Schedule Visit
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5 truncate">{pg.title}</p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-error-container/60 text-on-error-container text-xs font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Mode Toggle: Visit vs Lock Bed */}
            <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-xl gap-1 border border-outline-variant/30">
              <button
                type="button"
                onClick={() => setBookingType('visit')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  bookingType === 'visit'
                    ? 'bg-white shadow-sm text-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Schedule Free Visit (₹0)
              </button>
              <button
                type="button"
                onClick={() => setBookingType('escrow')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                  bookingType === 'escrow'
                    ? 'bg-white shadow-sm text-secondary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Lock Bed (₹1k Escrow)
              </button>
            </div>

            {/* Sharing Type */}
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">Select Sharing Option</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="single">Single Private Room (₹22,000/mo)</option>
                <option value="double">Executive Twin / Double Sharing (₹15,000/mo)</option>
                <option value="triple">Economy Triple Sharing (₹9,500/mo)</option>
                <option value="dormitory">Dormitory Bed (₹7,000/mo)</option>
              </select>
            </div>

            {/* Date & Time Slot */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">Preferred Date</label>
                <input
                  type="date"
                  required
                  min={todayStr}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">Time Window</label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>10:00 AM - 12:00 PM</option>
                  <option>12:00 PM - 2:00 PM</option>
                  <option>3:00 PM - 5:00 PM</option>
                  <option>5:00 PM - 7:30 PM</option>
                </select>
              </div>
            </div>

            {/* Resident Full Name & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Your Full Name</label>
                <input
                  type="text"
                  placeholder="Sai Kiran"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">Mobile / WhatsApp</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-on-surface-variant font-bold">+91</span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full h-10 pl-11 pr-3 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Escrow / Free Guarantee Pill */}
            <div className="p-3 rounded-xl bg-[#F0FDFA] border border-[#99F6E4] flex items-center gap-2.5">
              <span className="material-symbols-outlined text-secondary text-lg">verified_user</span>
              <p className="text-[11px] text-[#005049] leading-tight">
                {bookingType === 'visit'
                  ? 'Zero visit cancellation fee. Direct proprietor assistance on arrival with dynamic biometric gate access.'
                  : '100% refundable token locked in ICICI Escrow until contract signing. Zero agent brokerage.'}
              </p>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Scheduling Visit...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">
                    {bookingType === 'visit' ? 'calendar_month' : 'lock'}
                  </span>
                  <span>
                    {bookingType === 'visit' ? 'Confirm Free Property Visit' : 'Pay ₹1,000 Escrow Token'}
                  </span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
