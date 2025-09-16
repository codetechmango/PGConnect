# PG Finder - Sample Data Setup Guide

This guide will help you set up sample data for your PG Finder application so you can see the app in action with realistic listings.

## Prerequisites

1. **Supabase Project**: Make sure you have created a Supabase project
2. **Database Schema**: Ensure you have run the `supabase-schema.sql` from the main project
3. **Environment Variables**: Your `.env.local` file should be configured

## Step 1: Set Up Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Optional: Storage bucket name (default: pg-images)
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=pg-images
```

### Getting Your Supabase Credentials:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 2: Run Database Schema

First, make sure your database schema is set up. In your Supabase SQL Editor, run the `supabase-schema.sql` file.

## Step 3: Insert Sample Data

Run the `sample-data.sql` script in your Supabase SQL Editor. This will create:

### 📊 **Sample Data Included:**

- **7 User Profiles** (5 owners + 2 regular users)
- **8 PG Listings** across major Indian cities:
  - 🏙️ **Delhi**: 2 PGs (Connaught Place, Laxmi Nagar)
  - 🏙️ **Mumbai**: 2 PGs (Andheri West, Borivali)
  - 🏙️ **Bangalore**: 2 PGs (Koramangala, Whitefield)
  - 🏙️ **Hyderabad**: 1 PG (Madhapur)
  - 🏙️ **Chennai**: 1 PG (Velachery)
- **6 Reviews** with ratings from 3.5 to 4.6 stars
- **3 Sample Bookings** in different statuses
- **4 Favorite listings** for testing

### 🏠 **PG Features Included:**

- ✅ Different room types (single, double, triple)
- ✅ Gender preferences (male, female, any)
- ✅ Price range: ₹8,500 - ₹22,000 per month
- ✅ Realistic amenities (WiFi, AC, Gym, Security, etc.)
- ✅ High-quality placeholder images from Unsplash
- ✅ Realistic descriptions and addresses
- ✅ GPS coordinates for mapping features

## Step 4: Create Storage Bucket (Optional)

If you want to enable image uploads:

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `pg-images`
3. Make it **public** for easy access
4. Set up storage policies (see `supabase-schema.sql` for examples)

## Step 5: Test Your Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000 (or 3001 if 3000 is occupied)

3. You should now see:
   - **8 PG cards** on the homepage
   - **Search functionality** working with the sample cities
   - **Filter options** working with the sample data
   - **Individual PG detail pages** with full information
   - **Working authentication** (you can create test accounts)

## Step 6: Test Different Features

### 🔍 **Search Testing:**
- Try searching for: "Delhi", "Mumbai", "Bangalore", "Hyderabad", "Chennai"
- Test price filters: ₹8,000 - ₹25,000
- Test room type filters: Single, Double, Triple
- Test gender preferences: Male, Female, Any

### 👤 **User Flows:**
- Create a new account
- Browse PG listings
- View detailed PG pages
- Register as an owner (use the sample owner credentials)
- Access owner dashboard

### 🏠 **Owner Features:**
- Use existing owner credentials from sample data:
  - Email: `rajesh.sharma@gmail.com`
  - Email: `priya.patel@gmail.com`
  - Email: `amit.kumar@gmail.com`
  - Email: `sunita.singh@gmail.com`
  - Email: `vikram.reddy@gmail.com`
- View existing listings in dashboard
- Create new listings
- Manage bookings

## Troubleshooting

### ❌ **No PGs Showing:**
- Check your environment variables
- Verify Supabase connection
- Ensure sample data was inserted correctly
- Check browser console for errors

### ❌ **Input Fields Not Visible:**
- This should be fixed with the recent updates
- All input fields now have `text-gray-900` class for visibility

### ❌ **Images Not Loading:**
- The sample data uses Unsplash URLs which should work
- If images don't load, check your internet connection
- For production, upload actual images to your Supabase storage

### ❌ **Authentication Issues:**
- Verify your Supabase keys are correct
- Check that Row Level Security policies are set up
- Ensure you're using the service role key for server-side operations

## Sample Queries for Testing

You can test these search terms to see different results:

```
City: "Delhi" → 2 results
City: "Mumbai" → 2 results  
City: "Bangalore" → 2 results
Price: ₹15,000 - ₹20,000 → 4 results
Room Type: "Single" → 3 results
Gender: "Female" → 2 results
Amenities: "Gym" → 3 results
```

## Next Steps

Once your sample data is working:

1. **Customize the data** to match your target market
2. **Add more PGs** in different cities
3. **Upload real images** to Supabase storage
4. **Configure email templates** for notifications
5. **Set up payment integration** for bookings
6. **Add more amenity options**
7. **Implement advanced search features**

---

🎉 **Your PG Finder application is now ready with realistic sample data!**
