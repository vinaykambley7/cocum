import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://zvzjdmqlrxduapvqoeke.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2empkbXFscnhkdWFwdnFvZWtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTExMDgzNCwiZXhwIjoyMTA2Njg2ODM0fQ.w8IIu1GLZt752RxFBlBFQEYqLyYI_bN9-ubo7FJvd-A';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { userId, updates } = req.body || {};
    if (!userId || !updates) {
      return res.status(400).json({ success: false, message: 'userId and updates are required' });
    }

    // 1. If password is being updated, update auth.users
    if (updates.password && updates.password.trim()) {
      try {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: updates.password.trim(),
          user_metadata: {
            initial_password: updates.password.trim()
          }
        });
      } catch (e) {
        console.warn('Error updating password in auth.users:', e);
      }
    }

    // 2. Update profile fields
    const profileUpdates = {
      updated_at: new Date().toISOString()
    };
    if (updates.name) profileUpdates.name = updates.name.trim();
    if (updates.department) profileUpdates.department = updates.department.trim();
    if (updates.designation) profileUpdates.designation = updates.designation.trim();
    if (updates.email) profileUpdates.email = updates.email.trim().toLowerCase();
    if (updates.role) profileUpdates.role = updates.role;
    if (typeof updates.isActive === 'boolean') profileUpdates.is_active = updates.isActive;

    const { error: profErr } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId);

    if (profErr) {
      console.warn('Profile update note:', profErr.message);
    }

    return res.status(200).json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Serverless update-user error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while updating user'
    });
  }
}
