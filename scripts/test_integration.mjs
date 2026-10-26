import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
let supabaseUrl = '';
let supabaseAnonKey = '';
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [k, ...v] = trimmed.split('=');
  const val = v.join('=').trim().replace(/^['"]|['"]$/g, '');
  if (k.trim() === 'NEXT_PUBLIC_SUPABASE_URL') supabaseUrl = val;
  if (k.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') supabaseAnonKey = val;
}

async function testResidentAndOwner() {
  console.log('=== TEST 1: RESIDENT WISHLIST TEST ===');
  const residentClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: resAuth, error: resAuthErr } = await residentClient.auth.signInWithPassword({
    email: 'sai@gmail.com',
    password: 'Password123!',
  });

  if (resAuthErr) {
    console.error('Resident sign-in error:', resAuthErr.message);
  } else {
    console.log('Resident signed in successfully:', resAuth.user.id, resAuth.user.email);
    const userId = resAuth.user.id;

    // Check wishlists table
    let { data: wl, error: wlFetchErr } = await residentClient
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('Wishlist query result:', wl, 'Error:', wlFetchErr?.message);

    if (!wl) {
      console.log('Attempting to create wishlist for resident...');
      const { data: newWl, error: newWlErr } = await residentClient
        .from('wishlists')
        .insert([{ user_id: userId }])
        .select('id')
        .single();
      console.log('Wishlist insert result:', newWl, 'Error:', newWlErr?.message);
      if (newWl) wl = newWl;
    }

    if (wl) {
      const propId = '9782994c-45e1-4a32-8ef9-8d04aa51bdd6';
      console.log(`Adding property ${propId} to wishlist ${wl.id}...`);
      const { data: itemInsert, error: itemErr } = await residentClient
        .from('wishlist_items')
        .insert([{ wishlist_id: wl.id, property_id: propId }])
        .select();
      console.log('Wishlist item insert result:', itemInsert, 'Error:', itemErr?.message);

      // Fetch wishlist items
      const { data: items, error: fetchItemsErr } = await residentClient
        .from('wishlist_items')
        .select('id, property_id, wishlist_id, property:properties(id, name, city)')
        .eq('wishlist_id', wl.id);
      console.log('Fetched wishlist items:', items, 'Error:', fetchItemsErr?.message);

      // Now remove property from wishlist
      if (itemInsert && itemInsert.length > 0) {
        console.log(`Removing item ${itemInsert[0].id}...`);
        const { error: delErr } = await residentClient
          .from('wishlist_items')
          .delete()
          .eq('id', itemInsert[0].id);
        console.log('Delete result error:', delErr?.message || 'Deleted successfully');
      }
    }
  }

  console.log('\n=== TEST 2: OWNER PUBLISHING TEST ===');
  const ownerClient = createClient(supabaseUrl, supabaseAnonKey);
  const { data: ownerAuth, error: ownerAuthErr } = await ownerClient.auth.signInWithPassword({
    email: 'owner@pgconnect.in',
    password: 'Password123!',
  });

  if (ownerAuthErr) {
    console.error('Owner sign-in error:', ownerAuthErr.message);
  } else {
    console.log('Owner signed in successfully:', ownerAuth.user.id, ownerAuth.user.email);
    const ownerId = ownerAuth.user.id;

    // Test inserting property via authenticated owner client
    const testSlug = 'test-pg-' + Date.now().toString(36);
    const { data: newProp, error: propErr } = await ownerClient
      .from('properties')
      .insert([{
        name: 'Automated Test PG',
        slug: testSlug,
        description: 'Test co-living property created by integration test',
        city: 'Bangalore',
        area: 'HSR Layout',
        address: '123 Test Street, Sector 2',
        landmark: 'Near Silk Board',
        state: 'Karnataka',
        pincode: '560102',
        starting_rent: 11000,
        deposit_amount: 22000,
        notice_period_days: 30,
        gender_preference: 'any',
        rules: ['Gate closing: 22:30'],
        gate_closing_time: '22:30',
        food_available: true,
        food_type: 'Veg & Non-Veg',
        is_verified: true,
        is_featured: false,
        status: 'approved',
        owner_id: ownerId,
      }])
      .select()
      .single();

    console.log('Property insert result:', newProp?.id, 'Error:', propErr?.message);

    if (newProp) {
      // Test inserting room
      const { data: newRoom, error: roomErr } = await ownerClient
        .from('rooms')
        .insert([{
          property_id: newProp.id,
          name: 'DOUBLE Room',
          room_type: 'double',
          rent_per_month: 11000,
          deposit_amount: 22000,
          total_beds: 2,
          ac_available: true,
          attached_bathroom: true,
          balcony: false,
        }])
        .select()
        .single();
      console.log('Room insert result:', newRoom?.id, 'Error:', roomErr?.message);

      // Test inserting image
      const { error: imgErr } = await ownerClient
        .from('property_images')
        .insert([{
          property_id: newProp.id,
          url: 'https://images.unsplash.com/photo-1555854877-bab0e662b468?w=800',
          is_cover: true,
          display_order: 0,
          caption: 'Test Image',
        }]);
      console.log('Image insert error:', imgErr?.message || 'Success');

      // Test searching newly created property in public catalog
      const { data: searchProp, error: searchErr } = await ownerClient
        .from('properties')
        .select('id, name, city, starting_rent, status')
        .eq('id', newProp.id)
        .single();
      console.log('Search property in public catalog:', searchProp, 'Error:', searchErr?.message);

      // Cleanup test property
      console.log('Cleaning up test property...');
      await ownerClient.from('properties').delete().eq('id', newProp.id);
      console.log('Cleaned up test property.');
    }
  }
}

testResidentAndOwner().catch(console.error);
