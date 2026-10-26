import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zvzjdmqlrxduapvqoeke.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2empkbXFscnhkdWFwdnFvZWtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTExMDgzNCwiZXhwIjoyMTA2Njg2ODM0fQ.w8IIu1GLZt752RxFBlBFQEYqLyYI_bN9-ubo7FJvd-A';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { name, username, email, password, department, designation, role } = req.body || {};

    const cleanName = (name || '').trim();
    const cleanUsername = (username || '').trim().toLowerCase().replace(/\s+/g, '.');
    const cleanEmail = (email || '').trim().toLowerCase() || `${cleanUsername}@cucom.edu.ag`;
    const cleanPass = (password || '').trim() || 'Cucom@2026';
    const cleanDept = (department || '').trim();
    const cleanRole = (designation || '').trim();
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'STAFF';

    if (!cleanName || !cleanUsername || !cleanDept || !cleanRole) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, username, department, and designation are required.' 
      });
    }

    // 1. Check if user already exists in auth.users
    const { data: userListData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userListData?.users?.find(
      u => u.email?.toLowerCase() === cleanEmail.toLowerCase()
    );

    let authUser = null;

    if (existingUser) {
      const { data: updated, error: updErr } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        {
          password: cleanPass,
          user_metadata: {
            name: cleanName,
            username: cleanUsername,
            department: cleanDept,
            designation: cleanRole,
            role: userRole,
            initial_password: cleanPass
          }
        }
      );
      if (updErr) throw updErr;
      authUser = updated.user;
    } else {
      const { data: created, error: crtErr } = await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPass,
        email_confirm: true,
        user_metadata: {
          name: cleanName,
          username: cleanUsername,
          department: cleanDept,
          designation: cleanRole,
          role: userRole,
          initial_password: cleanPass
        }
      });
      if (crtErr) throw crtErr;
      authUser = created.user;
    }

    if (!authUser) {
      throw new Error('Failed to create or retrieve auth user');
    }

    const staffId = `staff-${authUser.id.substring(0, 6)}`;

    // 2. Upsert into public.profiles
    const profileRow = {
      id: authUser.id,
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      department: cleanDept,
      designation: cleanRole,
      role: userRole,
      staff_id: staffId,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    const { error: profErr } = await supabaseAdmin
      .from('profiles')
      .upsert(profileRow, { onConflict: 'id' });

    if (profErr) {
      console.warn('Profile upsert note:', profErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `User '${cleanName}' created successfully in Supabase Auth!`,
      user: {
        id: authUser.id,
        name: cleanName,
        username: cleanUsername,
        email: cleanEmail,
        password: cleanPass,
        department: cleanDept,
        designation: cleanRole,
        role: userRole,
        staffId,
        isActive: true,
        createdAt: authUser.created_at
      }
    });
  } catch (error) {
    console.error('Serverless create-user error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while creating user'
    });
  }
}
