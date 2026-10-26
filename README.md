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
