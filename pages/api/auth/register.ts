import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // If service role key is not configured, signal client to fallback to client-side signUp
  if (!serviceRoleKey || !supabaseUrl || serviceRoleKey.includes('your_supabase')) {
    return res.status(200).json({ fallbackToClient: true });
  }

  const { email, password, fullName, phone, isOwner } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const userRole = isOwner ? 'OWNER' : 'USER';

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Create user directly with auto-confirmed email (bypasses Supabase SMTP rate limit completely)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone: phone || null,
        role: userRole,
      },
    });

    if (createError) {
      if (createError.message?.toLowerCase().includes('already registered')) {
        return res.status(400).json({
          error: 'An account with this email address already exists. Please sign in instead.',
        });
      }
      return res.status(400).json({ error: createError.message });
    }

    const userId = userData.user.id;

    // 2. Upsert profile row (admin client bypasses RLS)
    const { error: profileErr } = await supabaseAdmin.from('profiles').upsert({
      id: userId,
      email: cleanEmail,
      full_name: fullName || cleanEmail.split('@')[0],
      phone: phone || null,
      role: userRole,
    });

    if (profileErr) {
      console.warn('Admin profile upsert warning:', profileErr.message);
    }

    // 3. If owner, insert owner record
    if (isOwner) {
      const { error: ownerErr } = await supabaseAdmin.from('owners').upsert({
        profile_id: userId,
        business_name: fullName || 'PG Host Operator',
        verification_status: 'pending',
      }, { onConflict: 'profile_id' });

      if (ownerErr) {
        console.warn('Admin owner upsert warning:', ownerErr.message);
      }
    }

    return res.status(200).json({ success: true, user: userData.user });
  } catch (err: any) {
    console.error('Server registration error:', err);
    return res.status(500).json({ error: err.message || 'Internal registration error' });
  }
}
