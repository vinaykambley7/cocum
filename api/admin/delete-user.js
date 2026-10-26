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
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  try {
    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    // 1. Delete from profiles
    try {
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
    } catch (e) {
      console.warn('Error deleting from profiles:', e);
    }

    // 2. Delete from auth.users (if valid UUID)
    try {
      await supabaseAdmin.auth.admin.deleteUser(userId);
    } catch (e) {
      console.warn('Error deleting from auth.users:', e);
    }

    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Serverless delete-user error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while deleting user'
    });
  }
}
