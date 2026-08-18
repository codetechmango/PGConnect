# PGConnect 🏠

A comprehensive web application for finding and listing Paying Guest (PG) accommodations. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

### For Tenants
- 🔍 **Smart Search**: Find PGs by city, price range, room type, and amenities
- 📱 **Responsive Design**: Seamless experience across all devices
- ⭐ **Reviews & Ratings**: Read authentic reviews from previous tenants
- ❤️ **Favorites**: Save PGs you're interested in
- 📞 **Direct Contact**: Connect directly with PG owners
- 📅 **Easy Booking**: Simple booking process with status tracking

### For PG Owners
- 🏠 **List Your PG**: Create detailed listings with multiple images
- 📊 **Dashboard**: Manage all your listings from one place
- 💰 **Revenue Tracking**: Monitor bookings and earnings
- 📸 **Image Management**: Upload and organize property photos
- 🔧 **Easy Editing**: Update your listings anytime

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Heroicons
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Forms**: React Hook Form
- **Deployment**: Vercel-ready



## Project Structure

```
pg-finder/
├── components/           # Reusable UI components
│   ├── Navbar.tsx       # Navigation bar
│   ├── SearchBar.tsx    # Search and filters
│   ├── PGCard.tsx       # PG listing card
│   ├── RatingStars.tsx  # Star rating component
│   ├── OwnerForm.tsx    # Create/edit PG form
│   └── ImageUploader.tsx # Image upload component
├── pages/               # Next.js pages
│   ├── index.tsx        # Home/search page
│   ├── pg/[id].tsx      # PG details page
│   ├── auth/            # Authentication pages
│   ├── owner/           # Owner-specific pages
│   └── api/             # API routes
├── lib/                 # Utility libraries
│   ├── supabaseClient.ts # Client-side Supabase
│   └── supabaseAdmin.ts  # Server-side Supabase
├── types/               # TypeScript type definitions
└── supabase-schema.sql  # Database schema
```

## Key Features Implementation

### Authentication
- Built with Supabase Auth
- Email/password authentication
- Protected routes for owners
- Automatic profile creation

### Search & Filtering
- Real-time search across multiple fields
- Advanced filters (price, room type, amenities, gender preference)
- City-based search with fuzzy matching

### Image Management
- Multiple image uploads per listing
- Supabase Storage integration
- Image optimization and responsive display
- Drag-and-drop functionality

### Booking System
- Secure booking API with server-side validation
- Real-time availability checking
- Booking status management
- Owner-tenant communication

### Owner Dashboard
- Comprehensive listing management
- Revenue and booking analytics
- Real-time statistics
- Easy CRUD operations

## Database Schema

The application uses PostgreSQL through Supabase with the following main tables:

- **profiles**: User profiles with owner flags
- **pgs**: PG listings with all details
- **reviews**: User reviews and ratings
- **bookings**: Booking requests and confirmations
- **favorites**: User favorite listings

Row Level Security (RLS) is implemented for data protection.

## API Routes

### `/api/createBooking`
- **Method**: POST
- **Purpose**: Create new booking requests
- **Authentication**: Required
- **Security**: Server-side validation with Supabase Admin

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically


## Security

- Row Level Security (RLS) enabled on all tables
- Server-side validation for critical operations
- Secure file uploads with type validation
- Protected API routes

## Performance

- Next.js optimizations (Image optimization, code splitting)
- Database indexing for fast queries
- Lazy loading for images
- Responsive design for all devices



