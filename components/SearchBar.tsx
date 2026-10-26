import React, { useState } from 'react';
import { useRouter } from 'next/router';

interface SearchBarProps {
  initialLocation?: string;
  initialGender?: string;
  initialRoomType?: string;
  initialBudget?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  initialLocation = '',
  initialGender = 'all',
  initialRoomType = 'any',
  initialBudget = '',
}) => {
  const router = useRouter();
  const [gender, setGender] = useState<'all' | 'boys' | 'girls' | 'coliving'>(
    initialGender as any || 'all'
  );
  const [location, setLocation] = useState(initialLocation);
  const [moveInDate, setMoveInDate] = useState('2025-11-01');
  const [sharingType, setSharingType] = useState(initialRoomType);
  const [selectedBudgetRange, setSelectedBudgetRange] = useState(initialBudget || '8k-15k');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();

    if (location.trim()) queryParams.set('q', location.trim());
    if (gender !== 'all') {
      const gMap: Record<string, string> = {
        boys: 'male',
        girls: 'female',
        coliving: 'any',
      };
      queryParams.set('gender', gMap[gender] || gender);
    }
    if (sharingType !== 'any') {
      queryParams.set('room_type', sharingType);
    }
    if (selectedBudgetRange === 'under-8k') {
      queryParams.set('maxPrice', '8000');
    } else if (selectedBudgetRange === '8k-15k') {
      queryParams.set('minPrice', '8000');
      queryParams.set('maxPrice', '15000');
    } else if (selectedBudgetRange === 'above-15k') {
      queryParams.set('minPrice', '15000');
    }

    router.push(`/search?${queryParams.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-4 sm:p-6 border border-outline-variant/30">
      <form onSubmit={handleSearchSubmit}>
        {/* Category Toggles (Gender Selection) */}
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 mb-4 bg-surface-container-low/60 p-2.5 rounded-xl border border-outline-variant/20">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-xs font-semibold text-on-surface-variant mr-1 hidden sm:inline">
              Preference:
            </span>
            <button
              type="button"
              onClick={() => setGender('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                gender === 'all'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Any
            </button>
            <button
              type="button"
              onClick={() => setGender('boys')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                gender === 'boys'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Boys Only
            </button>
            <button
              type="button"
              onClick={() => setGender('girls')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                gender === 'girls'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Girls Only
            </button>
            <button
              type="button"
              onClick={() => setGender('coliving')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                gender === 'coliving'
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              Co-Living / Unisex
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-secondary text-xs font-bold">
            <span className="material-symbols-outlined text-sm">security</span>
            <span>CCTV &amp; Biometric Guarded</span>
          </div>
        </div>

        {/* Filter Grid Form */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 lg:gap-4 items-end">
          {/* Location Input */}
          <div className="md:col-span-4 flex flex-col gap-1.5 relative">
            <label htmlFor="locationInput" className="text-xs font-bold text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">pin_drop</span>
              <span>Location / Tech Park</span>
            </label>
            <div className="relative flex items-center">
              <input
                id="locationInput"
                type="text"
                placeholder="e.g. Koramangala, Bengaluru"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-11 pl-3 pr-8 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner"
              />
              <span className="material-symbols-outlined text-on-surface-variant absolute right-2.5 pointer-events-none text-base">
                expand_more
              </span>
            </div>
          </div>

          {/* Move-in Date Picker */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label htmlFor="moveInDate" className="text-xs font-bold text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">calendar_month</span>
              <span>Move-in Date</span>
            </label>
            <input
              id="moveInDate"
              type="date"
              value={moveInDate}
              onChange={(e) => setMoveInDate(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner cursor-pointer"
            />
          </div>

          {/* Sharing Type Selector */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label htmlFor="sharingType" className="text-xs font-bold text-on-surface flex items-center gap-1">
              <span className="material-symbols-outlined text-sm text-primary">bed</span>
              <span>Room Sharing</span>
            </label>
            <div className="relative flex items-center">
              <select
                id="sharingType"
                value={sharingType}
                onChange={(e) => setSharingType(e.target.value)}
                className="w-full h-11 pl-3 pr-8 rounded-xl bg-surface-container-low text-on-surface text-sm border border-outline-variant/30 appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary shadow-inner cursor-pointer"
              >
                <option value="any">Any (Single, Double, Triple)</option>
                <option value="single">Single Private Room</option>
                <option value="double">Twin Sharing (2-Bed)</option>
                <option value="triple">Triple Sharing (Budget)</option>
              </select>
              <span className="material-symbols-outlined text-on-surface-variant absolute right-2.5 pointer-events-none text-base">
                unfold_more
              </span>
            </div>
          </div>

          {/* Submit Search Button */}
          <div className="md:col-span-2 flex flex-col justify-end">
            <button
              type="submit"
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">search</span>
              <span>Find PGs</span>
            </button>
          </div>
        </div>

        {/* Budget Quick-Pills Strip */}
        <div className="mt-4 pt-3 flex flex-wrap items-center justify-between gap-3 bg-surface-container-low/40 px-3 py-2 rounded-xl border border-outline-variant/20">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Budget:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedBudgetRange('under-8k')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                  selectedBudgetRange === 'under-8k'
                    ? 'bg-primary text-white'
                    : 'bg-surface-container text-on-surface-variant hover:bg-primary-fixed hover:text-on-primary-fixed'
                }`}
              >
                Under ₹8,000
              </button>
              <button
                type="button"
                onClick={() => setSelectedBudgetRange('8k-15k')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                  selectedBudgetRange === '8k-15k'
                    ? 'bg-primary text-white'
                    : 'bg-surface-container text-on-surface-variant hover:bg-primary-fixed hover:text-on-primary-fixed'
                }`}
              >
                ₹8,000 - ₹15,000
              </button>
              <button
                type="button"
                onClick={() => setSelectedBudgetRange('above-15k')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                  selectedBudgetRange === 'above-15k'
                    ? 'bg-primary text-white'
                    : 'bg-surface-container text-on-surface-variant hover:bg-primary-fixed hover:text-on-primary-fixed'
                }`}
              >
                ₹15,000 - ₹25,000+
              </button>
            </div>
          </div>

          <span className="text-xs text-secondary font-semibold flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">flash_on</span>
            <span>4,820 Verified Rooms Available Today</span>
          </span>
        </div>
      </form>
    </div>
  );
};
