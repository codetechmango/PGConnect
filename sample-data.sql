-- Sample Data for PG Finder Application
-- Run this script in your Supabase SQL Editor after setting up the schema

-- First, let's create some sample user profiles (owners)
INSERT INTO profiles (id, email, full_name, phone, is_owner, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'rajesh.sharma@gmail.com', 'Rajesh Sharma', '9876543210', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'priya.patel@gmail.com', 'Priya Patel', '9876543211', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'amit.kumar@gmail.com', 'Amit Kumar', '9876543212', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'sunita.singh@gmail.com', 'Sunita Singh', '9876543213', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'vikram.reddy@gmail.com', 'Vikram Reddy', '9876543214', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'meera.nair@gmail.com', 'Meera Nair', '9876543215', false, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'rohit.gupta@gmail.com', 'Rohit Gupta', '9876543216', false, NOW(), NOW());

-- Sample PG listings across major Indian cities
INSERT INTO pgs (id, title, description, city, area, address, price_per_month, room_type, gender_preference, amenities, images, rating, total_reviews, available_rooms, owner_id, latitude, longitude, created_at, updated_at) VALUES

-- Delhi PGs
('pg-001', 'Comfort Stay PG Near Connaught Place', 'Modern PG accommodation in the heart of Delhi with all essential amenities. Walking distance to metro station and major commercial areas. Clean, safe, and well-maintained rooms with 24/7 security.', 'Delhi', 'Connaught Place', 'A-15, Connaught Place, New Delhi, Delhi 110001', 15000, 'double', 'any', ARRAY['WiFi', 'AC', 'Washing Machine', 'Security', 'Power Backup', 'Water Supply'], ARRAY['https://images.unsplash.com/photo-1555854877-bab0e662b468?w=800', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'], 4.2, 18, 3, '550e8400-e29b-41d4-a716-446655440001', 28.6139, 77.2090, NOW() - INTERVAL '2 months', NOW()),

('pg-002', 'Student Paradise PG Laxmi Nagar', 'Budget-friendly PG perfect for students and working professionals. Close to Delhi University and metro connectivity. Includes mess facility with home-style food and study areas.', 'Delhi', 'Laxmi Nagar', 'B-204, Laxmi Nagar, East Delhi, Delhi 110092', 8500, 'triple', 'male', ARRAY['WiFi', 'Mess/Food', 'Study Room', 'Security', 'Laundry Service'], ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'], 3.8, 25, 2, '550e8400-e29b-41d4-a716-446655440002', 28.6358, 77.2774, NOW() - INTERVAL '1 month', NOW()),

-- Mumbai PGs
('pg-003', 'Elite Ladies PG Andheri West', 'Premium PG accommodation exclusively for working women. Located in upscale Andheri West with easy access to corporate offices and shopping centers. Modern amenities and 24/7 female security.', 'Mumbai', 'Andheri West', 'C-301, Lokhandwala Complex, Andheri West, Mumbai 400053', 22000, 'single', 'female', ARRAY['WiFi', 'AC', 'Gym', 'Security', 'Housekeeping', 'Power Backup', 'Parking'], ARRAY['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', 'https://images.unsplash.com/photo-1505691723518-36e5ac6fbd16?w=800'], 4.6, 32, 1, '550e8400-e29b-41d4-a716-446655440003', 19.1372, 72.8308, NOW() - INTERVAL '3 weeks', NOW()),

('pg-004', 'Budget Stay PG Borivali', 'Affordable PG accommodation in Borivali with basic amenities. Good connectivity to local trains and bus routes. Ideal for students and entry-level professionals looking for economical options.', 'Mumbai', 'Borivali East', 'D-102, Borivali East, Mumbai 400066', 12000, 'double', 'any', ARRAY['WiFi', 'Washing Machine', 'Security', 'Water Supply'], ARRAY['https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800'], 3.5, 14, 4, '550e8400-e29b-41d4-a716-446655440001', 19.2307, 72.8567, NOW() - INTERVAL '2 weeks', NOW()),

-- Bangalore PGs
('pg-005', 'Tech Hub PG Koramangala', 'Modern PG in Koramangala, perfect for IT professionals. Close to major tech companies and startup offices. High-speed internet, power backup, and recreational facilities available.', 'Bangalore', 'Koramangala', 'E-501, 5th Block, Koramangala, Bangalore 560095', 18000, 'single', 'any', ARRAY['WiFi', 'AC', 'Gym', 'Security', 'Power Backup', 'Common Room', 'Parking'], ARRAY['https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800', 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800'], 4.4, 28, 2, '550e8400-e29b-41d4-a716-446655440004', 12.9352, 77.6245, NOW() - INTERVAL '1 week', NOW()),

('pg-006', 'Garden View PG Whitefield', 'Peaceful PG accommodation in Whitefield with garden views. Suitable for professionals working in IT corridor. Well-ventilated rooms with modern amenities and recreational spaces.', 'Bangalore', 'Whitefield', 'F-203, Whitefield, Bangalore 560066', 16000, 'double', 'male', ARRAY['WiFi', 'TV', 'Washing Machine', 'Security', 'Power Backup', 'Study Room'], ARRAY['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'], 4.0, 22, 3, '550e8400-e29b-41d4-a716-446655440005', 12.9698, 77.7500, NOW() - INTERVAL '5 days', NOW()),

-- Hyderabad PGs
('pg-007', 'Royal Stay PG Madhapur', 'Luxury PG accommodation in Madhapur IT hub. Premium amenities including gym, recreational areas, and high-speed internet. Perfect for IT professionals and executives.', 'Hyderabad', 'Madhapur', 'G-401, HITEC City, Madhapur, Hyderabad 500081', 20000, 'single', 'any', ARRAY['WiFi', 'AC', 'Gym', 'TV', 'Housekeeping', 'Security', 'Power Backup', 'Common Room'], ARRAY['https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800', 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800'], 4.5, 35, 2, '550e8400-e29b-41d4-a716-446655440003', 17.4485, 78.3908, NOW() - INTERVAL '3 days', NOW()),

-- Chennai PGs
('pg-008', 'South Comfort PG Velachery', 'Comfortable PG in Velachery with easy access to IT corridor and city center. Family-like environment with home-cooked meals and friendly staff. Ideal for professionals and students.', 'Chennai', 'Velachery', 'H-105, Velachery, Chennai 600042', 14000, 'double', 'female', ARRAY['WiFi', 'Mess/Food', 'Washing Machine', 'Security', 'Water Supply', 'Study Room'], ARRAY['https://images.unsplash.com/photo-1505692952739-1a5ba047c65f?w=800'], 4.1, 19, 3, '550e8400-e29b-41d4-a716-446655440002', 12.9926, 80.2209, NOW() - INTERVAL '1 day', NOW());

-- Sample reviews for the PGs
INSERT INTO reviews (id, pg_id, user_id, rating, comment, created_at) VALUES
('rev-001', 'pg-001', '550e8400-e29b-41d4-a716-446655440006', 4, 'Great location and well-maintained facilities. The owner is very responsive to any issues.', NOW() - INTERVAL '1 week'),
('rev-002', 'pg-001', '550e8400-e29b-41d4-a716-446655440007', 5, 'Excellent PG with all modern amenities. Highly recommended for working professionals.', NOW() - INTERVAL '3 days'),
('rev-003', 'pg-002', '550e8400-e29b-41d4-a716-446655440006', 4, 'Good value for money. The mess food is tasty and rooms are clean.', NOW() - INTERVAL '2 weeks'),
('rev-004', 'pg-003', '550e8400-e29b-41d4-a716-446655440007', 5, 'Perfect for working women. Safe, secure, and well-located. The gym is a great addition.', NOW() - INTERVAL '1 month'),
('rev-005', 'pg-005', '550e8400-e29b-41d4-a716-446655440006', 4, 'Great for IT professionals. Fast internet and power backup is reliable.', NOW() - INTERVAL '5 days'),
('rev-006', 'pg-007', '550e8400-e29b-41d4-a716-446655440007', 5, 'Luxury accommodation with excellent facilities. Worth the price for the amenities provided.', NOW() - INTERVAL '2 days');

-- Add some sample bookings
INSERT INTO bookings (id, pg_id, user_id, check_in_date, status, total_amount, created_at, updated_at) VALUES
('book-001', 'pg-001', '550e8400-e29b-41d4-a716-446655440006', '2024-01-15', 'confirmed', 15000, NOW() - INTERVAL '2 weeks', NOW()),
('book-002', 'pg-003', '550e8400-e29b-41d4-a716-446655440007', '2024-01-20', 'confirmed', 22000, NOW() - INTERVAL '1 week', NOW()),
('book-003', 'pg-005', '550e8400-e29b-41d4-a716-446655440006', '2024-02-01', 'pending', 18000, NOW() - INTERVAL '3 days', NOW());

-- Add some favorites
INSERT INTO favorites (id, user_id, pg_id, created_at) VALUES
('fav-001', '550e8400-e29b-41d4-a716-446655440006', 'pg-003', NOW() - INTERVAL '1 week'),
('fav-002', '550e8400-e29b-41d4-a716-446655440006', 'pg-007', NOW() - INTERVAL '3 days'),
('fav-003', '550e8400-e29b-41d4-a716-446655440007', 'pg-001', NOW() - INTERVAL '5 days'),
('fav-004', '550e8400-e29b-41d4-a716-446655440007', 'pg-005', NOW() - INTERVAL '2 days');
