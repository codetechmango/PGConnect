import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey) {
    return res.status(500).json({ error: 'Supabase configuration missing' });
  }

  // 1. Extract Bearer token
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization token' });
  }
  const token = authHeader.split(' ')[1];

  // 2. Validate user identity using Supabase Auth
  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authErr } = await userClient.auth.getUser(token);
  if (authErr || !user) {
    return res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
  }

  // 3. Verify user has OWNER role
  const { data: profile } = await userClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isOwner = (profile?.role || '').toUpperCase() === 'OWNER';
  if (!isOwner) {
    return res.status(403).json({ error: 'Forbidden: Only registered PG Owners can publish property listings.' });
  }

  // If service role key is not configured, instruct client to use client-side Supabase SDK
  if (!serviceRoleKey || serviceRoleKey.includes('your_supabase')) {
    return res.status(200).json({ fallbackToClient: true });
  }

  const {
    title,
    description,
    city,
    area,
    address,
    landmark,
    state,
    pincode,
    genderPreference,
    roomType,
    pricePerMonth,
    availableRooms,
    depositMonths,
    foodIncluded,
    foodTypes,
    amenities,
    gateTimings,
    images,
  } = req.body;

  if (!title || !city || !address) {
    return res.status(400).json({ error: 'Title, city, and address are required fields.' });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const propSlug = String(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .substring(0, 40) + '-' + Date.now().toString(36);

    const startingRent = Number(pricePerMonth) || 12000;
    const cleanState = state || 'Karnataka';
    const cleanPincode = pincode || '560034';
    const validGender = ['male', 'female', 'any'].includes(genderPreference) ? genderPreference : 'any';

    // 1. Insert Property
    const propertyPayload = {
      name: title.trim(),
      slug: propSlug,
      description: description?.trim() || 'Modern executive co-living facility located in prime tech corridor with premium amenities and chef-prepared meals.',
      city: city.trim(),
      area: area?.trim() || city.trim(),
      address: address.trim(),
      landmark: landmark?.trim() || area?.trim() || '',
      state: cleanState,
      pincode: cleanPincode,
      starting_rent: startingRent,
      deposit_amount: startingRent * (Number(depositMonths) || 2),
      notice_period_days: 30,
      gender_preference: validGender,
      rules: gateTimings ? [`Gate closing timing: ${gateTimings}`] : [],
      gate_closing_time: gateTimings || '22:30',
      food_available: Boolean(foodIncluded),
      food_type: Array.isArray(foodTypes) && foodTypes.length > 0 ? foodTypes.join(', ') : 'Veg & Non-Veg',
      is_verified: true,
      is_featured: false,
      status: 'approved',
      owner_id: user.id,
    };

    const { data: prop, error: propErr } = await supabaseAdmin
      .from('properties')
      .insert([propertyPayload])
      .select()
      .single();

    if (propErr) {
      console.error('Server property insert error:', propErr);
      return res.status(400).json({ error: propErr.message });
    }

    // 2. Insert Room
    const validRoomType = ['single', 'double', 'triple', 'dormitory'].includes(roomType) ? roomType : 'double';
    const totalBedsCount = Number(availableRooms) || 4;
    const depositAmount = startingRent * (Number(depositMonths) || 2);

    const { data: room, error: roomErr } = await supabaseAdmin
      .from('rooms')
      .insert([{
        property_id: prop.id,
        name: `${validRoomType.toUpperCase()} Room`,
        room_type: validRoomType,
        rent_per_month: startingRent,
        deposit_amount: depositAmount,
        total_beds: totalBedsCount,
        ac_available: Array.isArray(amenities) && amenities.some((a: string) => a.toLowerCase().includes('ac') || a.toLowerCase().includes('air')),
        attached_bathroom: true,
        balcony: false,
      }])
      .select()
      .single();

    if (roomErr) {
      console.warn('Room insert note:', roomErr.message);
    }

    // 3. Insert Beds
    if (room) {
      const bedRows = Array.from({ length: Math.min(totalBedsCount, 12) }).map((_, i) => ({
        room_id: room.id,
        bed_name: `Bed ${String.fromCharCode(65 + i)}`,
        status: 'available',
      }));
      const { error: bedErr } = await supabaseAdmin.from('beds').insert(bedRows);
      if (bedErr) {
        console.warn('Beds insert note:', bedErr.message);
      }
    }

    // 4. Insert Images
    if (Array.isArray(images) && images.length > 0) {
      const imageRows = images.map((url: string, idx: number) => ({
        property_id: prop.id,
        url,
        is_cover: idx === 0,
        display_order: idx,
        caption: title,
      }));
      const { error: imgErr } = await supabaseAdmin.from('property_images').insert(imageRows);
      if (imgErr) {
        console.warn('Images insert note:', imgErr.message);
      }
    }

    // 5. Link Amenities
    if (Array.isArray(amenities) && amenities.length > 0) {
      try {
        for (const amenName of amenities) {
          // Find or create amenity
          let { data: existingAmen } = await supabaseAdmin
            .from('amenities')
            .select('id')
            .ilike('name', amenName)
            .maybeSingle();

          if (!existingAmen) {
            const { data: newAmen } = await supabaseAdmin
              .from('amenities')
              .insert([{ name: amenName, category: 'General' }])
              .select('id')
              .maybeSingle();
            existingAmen = newAmen;
          }

          if (existingAmen?.id) {
            await supabaseAdmin.from('property_amenities').insert([{
              property_id: prop.id,
              amenity_id: existingAmen.id,
            }]);
          }
        }
      } catch (amenErr) {
        console.warn('Amenities linking note:', amenErr);
      }
    }

    // 6. Ensure owner record exists in owners table
    try {
      await supabaseAdmin.from('owners').upsert({
        profile_id: user.id,
        business_name: title || 'PG Host Operator',
        verification_status: 'verified',
      }, { onConflict: 'profile_id' });
    } catch (ownerErr) {
      console.warn('Owner upsert note:', ownerErr);
    }

    return res.status(200).json({ success: true, property: prop });
  } catch (err: any) {
    console.error('Unexpected publish error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error while publishing' });
  }
}
