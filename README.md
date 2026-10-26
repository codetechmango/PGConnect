<div align="center">

# 🏢 PG Connect
### Institutional Rental Discovery & Management Platform
**Find a PG That Feels Like Home • Zero Brokerage • 100% Physically Audited**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

<br />

[Explore Listings](http://localhost:3000/search) • [Demo Owner Hub](http://localhost:3000/auth/signin?role=owner) • [Resident Portal](http://localhost:3000/auth/signin?role=resident) • [Maintenance SLA](http://localhost:3000/resident/tickets)

</div>

---

## 📌 Overview

**PG Connect** is a full-stack, enterprise-grade co-living and Paying Guest (PG) discovery platform built for students and working professionals in India's top tech corridors. Designed under the principles of the **Model Tenancy Act**, PG Connect eliminates predatory brokerages, standardizes property audits, and automates owner operations with real-time floor bed matrices, token escrow lock-ins, and SLA-backed maintenance ticket management.

The platform comes equipped with **dual-role workflows (Resident & Owner)**, role-based access control, a multi-step property onboarding wizard, and an instant **Offline/Demo Simulation Mode** that allows full feature exploration with zero setup friction.

---

## ✨ Key Features

### 🔍 For Tenants & Residents
* **Smart Locality Search & Fuzzy Matching**: Search across major IT hubs (Bangalore, Mumbai, Delhi, Hyderabad, Chennai) with instant radius, gender preference, room type, and price filters.
* **100% Physically Audited Listings**: High-definition image carousels, full amenity checklists (Wi-Fi, 3-tier meals, AC, biometric security, power backup), and verified badges.
* **Interactive 360° Virtual Tour**: Preview room interiors, dining halls, and common recreation lounges before booking.
* **Schedule Physical Visit or Lock Bed**: Free calendar slot scheduling with instant QR/biometric turnstile gate pass OTP generation or ₹1,000 digital escrow deposit bed reservation.
* **Resident Portal**:
  * Real-time active stay dashboard with landlord contacts.
  * One-tap Wi-Fi SSID credential copying.
  * Dinner/meal skip toggle (anti-food waste notification).
  * Dynamic gate pass OTP generator.
* **Maintenance SLA Tracking**: Category-based grievance reporting (Electrical, Plumbing, Carpentry, Wi-Fi) with guaranteed emergency turnaround countdown timers (e.g., 4-hour SLA).
* **Saved Wishlist**: Persistent synchronized bookmark tray for comparing properties.

### 🏢 For PG Owners & Operators
* **Owner Management Hub**:
  * Real-time floor & bed availability matrix (Single, Double, Triple sharing).
  * Actionable visitor queue: 1-click **Approve** or **Decline** visit requests with automated push/in-app notifications to residents.
  * Bed lock escrow tracking and occupancy rate analytics (e.g., 94.2% occupancy KPI).
* **6-Step Property Listing Wizard** (`/owner/add-property`):
  1. *Basic Details* (Name, category, target demographic).
  2. *Location & Landmark* (City, GPS pinning, tech park proximity).
  3. *Room Matrix & Inventory* (Single/Twin/Triple sharing, room pricing, deposits).
  4. *Amenities & House Rules* (FSSAI food menus, gate closing hours, gym).
  5. *Media & Photos* (Multi-image cover uploader with drag-and-drop support).
  6. *Compliance Verification* (Fire safety certificates, commercial licenses).
* **Automated Notification Dispatch**: Real-time notification bell dropdown with unread badges and batch read actions.

### ⚡ Developer Experience & Resilience
* **Built-in Offline / Demo Mode**: Instant 1-click login for both Demo Owner and Demo Resident roles—enabling full UI and end-to-end flow evaluation even when remote databases are unconfigured or offline.
* **Self-Healing Fallbacks**: Automatic graceful degradation to localized mock listings if remote Supabase endpoints experience network failure.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [Next.js 15.5](https://nextjs.org/) (Pages Router with optimized SSR & SSG) |
| **UI Library** | [React 19.1](https://react.dev/) with hooks (`useMemo`, `useCallback`, `useContext`) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict mode, fully typed domain models) |
| **Styling** | [Tailwind CSS 4.0](https://tailwindcss.com/) + PostCSS + Material Symbols & Inter/Plus Jakarta Sans Typography |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15, Row Level Security, Storage Buckets, GoTrue Auth) |
| **Forms & State** | React Hook Form, Custom AuthContext, LocalStorage Sync Mirrors |
| **Build & Tooling** | ESLint 9, Next Config Trace Rooting, Node.js |

---

## 🏗️ Architecture & Directory Structure

```
PGConnect/
├── components/                  # Modular, reusable UI components
│   ├── BookingModal.tsx         # Schedule visit & ₹1,000 escrow lock modal
│   ├── Footer.tsx               # Footer with quick links and trust badges
│   ├── Navbar.tsx               # Header with global search, notif flyout & active tabs
│   ├── PGCard.tsx               # Listing card with price, amenities, and wishlist heart
│   ├── ProtectedRoute.tsx       # Higher-order component enforcing OWNER / USER roles
│   ├── SearchBar.tsx            # Filter bar for city, gender, and price range
│   └── VirtualTourModal.tsx     # 360° interactive property tour viewer
├── lib/                         # Core platform utilities & clients
│   ├── authContext.tsx          # Authentication provider with session restore & demo mode
│   └── supabaseClient.ts        # Supabase API client, RLS helpers, and offline fallbacks
├── pages/                       # Application routing & page views
│   ├── _app.tsx                 # Global application shell, fonts, and meta tags
│   ├── index.tsx                # Landing page with audited showcase & trust markers
│   ├── search.tsx               # Dynamic filter catalog with price & room selectors
│   ├── auth/
│   │   ├── signin.tsx           # Multi-role signin with 1-Click Demo buttons
│   │   └── signup.tsx           # Registration with email verification & phone fields
│   ├── owner/
│   │   ├── dashboard.tsx        # Owner hub with bed matrix, visitor requests & KPIs
│   │   └── add-property.tsx     # 6-step interactive property publishing wizard
│   ├── resident/
│   │   ├── dashboard.tsx        # Resident stay dashboard with meal skip & gate OTP
│   │   ├── favorites.tsx        # Saved property wishlist view
│   │   └── tickets.tsx          # Maintenance SLA ticketing with countdown timers
│   ├── pg/[id].tsx              # Comprehensive listing detail view with review breakdown
│   └── api/                     # Backend API endpoints
│       ├── auth/register.ts     # Admin auto-confirm user registration
│       ├── properties/publish.ts# Verified property ingestion
│       └── wishlist/index.ts    # Server-validated wishlist persistence
├── public/                      # Static assets & generated brand icons
│   ├── apple-touch-icon.png     # Apple touch icon
│   ├── favicon.ico              # Multi-resolution favicon
│   └── favicon.svg              # Scalable SVG brand logo
├── scripts/                     # Seeding & automation utilities
│   └── seed.mjs                 # Database seed script for test properties & owners
├── styles/                      # CSS design tokens & theme configurations
│   └── globals.css              # Theme tokens, fonts, and Tailwind directives
├── supabase-schema.sql          # Primary database schema & RLS policies
└── next.config.ts               # Next.js configuration with outputFileTracingRoot
```

---

## 🚀 Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/codetechmango/PGConnect.git
cd PGConnect
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in your root directory (or copy from [.env.example](file:///Users/saikiran/PG-CONNECT/PGConnect/.env.example)):

```bash
cp .env.example .env.local
```

Populate `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Optional: Supabase Storage bucket for photo uploads (default: pg-images)
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=pg-images
```

> [!NOTE]  
> **Testing Without Supabase?**  
> If you don't have a Supabase project ready, you can still run the app immediately! The application automatically falls back to built-in sample listings and provides **1-Click Demo Sign In** on `/auth/signin`.

### 4. Database Setup (Optional for Live DB)
If using a live Supabase database:
1. Open your [Supabase SQL Editor](https://supabase.com/dashboard).
2. Execute [supabase-schema.sql](file:///Users/saikiran/PG-CONNECT/PGConnect/supabase-schema.sql) to provision tables (`profiles`, `properties`, `rooms`, `beds`, `amenities`, `bookings`, `notifications`, `reports`).
3. Run the database seed script:
   ```bash
   npm run seed
   ```

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Credentials

To test both sides of the platform immediately without registration, use the 1-Click buttons on `/auth/signin` or enter:

| Role | Email | Password | Access Area |
| :--- | :--- | :--- | :--- |
| **PG Owner / Partner** | `owner1@gmail.com` | `Password123!` | `/owner/dashboard` (Bed matrix, inquiries) |
| **Verified Resident** | `resident@gmail.com` | `Password123!` | `/resident/dashboard` (Gate pass, meal skip, SLA) |

---

## 📜 Available NPM Scripts

* `npm run dev`: Boots Next.js development server on `http://localhost:3000`
* `npm run build`: Compiles production build and runs static page optimization
* `npm run start`: Runs the compiled production server
* `npm run lint`: Executes ESLint validation across all components and pages
* `npm run seed`: Populates Supabase database with sample properties, owners, and rooms

---

## 🔒 Security & Compliance

* **Row Level Security (RLS)**: PostgreSQL policies isolate user records, so residents only view their own bookings and tickets, while PG owners access only their properties.
* **Protection Against Privilege Escalation**: Client-side profile updates filter out `role` and `is_owner` parameters.
* **Session Persistence**: Sanitized token management using safe `localStorage` cache invalidation upon sign-out.
* **Strict Validation**: All phone numbers and email addresses are normalized with regex validation before submission.

---

## 📄 License

This project is licensed under the **MIT License**. Feel free to use, modify, and distribute for personal or commercial projects.

---

<div align="center">
  <sub>Crafted with ❤️ for students and professionals seeking a better rental experience.</sub>
</div>
