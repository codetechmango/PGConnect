import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  // Determine which client to use: supabaseAdmin if service role key available, else userClient
  const dbClient = (serviceRoleKey && !serviceRoleKey.includes('your_supabase'))
    ? createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
    : userClient;

  // GET: Fetch user's wishlist items
  if (req.method === 'GET') {
    try {
      const { data: wishlist, error: wlErr } = await dbClient
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (wlErr) {
        console.warn('API wishlist query warning:', wlErr.message);
      }

      if (!wishlist) {
        return res.status(200).json({ items: [] });
      }

      const { data: items, error: itemsErr } = await dbClient
        .from('wishlist_items')
        .select(`
          id, property_id, wishlist_id, created_at,
          property:properties(
            id, name, slug, description, address, city, area, landmark, state, pincode, starting_rent,
            gender_preference, rules, gate_closing_time, food_available, food_type,
            is_verified, is_featured, status, created_at, updated_at, owner_id,
            property_images(id, url, is_cover, display_order, caption),
            rooms(id, name, room_type, rent_per_month, deposit_amount, total_beds, ac_available, attached_bathroom, balcony, beds(id, bed_name, status)),
            property_amenities(amenity:amenities(id, name, category)),
            reviews(id, user_id, overall_rating, comment, created_at)
          )
        `)
        .eq('wishlist_id', wishlist.id);

      if (itemsErr) {
        return res.status(400).json({ error: itemsErr.message });
      }

      return res.status(200).json({ items: items || [] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to fetch wishlist' });
    }
  }

  // POST: Toggle item in wishlist (add or remove)
  if (req.method === 'POST') {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId is required' });
    }

    try {
      // 1. Get or create wishlist
      let { data: wishlist } = await dbClient
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!wishlist) {
        const { data: created, error: createErr } = await dbClient
          .from('wishlists')
          .insert([{ user_id: user.id }])
          .select('id')
          .single();

        if (createErr) {
          return res.status(400).json({ error: createErr.message });
        }
        wishlist = created;
      }

      if (!wishlist) {
        return res.status(500).json({ error: 'Failed to obtain wishlist' });
      }

      // 2. Check if item exists in wishlist
      const { data: existing } = await dbClient
        .from('wishlist_items')
        .select('id')
        .eq('wishlist_id', wishlist.id)
        .eq('property_id', propertyId)
        .maybeSingle();

      if (existing) {
        // Remove
        const { error: delErr } = await dbClient
          .from('wishlist_items')
          .delete()
          .eq('id', existing.id);

        if (delErr) {
          return res.status(400).json({ error: delErr.message });
        }
        return res.status(200).json({ favorited: false, propertyId });
      } else {
        // Add
        const { data: newItem, error: addErr } = await dbClient
          .from('wishlist_items')
          .insert([{
            wishlist_id: wishlist.id,
            property_id: propertyId,
          }])
          .select()
          .single();

        if (addErr) {
          return res.status(400).json({ error: addErr.message });
        }
        return res.status(200).json({ favorited: true, item: newItem });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'Failed to toggle wishlist item' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
