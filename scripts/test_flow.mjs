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

const client = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const residentEmail = `resident_test_${Date.now()}@gmail.com`;
  const ownerEmail = `owner_test_${Date.now()}@gmail.com`;
  const testPassword = 'Password123!';

  console.log('--- 1. Testing Resident Signup & Signin ---');
  const resSignup = await client.auth.signUp({
    email: residentEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Test Resident',
        role: 'USER',
      }
    }
  });

  console.log('Resident signup status:', resSignup.data.user ? 'Created user ' + resSignup.data.user.id : resSignup.error?.message);
  let residentUser = resSignup.data.user;
  let residentSession = resSignup.data.session;

  if (!residentSession) {
    // Try signin
    const resSignIn = await client.auth.signInWithPassword({
      email: residentEmail,
      password: testPassword
    });
    console.log('Resident sign-in status:', resSignIn.data.session ? 'Session active' : resSignIn.error?.message);
    residentUser = resSignIn.data.user;
    residentSession = resSignIn.data.session;
  }

  if (residentSession) {
    console.log('--- 2. Testing Wishlist Operations with Resident Client ---');
    const residentAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${residentSession.access_token}` } }
    });

    // Insert profile
    await residentAuthClient.from('profiles').upsert({
      id: residentUser.id,
      email: residentEmail,
      full_name: 'Test Resident',
      role: 'USER',
    });

    // Check / create wishlist
    let { data: wl, error: wlErr } = await residentAuthClient
      .from('wishlists')
      .select('id')
      .eq('user_id', residentUser.id)
      .maybeSingle();
    console.log('Existing wishlist query:', wl, wlErr?.message);

    if (!wl) {
      const { data: newWl, error: newWlErr } = await residentAuthClient
        .from('wishlists')
        .insert([{ user_id: residentUser.id }])
        .select('id')
        .single();
      console.log('Create wishlist result:', newWl, 'Error:', newWlErr?.message);
      wl = newWl;
    }

    if (wl) {
      const samplePropId = '9782994c-45e1-4a32-8ef9-8d04aa51bdd6';
      console.log('Inserting wishlist item...');
      const { data: item, error: itemErr } = await residentAuthClient
        .from('wishlist_items')
        .insert([{ wishlist_id: wl.id, property_id: samplePropId }])
        .select();
      console.log('Wishlist item insert:', item, 'Error:', itemErr?.message);

      // Query wishlist items
      const { data: fetchItems, error: fetchErr } = await residentAuthClient
        .from('wishlist_items')
        .select('id, property_id, wishlist_id, property:properties(id, name)')
        .eq('wishlist_id', wl.id);
      console.log('Wishlist items fetched:', fetchItems?.length, 'items. Error:', fetchErr?.message);

      // Remove item
      if (item && item.length > 0) {
        const { error: delErr } = await residentAuthClient
          .from('wishlist_items')
          .delete()
          .eq('id', item[0].id);
        console.log('Wishlist item remove error:', delErr?.message || 'None (Success)');
      }
    }
  }

  console.log('\n--- 3. Testing Owner Signup & Property Publishing ---');
  const ownerSignup = await client.auth.signUp({
    email: ownerEmail,
    password: testPassword,
    options: {
      data: {
        full_name: 'Test Owner',
        role: 'OWNER',
      }
    }
  });

  console.log('Owner signup status:', ownerSignup.data.user ? 'Created user ' + ownerSignup.data.user.id : ownerSignup.error?.message);
  let ownerUser = ownerSignup.data.user;
  let ownerSession = ownerSignup.data.session;

  if (!ownerSession) {
    const ownerSignIn = await client.auth.signInWithPassword({
      email: ownerEmail,
      password: testPassword
    });
    console.log('Owner sign-in status:', ownerSignIn.data.session ? 'Session active' : ownerSignIn.error?.message);
    ownerUser = ownerSignIn.data.user;
    ownerSession = ownerSignIn.data.session;
  }

  if (ownerSession) {
    const ownerAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${ownerSession.access_token}` } }
    });

    // Profile & Owner entry
    await ownerAuthClient.from('profiles').upsert({
      id: ownerUser.id,
      email: ownerEmail,
      full_name: 'Test Owner',
      role: 'OWNER',
    });

    await ownerAuthClient.from('owners').upsert({
      profile_id: ownerUser.id,
      business_name: 'Test Owner PG Ltd',
      verification_status: 'verified',
    }, { onConflict: 'profile_id' });

    console.log('Publishing property with owner client...');
    const testSlug = 'e2e-test-' + Date.now().toString(36);
    const { data: prop, error: propErr } = await ownerAuthClient
      .from('properties')
      .insert([{
        name: 'E2E Test PG Listing',
        slug: testSlug,
        description: 'E2E test description',
        city: 'Bangalore',
        area: 'Indiranagar',
        address: '100 Feet Road',
        landmark: 'Near Metro',
        state: 'Karnataka',
        pincode: '560038',
        starting_rent: 15000,
        deposit_amount: 30000,
        notice_period_days: 30,
        gender_preference: 'any',
        rules: ['Gate closing: 23:00'],
        gate_closing_time: '23:00',
        food_available: true,
        food_type: 'Veg & Non-Veg',
        is_verified: true,
        is_featured: false,
        status: 'approved',
        owner_id: ownerUser.id,
      }])
      .select()
      .single();

    console.log('Property publish result:', prop?.id, 'Error:', propErr?.message);

    if (prop) {
      // Room insert
      const { data: room, error: roomErr } = await ownerAuthClient
        .from('rooms')
        .insert([{
          property_id: prop.id,
          name: 'DELUXE Room',
          room_type: 'single',
          rent_per_month: 15000,
          deposit_amount: 30000,
          total_beds: 1,
          ac_available: true,
          attached_bathroom: true,
          balcony: true,
        }])
        .select()
        .single();
      console.log('Room publish result:', room?.id, 'Error:', roomErr?.message);

      // Image insert
      const { error: imgErr } = await ownerAuthClient
        .from('property_images')
        .insert([{
          property_id: prop.id,
          url: 'https://images.unsplash.com/photo-1555854877-bab0e662b468?w=800',
          is_cover: true,
          display_order: 0,
          caption: 'Deluxe Suite',
        }]);
      console.log('Image publish error:', imgErr?.message || 'None (Success)');

      // Verify in public search query (anon client)
      const { data: publicSearch, error: searchErr } = await client
        .from('properties')
        .select('id, name, city, starting_rent, status')
        .eq('id', prop.id)
        .single();
      console.log('Public search query for newly published property:', publicSearch, 'Error:', searchErr?.message);

      // Cleanup
      console.log('Cleaning up property...');
      await ownerAuthClient.from('properties').delete().eq('id', prop.id);
      console.log('Property cleaned up.');
    }
  }
}

run().catch(console.error);
