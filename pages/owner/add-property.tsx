import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Navbar } from '../../components/Navbar';
import { Footer } from '../../components/Footer';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../lib/authContext';
import { supabase, isSupabaseConfigured, uploadPropertyImage } from '../../lib/supabaseClient';

export default function AddPropertyWizardPage() {
  const router = useRouter();
  const { user, session, isOwner } = useAuth();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);

  // Form State - Step 1: Basics & Location
  const [title, setTitle] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [area, setArea] = useState('Koramangala 5th Block');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('560034');
  const [genderPreference, setGenderPreference] = useState<'male' | 'female' | 'any'>('any');

  // Step 2: Room & Tariffs
  const [roomType, setRoomType] = useState<'single' | 'double' | 'triple'>('double');
  const [pricePerMonth, setPricePerMonth] = useState<number>(14500);
  const [availableRooms, setAvailableRooms] = useState<number>(12);
  const [depositMonths, setDepositMonths] = useState<number>(2);

  // Step 3: Food & Mess
  const [foodIncluded, setFoodIncluded] = useState<boolean>(true);
  const [foodTypes, setFoodTypes] = useState<string[]>([
    'Breakfast',
    'Lunch',
    'Dinner',
    'North & South Indian',
  ]);

  // Step 4: Amenities
  const [amenities, setAmenities] = useState<string[]>([
    'WiFi',
    'AC',
    'Gym',
    'Security',
    'Power Backup',
    'Washing Machine',
  ]);

  // Step 5: Policies
  const [gateTimings, setGateTimings] = useState<string>('24/7 Biometric Turnstiles');
  const [noticePeriod, setNoticePeriod] = useState<number>(30);
  const [description, setDescription] = useState<string>(
    'Modern executive co-living facility located in prime tech corridor. Fully furnished with high-speed dual fiber Wi-Fi, biometric security, chef-prepared meals, and daily housekeeping.'
  );

  // Step 6: Images
  const [images, setImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1555854877-bab0e662b468?w=800',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  ]);
  const [newImageUrl, setNewImageUrl] = useState<string>('');

  const toggleAmenity = (item: string) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter((a) => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const publicUrl = await uploadPropertyImage(file);
    if (publicUrl) {
      setImages([...images, publicUrl]);
    }
    setUploadingImage(false);
  };

  const handleAddImageUrl = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleFinalPublish = async () => {
    if (!user) {
      alert('Please sign in as a PG Owner to publish listings.');
      router.replace('/auth/signin?role=owner');
      return;
    }

    if (!isOwner) {
      alert('Unauthorized: Only registered PG Owners can publish property listings.');
      router.replace('/resident/dashboard');
      return;
    }

    if (!title.trim()) {
      alert('Please specify a Property Title in Step 1.');
      setCurrentStep(1);
      return;
    }

    if (!address.trim()) {
      alert('Please provide a Street Address in Step 1.');
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);

    const publishPayload = {
      title: title.trim(),
      description: description.trim(),
      city: city.trim(),
      area: area.trim() || city.trim(),
      address: address.trim(),
      landmark: landmark.trim() || area.trim(),
      state: state.trim() || 'Karnataka',
      pincode: pincode.trim() || '560034',
      genderPreference,
      roomType,
      pricePerMonth: Number(pricePerMonth) || 12000,
      availableRooms: Number(availableRooms) || 4,
      depositMonths: Number(depositMonths) || 2,
      foodIncluded,
      foodTypes,
      amenities,
      gateTimings,
      images,
    };

    // 1. Try server-side publishing endpoint first (handles RLS & multi-table transaction atomically)
    try {
      const token = session?.access_token;
      const apiRes = await fetch('/api/properties/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(publishPayload),
      });

      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.success && apiData.property) {
          alert('Property listing published successfully! Your property is live in the public catalog.');
          router.replace('/owner/dashboard');
          return;
        }
      } else {
        const errData = await apiRes.json().catch(() => ({}));
        if (!errData.fallbackToClient) {
          throw new Error(errData.error || 'Server publishing failed');
        }
      }
    } catch (apiErr: any) {
      console.warn('Server publish route notice, proceeding to client SDK:', apiErr.message);
    }

    // 2. Direct client SDK fallback
    if (isSupabaseConfigured) {
      try {
        const propSlug = (title || 'orchid')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .substring(0, 40) + '-' + Date.now().toString(36);

        const startingRent = Number(pricePerMonth) || 12000;
        const depositAmount = startingRent * (Number(depositMonths) || 2);
        const totalBedsCount = Number(availableRooms) || 4;

        const propertyPayload = {
          name: title.trim(),
          slug: propSlug,
          description: description?.trim() || 'Modern executive co-living facility located in prime tech corridor with premium amenities and chef-prepared meals.',
          city: city.trim(),
          area: area.trim() || city.trim(),
          address: address.trim(),
          landmark: landmark.trim() || area.trim(),
          state: state.trim() || 'Karnataka',
          pincode: pincode.trim() || '560034',
          starting_rent: startingRent,
          deposit_amount: depositAmount,
          notice_period_days: noticePeriod || 30,
          gender_preference: genderPreference,
          rules: gateTimings ? [`Gate closing timing: ${gateTimings}`] : [],
          gate_closing_time: gateTimings || '22:30',
          food_available: foodIncluded,
          food_type: foodTypes.length > 0 ? foodTypes.join(', ') : 'Veg & Non-Veg',
          is_verified: true,
          is_featured: false,
          status: 'approved',
          owner_id: user.id,
        };

        // 0. Ensure profile and owner records exist to satisfy properties foreign key constraints
        try {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'PG Owner',
            role: 'OWNER',
          }, { onConflict: 'id' });
        } catch (profErr) {
          console.warn('Profile upsert note:', profErr);
        }

        try {
          await supabase.from('owners').upsert({
            profile_id: user.id,
            business_name: title || 'PG Host Operator',
            verification_status: 'verified',
          }, { onConflict: 'profile_id' });
        } catch (oErr) {
          console.warn('Owner upsert note:', oErr);
        }

        // 1. Insert into properties
        const { data: prop, error: propError } = await supabase
          .from('properties')
          .insert([propertyPayload])
          .select()
          .single();

        if (propError) {
          alert(`Failed to publish property: ${propError.message}`);
          setSubmitting(false);
          return;
        }

        // 2. Insert primary room into rooms
        try {
          const { data: room, error: roomErr } = await supabase
            .from('rooms')
            .insert([{
              property_id: prop.id,
              name: `${roomType.toUpperCase()} Room`,
              room_type: roomType,
              rent_per_month: startingRent,
              deposit_amount: depositAmount,
              total_beds: totalBedsCount,
              ac_available: amenities.some((a) => a.toLowerCase().includes('ac') || a.toLowerCase().includes('air')),
              attached_bathroom: true,
              balcony: false,
            }])
            .select()
            .single();

          if (roomErr) {
            console.warn('Room insertion note:', roomErr.message);
          }

          // 3. Insert beds for the room
          if (room) {
            const bedRows = Array.from({ length: Math.min(totalBedsCount, 12) }).map((_, i) => ({
              room_id: room.id,
              bed_name: `Bed ${String.fromCharCode(65 + i)}`,
              status: 'available',
            }));
            await supabase.from('beds').insert(bedRows);
          }
        } catch (roomErr) {
          console.warn('Room insertion note:', roomErr);
        }

        // 4. Insert images into property_images
        if (images && images.length > 0) {
          try {
            const imageRows = images.map((url, idx) => ({
              property_id: prop.id,
              url,
              is_cover: idx === 0,
              display_order: idx,
              caption: title,
            }));
            await supabase.from('property_images').insert(imageRows);
          } catch (imgErr) {
            console.warn('Property images note:', imgErr);
          }
        }

        // 5. Link Amenities into property_amenities
        if (amenities && amenities.length > 0) {
          try {
            for (const amenName of amenities) {
              let { data: existingAmen } = await supabase
                .from('amenities')
                .select('id')
                .ilike('name', amenName)
                .maybeSingle();

              if (!existingAmen) {
                const { data: newAmen } = await supabase
                  .from('amenities')
                  .insert([{ name: amenName, category: 'General' }])
                  .select('id')
                  .maybeSingle();
                existingAmen = newAmen;
              }

              if (existingAmen?.id) {
                await supabase.from('property_amenities').insert([{
                  property_id: prop.id,
                  amenity_id: existingAmen.id,
                }]);
              }
            }
          } catch (amenErr) {
            console.warn('Property amenities linking note:', amenErr);
          }
        }

        alert('Property listing published successfully! Your property is live in the public catalog.');
        router.replace('/owner/dashboard');
      } catch (err: any) {
        alert(err.message || 'Error publishing property');
        setSubmitting(false);
      }
    } else {
      setTimeout(() => {
        alert('Demo Mode: Property configuration saved successfully!');
        router.push('/owner/dashboard');
      }, 700);
    }
  };

  const steps = [
    { num: 1, label: 'Basics & Location' },
    { num: 2, label: 'Rooms & Tariffs' },
    { num: 3, label: 'Food & Mess' },
    { num: 4, label: 'Amenities' },
    { num: 5, label: 'Policies' },
    { num: 6, label: 'Review & Publish' },
  ];

  return (
    <ProtectedRoute requiredRole="OWNER">
      <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased">
        <Head>
          <title>Add New Property Listing Wizard | PG Connect</title>
        </Head>

        <Navbar activeTab="add-property" />

      <main className="w-full pt-20 flex-1">
        {/* SUBHEADER: WIZARD TITLE & BREADCRUMB */}
        <section className="bg-white border-b border-outline-variant/30 py-4 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href="/owner/dashboard"
                  className="text-xs text-on-surface-variant hover:text-primary font-semibold flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  <span>Owner Hub</span>
                </Link>
                <span className="text-outline-variant">•</span>
                <span className="text-xs font-bold text-secondary">New Listing Registration</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md mt-0.5">
                Add Property Listing Wizard
              </h1>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-on-surface-variant">Step {currentStep} of 6</span>
              <div className="w-24 bg-surface-container-high h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{ width: `${(currentStep / 6) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* 6-STEP PROGRESS STEPPER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/30 mb-8 overflow-x-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 min-w-[620px]">
              {steps.map((step) => {
                const isCompleted = step.num < currentStep;
                const isActive = step.num === currentStep;

                return (
                  <button
                    key={step.num}
                    type="button"
                    onClick={() => setCurrentStep(step.num)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                      isActive
                        ? 'bg-primary-fixed/50 border border-primary'
                        : isCompleted
                        ? 'bg-surface-container-low hover:bg-surface-container'
                        : 'opacity-50'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isActive
                          ? 'bg-primary text-white shadow-xs'
                          : isCompleted
                          ? 'bg-secondary text-white'
                          : 'bg-surface-container-highest text-on-surface-variant'
                      }`}
                    >
                      {isCompleted ? (
                        <span className="material-symbols-outlined text-sm">check</span>
                      ) : (
                        step.num
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block truncate">
                        Step 0{step.num}
                      </span>
                      <span
                        className={`text-xs font-bold block truncate ${
                          isActive ? 'text-primary' : 'text-on-surface'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN WIZARD BODY (Step Content) */}
          <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-10 shadow-lg border border-outline-variant/30 space-y-6">
            {/* STEP 1: Basic Info & Location */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Step 01 • Property Master Identity
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md mt-1">
                    Basic Information &amp; Location
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Provide the verified property name, target city, and nearby tech park or landmark.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Property Name / Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. The Grand Orchid Executive Co-Living"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">City</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Bangalore">Bengaluru (Bangalore)</option>
                        <option value="Hyderabad">Hyderabad</option>
                        <option value="Pune">Pune</option>
                        <option value="Delhi">Delhi NCR</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Chennai">Chennai</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Locality / Area
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Koramangala 5th Block"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">Full Street Address</label>
                    <input
                      type="text"
                      placeholder="Plot No 42, 17th Cross Road, Near Sony Signal..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">State</label>
                      <input
                        type="text"
                        placeholder="e.g. Karnataka"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">Pincode</label>
                      <input
                        type="text"
                        placeholder="e.g. 560034"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Proximity Landmark (Distance tag)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 300m from Jyoti Nivas College"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Gender Preference
                      </label>
                      <select
                        value={genderPreference}
                        onChange={(e) => setGenderPreference(e.target.value as any)}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="any">Unisex / Co-Living (Boys &amp; Girls)</option>
                        <option value="male">Boys Only PG</option>
                        <option value="female">Girls Only PG</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Rooms & Tariffs */}
            {currentStep === 2 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Step 02 • Inventory &amp; Pricing Setup
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md mt-1">
                    Room Sharing Configurations &amp; Tariffs
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Set up bed counts, starting monthly rent per tenant, and deposit rules.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'single', name: 'Single Private Room', beds: '1 Bed' },
                      { id: 'double', name: 'Twin Sharing Room', beds: '2 Beds' },
                      { id: 'triple', name: 'Triple Sharing Room', beds: '3 Beds' },
                    ].map((rt) => (
                      <div
                        key={rt.id}
                        onClick={() => setRoomType(rt.id as any)}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          roomType === rt.id
                            ? 'bg-primary-fixed/40 border-primary ring-2 ring-primary shadow-xs'
                            : 'bg-surface-container-low border-outline-variant/30 hover:bg-surface-container'
                        }`}
                      >
                        <span className="text-xs font-bold text-on-surface block">{rt.name}</span>
                        <span className="text-[11px] text-on-surface-variant">{rt.beds}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Monthly Rent per Bed (₹)
                      </label>
                      <input
                        type="number"
                        value={pricePerMonth}
                        onChange={(e) => setPricePerMonth(Number(e.target.value))}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary font-bold text-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Total Rooms Available
                      </label>
                      <input
                        type="number"
                        value={availableRooms}
                        onChange={(e) => setAvailableRooms(Number(e.target.value))}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Security Deposit (Months)
                      </label>
                      <select
                        value={depositMonths}
                        onChange={(e) => setDepositMonths(Number(e.target.value))}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value={1}>1 Month Deposit</option>
                        <option value={2}>2 Months Deposit (Recommended)</option>
                        <option value={3}>3 Months Deposit</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Food & Mess */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Step 03 • Dining Experience
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md mt-1">
                    Food &amp; Mess Offerings
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Indicate meal inclusions and kitchen hygiene certification standards.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={foodIncluded}
                      onChange={(e) => setFoodIncluded(e.target.checked)}
                      className="w-5 h-5 rounded accent-secondary cursor-pointer"
                    />
                    <div>
                      <span className="font-bold text-sm text-on-surface block">
                        3 Fresh Meals Included in Rent
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Breakfast, Lunch &amp; Dinner prepared in in-house commercial kitchen.
                      </span>
                    </div>
                  </label>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      'North Indian Menu',
                      'South Indian Menu',
                      'Egg Option',
                      'Non-Veg (Wed/Sun)',
                      'Evening High Tea',
                      'Self-Cooking Induction Allowed',
                    ].map((item) => (
                      <div
                        key={item}
                        onClick={() => {
                          if (foodTypes.includes(item)) {
                            setFoodTypes(foodTypes.filter((f) => f !== item));
                          } else {
                            setFoodTypes([...foodTypes, item]);
                          }
                        }}
                        className={`p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                          foodTypes.includes(item)
                            ? 'bg-secondary-container/40 border-secondary text-secondary font-bold'
                            : 'bg-surface-container-low border-outline-variant/30 text-on-surface'
                        }`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Amenities */}
            {currentStep === 4 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Step 04 • Infrastructure
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md mt-1">
                    Amenities &amp; Common Areas
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Select all verified facilities active at your premises.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'WiFi', label: '300 Mbps Fiber Wi-Fi' },
                    { id: 'AC', label: 'Split Air Conditioner (AC)' },
                    { id: 'Power Backup', label: '100% DG Power Backup' },
                    { id: 'Security', label: 'Biometric & CCTV Security' },
                    { id: 'Gym', label: 'Fitness Gym & Yoga Room' },
                    { id: 'Washing Machine', label: 'Commercial Washers' },
                    { id: 'Housekeeping', label: 'Daily Room Cleaning' },
                    { id: 'Parking', label: 'Covered 2-Wheeler Parking' },
                    { id: 'Study Room', label: 'Silent Study Lounge' },
                  ].map((amenity) => (
                    <label
                      key={amenity.id}
                      className={`flex items-center gap-2.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        amenities.includes(amenity.id)
                          ? 'bg-primary-fixed/40 border-primary text-primary font-bold'
                          : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:bg-surface-container'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={amenities.includes(amenity.id)}
                        onChange={() => toggleAmenity(amenity.id)}
                        className="w-4 h-4 rounded accent-primary cursor-pointer"
                      />
                      <span className="text-xs">{amenity.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: House Policies */}
            {currentStep === 5 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Step 05 • Rules &amp; Living Guidelines
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md mt-1">
                    Policies &amp; Property Narrative
                  </h2>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Gate Closing Policy
                      </label>
                      <input
                        type="text"
                        value={gateTimings}
                        onChange={(e) => setGateTimings(e.target.value)}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-on-surface mb-1">
                        Notice Period (Days)
                      </label>
                      <input
                        type="number"
                        value={noticePeriod}
                        onChange={(e) => setNoticePeriod(Number(e.target.value))}
                        className="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-on-surface mb-1">
                      Detailed Property Narrative
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full p-3.5 rounded-xl bg-surface-container-low text-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Photos & Final Review */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Step 06 • Final Dossier
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-on-surface font-headline-md mt-1">
                    Photo Gallery &amp; Launch Review
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Upload photos of bedroom, facade, and dining area, then review summary.
                  </p>
                </div>

                {/* Photo Gallery Grid */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-on-surface">Property Photos</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-outline-variant/30 group">
                        <img src={img} alt="Property" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                    ))}

                    {/* Upload File Box */}
                    <label className="aspect-video rounded-xl border-2 border-dashed border-outline-variant hover:border-primary flex flex-col items-center justify-center cursor-pointer bg-surface-container-low transition-colors">
                      <span className="material-symbols-outlined text-2xl text-on-surface-variant">
                        cloud_upload
                      </span>
                      <span className="text-[11px] font-bold text-primary mt-1">
                        {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Add URL input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="url"
                      placeholder="Or paste high-resolution image URL..."
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      className="flex-1 h-10 px-3.5 rounded-xl bg-surface-container-low text-xs border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={handleAddImageUrl}
                      className="px-4 py-2 bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold rounded-xl"
                    >
                      Add URL
                    </button>
                  </div>
                </div>

                {/* Summary Dossier Box */}
                <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/30 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                        Listing Preview
                      </span>
                      <h3 className="font-bold text-lg text-on-surface">
                        {title || 'The Grand Orchid Co-Living'}
                      </h3>
                      <p className="text-xs text-on-surface-variant">{area}, {city}</p>
                    </div>
                    <span className="text-xl font-extrabold text-primary tabular-nums">
                      ₹{pricePerMonth.toLocaleString('en-IN')}/mo
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-outline-variant/20">
                    <div>
                      <span className="text-on-surface-variant text-[11px] block">Sharing:</span>
                      <span className="font-semibold text-on-surface capitalize">{roomType}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-[11px] block">Available:</span>
                      <span className="font-semibold text-on-surface">{availableRooms} Rooms</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-[11px] block">Food:</span>
                      <span className="font-semibold text-secondary">{foodIncluded ? '3 Meals Included' : 'No Food'}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant text-[11px] block">Security:</span>
                      <span className="font-semibold text-on-surface">{depositMonths} Mo. Escrow</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stepper Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-surface-container-low">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-5 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  <span>Previous Step</span>
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-container text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                >
                  <span>Continue to Step 0{currentStep + 1}</span>
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinalPublish}
                  disabled={submitting}
                  className="px-7 py-3.5 rounded-xl bg-secondary hover:bg-[#005a52] text-white font-bold text-sm shadow-md flex items-center gap-2 transition-all hover:scale-[1.02]"
                >
                  {submitting ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">rocket_launch</span>
                      <span>Publish Property Live</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </ProtectedRoute>
  );
}
