import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env.local if present
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length > 0) {
          process.env[key.trim()] = values.join('=').trim();
        }
      }
    }
  }
} catch {
  // Ignored
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
  console.error('Error: Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or anon key) in .env.local to run the seed script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const samplePgs = [
  {
    id: '550e8400-e29b-41d4-a716-446655440101',
    title: 'Stanza Living Cambridge House',
    description: 'Executive co-living community in Koramangala. High-speed dual fiber Wi-Fi, chef-prepared North & South Indian meals, and biometric entry.',
    city: 'Bangalore',
    area: 'Koramangala 4th Block',
    address: 'A-15, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
    price_per_month: 14500,
    room_type: 'double',
    gender_preference: 'any',
    amenities: ['WiFi', 'AC', 'Mess/Food', 'Gym', 'Security', 'Power Backup', 'Washing Machine'],
    images: [
      'https://images.unsplash.com/photo-1555854877-bab0e662b468?w=800',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'
    ],
    rating: 4.8,
    total_reviews: 142,
    available_rooms: 4,
    owner_id: '550e8400-e29b-41d4-a716-446655440001',
    latitude: 12.9352,
    longitude: 77.6245
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440102',
    title: 'Serenity Stays Luxury Co-Living & Executive PG',
    description: 'Modern luxury campus with private and sharing rooms, rooftop fitness gym, and FSSAI certified mess.',
    city: 'Bangalore',
    area: 'HSR Layout Sector 2',
    address: '27th Main Road, Sector 2, HSR Layout, Bengaluru, Karnataka 560102',
    price_per_month: 15000,
    room_type: 'double',
    gender_preference: 'any',
    amenities: ['WiFi', 'AC', 'Mess/Food', 'Gym', 'Security', 'Power Backup', 'Housekeeping'],
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
    ],
    rating: 4.9,
    total_reviews: 88,
    available_rooms: 3,
    owner_id: '550e8400-e29b-41d4-a716-446655440001',
    latitude: 12.9121,
    longitude: 77.6446
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440103',
    title: 'Elite Ladies PG Andheri West',
    description: 'Premium PG accommodation exclusively for working women. Modern amenities and 24/7 female security.',
    city: 'Mumbai',
    area: 'Andheri West',
    address: 'C-301, Lokhandwala Complex, Andheri West, Mumbai 400053',
    price_per_month: 22000,
    room_type: 'single',
    gender_preference: 'female',
    amenities: ['WiFi', 'AC', 'Gym', 'Security', 'Housekeeping', 'Power Backup'],
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
    ],
    rating: 4.6,
    total_reviews: 32,
    available_rooms: 2,
    owner_id: '550e8400-e29b-41d4-a716-446655440001',
    latitude: 19.1372,
    longitude: 72.8308
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440104',
    title: 'Student Paradise PG Laxmi Nagar',
    description: 'Budget-friendly PG perfect for students and young professionals. Close to metro connectivity with full mess facility.',
    city: 'Delhi',
    area: 'Laxmi Nagar',
    address: 'B-204, Laxmi Nagar, East Delhi, Delhi 110092',
    price_per_month: 8500,
    room_type: 'triple',
    gender_preference: 'male',
    amenities: ['WiFi', 'Mess/Food', 'Security', 'Washing Machine'],
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'
    ],
    rating: 3.8,
    total_reviews: 25,
    available_rooms: 5,
    owner_id: '550e8400-e29b-41d4-a716-446655440001',
    latitude: 28.6358,
    longitude: 77.2774
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440105',
    title: 'Royal Stay PG Madhapur IT Hub',
    description: 'Luxury accommodation in Madhapur IT corridor. High-speed Wi-Fi, gym, and chef-cooked meals.',
    city: 'Hyderabad',
    area: 'Madhapur',
    address: 'G-401, HITEC City, Madhapur, Hyderabad 500081',
    price_per_month: 18000,
    room_type: 'single',
    gender_preference: 'any',
    amenities: ['WiFi', 'AC', 'Gym', 'Mess/Food', 'Security', 'Power Backup'],
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
    ],
    rating: 4.5,
    total_reviews: 35,
    available_rooms: 2,
    owner_id: '550e8400-e29b-41d4-a716-446655440001',
    latitude: 17.4485,
    longitude: 78.3908
  }
];

async function seed() {
  console.log('Seeding PG Connect database with development records...');
  for (const pg of samplePgs) {
    const { error } = await supabase.from('pgs').upsert(pg, { onConflict: 'id' });
    if (error) {
      console.warn(`Could not seed ${pg.title}: ${error.message}`);
    } else {
      console.log(`✓ Seeded ${pg.title}`);
    }
  }
  console.log('Seeding completed successfully!');
}

seed();
