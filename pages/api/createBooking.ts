import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

interface BookingRequest {
  pg_id: string;
  user_id: string;
  check_in_date: string;
  check_out_date?: string;
  total_amount: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pg_id, user_id, check_in_date, check_out_date, total_amount }: BookingRequest = req.body;

    // Validate required fields
    if (!pg_id || !user_id || !check_in_date || !total_amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: pg_id, user_id, check_in_date, total_amount' 
      });
    }

    // Verify PG exists and has available rooms
    const { data: pgData, error: pgError } = await supabaseAdmin
      .from('pgs')
      .select('id, title, available_rooms, owner_id')
      .eq('id', pg_id)
      .single();

    if (pgError) {
      console.error('PG lookup error:', pgError);
      return res.status(404).json({ error: 'PG not found' });
    }

    if (pgData.available_rooms <= 0) {
      return res.status(400).json({ error: 'No rooms available in this PG' });
    }

    // Verify user exists
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', user_id)
      .single();

    if (userError) {
      console.error('User lookup error:', userError);
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has a pending/confirmed booking for this PG
    const { data: existingBooking, error: bookingCheckError } = await supabaseAdmin
      .from('bookings')
      .select('id, status')
      .eq('pg_id', pg_id)
      .eq('user_id', user_id)
      .in('status', ['pending', 'confirmed'])
      .maybeSingle();

    if (bookingCheckError) {
      console.error('Booking check error:', bookingCheckError);
      return res.status(500).json({ error: 'Error checking existing bookings' });
    }

    if (existingBooking) {
      return res.status(400).json({ 
        error: `You already have a ${existingBooking.status} booking for this PG` 
      });
    }

    // Create the booking using admin client for security
    const { data: booking, error: createError } = await supabaseAdmin
      .from('bookings')
      .insert({
        pg_id,
        user_id,
        check_in_date,
        check_out_date,
        total_amount,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        *,
        pg:pgs(id, title, owner_id),
        user:profiles(id, full_name, email)
      `)
      .single();

    if (createError) {
      console.error('Booking creation error:', createError);
      return res.status(500).json({ error: 'Failed to create booking' });
    }

    // Optionally, send notification to PG owner
    // This could be implemented later with email/SMS service

    // Return success response
    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking.id,
        pg_id: booking.pg_id,
        user_id: booking.user_id,
        status: booking.status,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        total_amount: booking.total_amount,
        created_at: booking.created_at,
        pg: booking.pg,
        user: booking.user
      }
    });

  } catch (error) {
    console.error('Booking API error:', error);
    res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  }
}
