import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zvzjdmqlrxduapvqoeke.supabase.co';
export const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2empkbXFscnhkdWFwdnFvZWtlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTExMDgzNCwiZXhwIjoyMTA2Njg2ODM0fQ.w8IIu1GLZt752RxFBlBFQEYqLyYI_bN9-ubo7FJvd-A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});
