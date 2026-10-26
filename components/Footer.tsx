import React from 'react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-outline-variant/30 shadow-[0_-1px_8px_rgba(0,0,0,0.02)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 pb-12 border-b border-surface-container-low">
          {/* Brand Info Column */}
          <div className="lg:col-span-2 flex flex-col gap-3 pr-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white shadow-sm">
                <span className="material-symbols-outlined text-[20px]">apartment</span>
              </div>
              <span className="font-bold text-xl text-primary tracking-tight font-headline-sm">
                PG CONNECT
              </span>
            </Link>
            <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
              India&apos;s trusted institutional rental discovery platform for students and working professionals. Zero brokerage, 100% verified properties, and bank-grade digital tenancy.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="material-symbols-outlined text-secondary text-base">verified_user</span>
              <span className="text-xs text-on-surface font-semibold">
                Bank-Grade KYC &amp; ICICI Escrow Deposit Safety
              </span>
            </div>
          </div>

          {/* For Seekers */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface">For Seekers</span>
            <ul className="flex flex-col gap-2 text-sm text-on-surface-variant">
              <li>
                <Link href="/search?gender=all" className="hover:text-primary transition-colors">
                  Student Hostels
                </Link>
              </li>
              <li>
                <Link href="/search?gender=coliving" className="hover:text-primary transition-colors">
                  Executive Co-Living
                </Link>
              </li>
              <li>
                <Link href="/search?room_type=single" className="hover:text-primary transition-colors">
                  Single Private Rooms
                </Link>
              </li>
              <li>
                <Link href="/search?room_type=double" className="hover:text-primary transition-colors">
                  Twin Sharing (2-Bed)
                </Link>
              </li>
              <li>
                <Link href="/resident/tickets" className="hover:text-primary transition-colors">
                  6-Hour SLA Repair Guarantee
                </Link>
              </li>
            </ul>
          </div>

          {/* For PG Owners */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface">For PG Owners</span>
            <ul className="flex flex-col gap-2 text-sm text-on-surface-variant">
              <li>
                <Link href="/owner/add-property" className="hover:text-primary transition-colors font-medium text-secondary">
                  + List Your Property
                </Link>
              </li>
              <li>
                <Link href="/owner/dashboard" className="hover:text-primary transition-colors">
                  Owner Management Hub
                </Link>
              </li>
              <li>
                <Link href="/owner/dashboard" className="hover:text-primary transition-colors">
                  Floor &amp; Bed Vacancy Matrix
                </Link>
              </li>
              <li>
                <Link href="/owner/dashboard" className="hover:text-primary transition-colors">
                  Automated Rent Ledger
                </Link>
              </li>
              <li>
                <Link href="/auth/signin?role=owner" className="hover:text-primary transition-colors">
                  Owner Portal Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Hubs */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Top Metro Hubs</span>
            <ul className="flex flex-col gap-2 text-sm text-on-surface-variant">
              <li>
                <Link href="/search?city=Bangalore" className="hover:text-primary transition-colors">
                  Bengaluru (Koramangala, HSR)
                </Link>
              </li>
              <li>
                <Link href="/search?city=Hyderabad" className="hover:text-primary transition-colors">
                  Hyderabad (Hitec City, Madhapur)
                </Link>
              </li>
              <li>
                <Link href="/search?city=Pune" className="hover:text-primary transition-colors">
                  Pune (Viman Nagar, Hinjewadi)
                </Link>
              </li>
              <li>
                <Link href="/search?city=Delhi" className="hover:text-primary transition-colors">
                  Delhi NCR (CP, Laxmi Nagar)
                </Link>
              </li>
              <li>
                <Link href="/search?city=Mumbai" className="hover:text-primary transition-colors">
                  Mumbai (Andheri, Borivali)
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Support */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface">Trust &amp; Support</span>
            <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-1 border border-outline-variant/30">
              <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                24x7 Resident Helpline
              </span>
              <span className="text-base font-bold text-primary">1800-209-7426</span>
              <span className="text-xs text-secondary font-medium">support@pgconnect.in</span>
            </div>
            <ul className="flex flex-col gap-1.5 text-xs text-on-surface-variant mt-2">
              <li className="hover:text-primary cursor-pointer">45-Point Audit Standards</li>
              <li className="hover:text-primary cursor-pointer">Deposit Escrow Protection</li>
              <li className="hover:text-primary cursor-pointer">Model Tenancy Act Compliance</li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
          <p>© 2025 PG Connect Technologies Pvt Ltd. All rights reserved. Registered under the Model Tenancy Act compliance framework.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-on-surface cursor-pointer">Privacy Policy</span>
            <span className="hover:text-on-surface cursor-pointer">Tenancy Laws</span>
            <span className="hover:text-on-surface cursor-pointer">Owner Disclaimers</span>
            <span className="hover:text-on-surface cursor-pointer">Dispute Resolution</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
