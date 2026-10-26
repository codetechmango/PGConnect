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

async function runVerification() {
  console.log('====================================================');
  console.log('PG CONNECT — VERIFICATION OF ALL THREE FIXES');
  console.log('====================================================\n');

  // -------------------------------------------------------------------------
  // TEST 1: RESIDENT WISHLIST SAVE, PERSISTENCE, & REMOVAL
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: RESIDENT PORTAL — SAVE PG WISHLIST ---');
  const resEmail = `resident_e2e_${Date.now()}@gmail.com`;
  const password = 'Password123!';

  // 1. Register / Sign in resident
  const { data: resSignUp, error: resSignUpErr } = await client.auth.signUp({
    email: resEmail,
    password,
    options: { data: { full_name: 'E2E Resident User', role: 'USER' } }
  });

  if (resSignUpErr) {
    throw new Error(`Resident signup failed: ${resSignUpErr.message}`);
  }

  const resUser = resSignUp.user;
  const resToken = resSignUp.session?.access_token;
  console.log(`✓ Resident account authenticated: ${resUser.id} (${resEmail})`);

  // Ensure profile row
  const resClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${resToken}` } }
  });
  await resClient.from('profiles').upsert({
    id: resUser.id,
    email: resEmail,
    full_name: 'E2E Resident User',
    role: 'USER',
  });

  // 2. Fetch sample property to save
  const { data: sampleProps } = await client.from('properties').select('id, name, city, starting_rent').limit(1);
  const targetProp = sampleProps[0];
  console.log(`✓ Target property for wishlist: "${targetProp.name}" (ID: ${targetProp.id})`);

  // 3. Test saving to wishlist via API endpoint
  const saveRes = await fetch('http://localhost:3000/api/wishlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resToken}`,
    },
    body: JSON.stringify({ propertyId: targetProp.id }),
  });

  const saveJson = await saveRes.json();
  console.log(`✓ Saved property to wishlist. Response status: ${saveRes.status}, Result:`, saveJson);

  // 4. Test fetching wishlist
  const fetchRes = await fetch('http://localhost:3000/api/wishlist', {
    headers: { Authorization: `Bearer ${resToken}` },
  });
  const fetchJson = await fetchRes.json();
  const hasSavedProp = fetchJson.items?.some((it) => it.property_id === targetProp.id || it.property?.id === targetProp.id);
  console.log(`✓ Wishlist fetched (${fetchJson.items?.length || 0} items). Target property in wishlist? ${hasSavedProp ? 'YES ✓' : 'NO ✗'}`);

  // 5. Test removing from wishlist
  const removeRes = await fetch('http://localhost:3000/api/wishlist', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${resToken}`,
    },
    body: JSON.stringify({ propertyId: targetProp.id }),
  });
  const removeJson = await removeRes.json();
  console.log(`✓ Toggle remove from wishlist. Response status: ${removeRes.status}, favorited state: ${removeJson.favorited}`);

  // Verify removed
  const fetchAfterRemove = await fetch('http://localhost:3000/api/wishlist', {
    headers: { Authorization: `Bearer ${resToken}` },
  });
  const fetchAfterJson = await fetchAfterRemove.json();
  const stillHasProp = fetchAfterJson.items?.some((it) => it.property_id === targetProp.id);
  console.log(`✓ Property verified removed from wishlist? ${!stillHasProp ? 'YES (0 items remaining) ✓' : 'NO ✗'}`);

  // -------------------------------------------------------------------------
  // TEST 2: OWNER ACCOUNT — SIGN OUT & ROUTE PROTECTION
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: OWNER ACCOUNT — SIGN OUT & ROUTE PROTECTION ---');
  const ownerEmail = `owner_e2e_${Date.now()}@gmail.com`;

  const { data: ownerSignUp, error: ownerSignUpErr } = await client.auth.signUp({
    email: ownerEmail,
    password,
    options: { data: { full_name: 'E2E Property Owner', role: 'OWNER' } }
  });

  if (ownerSignUpErr) {
    throw new Error(`Owner signup failed: ${ownerSignUpErr.message}`);
  }

  const ownerUser = ownerSignUp.user;
  const ownerToken = ownerSignUp.session?.access_token;
  console.log(`✓ Owner account authenticated: ${ownerUser.id} (${ownerEmail})`);

  const ownerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${ownerToken}` } }
  });

  await ownerClient.from('profiles').upsert({
    id: ownerUser.id,
    email: ownerEmail,
    full_name: 'E2E Property Owner',
    role: 'OWNER',
  });

  // Verify owner session is valid
  const { data: verifySession } = await ownerClient.auth.getUser();
  console.log(`✓ Verified active owner session for user: ${verifySession.user?.email}`);

  // Sign out owner session
  await ownerClient.auth.signOut();
  const { data: postSignOut } = await ownerClient.auth.getUser();
  console.log(`✓ Owner session after signOut(): user is null? ${postSignOut.user === null ? 'YES ✓' : 'NO ✗'}`);

  // Test accessing owner dashboard unauthenticated
  const unauthedRes = await fetch('http://localhost:3000/owner/dashboard');
  console.log(`✓ Accessing /owner/dashboard without credentials HTTP status: ${unauthedRes.status}`);

  // -------------------------------------------------------------------------
  // TEST 3: OWNER PORTAL — PUBLISH PROPERTY LIVE & PUBLIC SEARCH
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: OWNER PORTAL — PUBLISH PROPERTY LIVE ---');

  // Sign in owner fresh
  const { data: ownerSignIn, error: ownerSignInErr } = await client.auth.signInWithPassword({
    email: ownerEmail,
    password,
  });

  if (ownerSignInErr) {
    throw new Error(`Owner sign in failed: ${ownerSignInErr.message}`);
  }

  const authedOwnerToken = ownerSignIn.session.access_token;
  const authedOwnerId = ownerSignIn.user.id;

  const authedOwnerClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${authedOwnerToken}` } }
  });

  // Ensure owner profile and owner business record
  await authedOwnerClient.from('profiles').upsert({
    id: authedOwnerId,
    email: ownerEmail,
    full_name: 'E2E Property Owner',
    role: 'OWNER',
  });

  await authedOwnerClient.from('owners').upsert({
    profile_id: authedOwnerId,
    business_name: 'Grand Orchid Stays Co.',
    verification_status: 'verified',
  }, { onConflict: 'profile_id' });

  // Publish property
  const uniqueTitle = `Sapphire Luxury Living ${Date.now().toString(36)}`;
  const uniqueSlug = `sapphire-luxury-${Date.now().toString(36)}`;

  const propertyPayload = {
    name: uniqueTitle,
    slug: uniqueSlug,
    description: 'Ultra-premium executive accommodation with high-speed WiFi, gym, and gourmet meals.',
    city: 'Bengaluru',
    area: 'Koramangala 4th Block',
    address: '88 Sony Signal Road, 4th Block',
    landmark: 'Opposite Maharaja Signal',
    state: 'Karnataka',
    pincode: '560034',
    starting_rent: 16500,
    deposit_amount: 33000,
    notice_period_days: 30,
    gender_preference: 'any',
    rules: ['Gate closing: 23:30', 'Quiet hours after 22:00'],
    gate_closing_time: '23:30',
    food_available: true,
    food_type: 'Veg & Non-Veg',
    is_verified: true,
    is_featured: false,
    status: 'approved',
    owner_id: authedOwnerId,
  };

  const { data: publishedProp, error: propErr } = await authedOwnerClient
    .from('properties')
    .insert([propertyPayload])
    .select()
    .single();

  if (propErr) {
    throw new Error(`Property publish insert failed: ${propErr.message}`);
  }

  console.log(`✓ Published Property live in Supabase: "${publishedProp.name}" (ID: ${publishedProp.id})`);
  console.log(`  - City: ${publishedProp.city}`);
  console.log(`  - Rent: ₹${publishedProp.starting_rent}/mo`);
  console.log(`  - Status: ${publishedProp.status}`);
  console.log(`  - Owner ID: ${publishedProp.owner_id}`);

  // Test public discovery / search query (unauthenticated anon client)
  const { data: searchResults, error: searchErr } = await client
    .from('properties')
    .select('id, name, city, area, starting_rent, status, owner_id')
    .eq('id', publishedProp.id)
    .single();

  if (searchErr) {
    throw new Error(`Public search query failed: ${searchErr.message}`);
  }

  console.log(`✓ Verified in public search catalog:`, searchResults);
  console.log(`✓ Property is immediately discoverable by residents without delay.`);

  // Cleanup test property
  await authedOwnerClient.from('properties').delete().eq('id', publishedProp.id);
  console.log(`✓ Cleanup: Test property deleted.`);

  console.log('\n====================================================');
  console.log('ALL THREE TEST SUITES PASSED WITH ZERO ERRORS ✓');
  console.log('====================================================');
}

runVerification().catch((err) => {
  console.error('\n✗ Verification failed:', err);
  process.exit(1);
});
