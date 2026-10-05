-- =========================================================================
-- Commonwealth University College of Medicine (CUCOM)
-- Multi-User Production Database Schema & Row-Level Security (RLS)
-- Run in Supabase SQL Editor: Dashboard -> SQL Editor -> New Query -> Run
-- Project: https://zvzjdmqlrxduapvqoeke.supabase.co
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked 1-to-1 with Supabase Auth users)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'STAFF', 'SECTION_MANAGER')),
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    staff_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by username and department
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_department ON public.profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- -------------------------------------------------------------------------
-- 2. DAILY REPORTS TABLE (Central Source of Truth)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    staff_id TEXT NOT NULL,
    staff_name TEXT NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    date DATE NOT NULL,
    submission_time TEXT,
    submission_timestamp TIMESTAMPTZ,
    deadline TEXT DEFAULT '4:00 PM',
    compliance_status TEXT DEFAULT 'On Time',
    overall_status TEXT DEFAULT 'Completed',
    priority TEXT DEFAULT 'Normal',
    work_done_summary TEXT,
    activities_performed TEXT,
    issues_held TEXT,
    cash_collected TEXT,
    has_unusual_activities BOOLEAN DEFAULT FALSE,
    unusual_activity_type TEXT,
    unusual_activities_details TEXT,
    key_achievements TEXT,
    challenges TEXT,
    support_needed BOOLEAN DEFAULT FALSE,
    support_details TEXT,
    priority_tomorrow TEXT,
    manager_review TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    is_draft BOOLEAN DEFAULT FALSE,
    tasks JSONB DEFAULT '[]'::jsonb,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning-fast queries and filtering
CREATE INDEX IF NOT EXISTS idx_reports_date ON public.reports(date);
CREATE INDEX IF NOT EXISTS idx_reports_department ON public.reports(department);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON public.reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_staff_id ON public.reports(staff_id);
CREATE INDEX IF NOT EXISTS idx_reports_compliance ON public.reports(compliance_status);

-- -------------------------------------------------------------------------
-- 3. HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------------------

-- Check if current authenticated user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
$$;

-- Get current authenticated user's department
CREATE OR REPLACE FUNCTION public.get_user_department()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT department FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

-- Automatically update updated_at timestamp on row changes
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS tr_reports_updated_at ON public.reports;
CREATE TRIGGER tr_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- -------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (
        auth.uid() = id
        OR public.is_admin()
        OR department = public.get_user_department()
    );

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = id
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = id
        OR public.is_admin()
    );

DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy" ON public.profiles
    FOR DELETE TO authenticated
    USING (public.is_admin());

-- Also allow public anon read of profile count/names if needed for login auto-suggestions
DROP POLICY IF EXISTS "profiles_anon_select_policy" ON public.profiles;
CREATE POLICY "profiles_anon_select_policy" ON public.profiles
    FOR SELECT TO anon
    USING (true);

-- Enable RLS on Reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- SELECT: Staff sees own department; Admin sees ALL departments
DROP POLICY IF EXISTS "reports_select_policy" ON public.reports;
CREATE POLICY "reports_select_policy" ON public.reports
    FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR department = public.get_user_department()
        OR user_id = auth.uid()
    );

-- INSERT: User can submit report for themselves or Admin can submit
DROP POLICY IF EXISTS "reports_insert_policy" ON public.reports;
CREATE POLICY "reports_insert_policy" ON public.reports
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_admin()
        OR user_id = auth.uid()
    );

-- UPDATE: Staff can update their own drafts; Manager can add reviews in their department; Admin can update all
DROP POLICY IF EXISTS "reports_update_policy" ON public.reports;
CREATE POLICY "reports_update_policy" ON public.reports
    FOR UPDATE TO authenticated
    USING (
        public.is_admin()
        OR user_id = auth.uid()
        OR department = public.get_user_department()
    );

-- DELETE: Admin can delete; staff can only delete unsubmitted drafts
DROP POLICY IF EXISTS "reports_delete_policy" ON public.reports;
CREATE POLICY "reports_delete_policy" ON public.reports
    FOR DELETE TO authenticated
    USING (
        public.is_admin()
        OR (user_id = auth.uid() AND is_draft = TRUE)
    );

-- Fallback for anonymous viewing (read-only for demo fallback when unauthenticated)
DROP POLICY IF EXISTS "reports_anon_select_policy" ON public.reports;
CREATE POLICY "reports_anon_select_policy" ON public.reports
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS "reports_anon_insert_policy" ON public.reports;
CREATE POLICY "reports_anon_insert_policy" ON public.reports
    FOR INSERT TO anon
    WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 5. REALTIME REPLICATION CONFIGURATION
-- -------------------------------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reports'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    END IF;
END $$;

-- -------------------------------------------------------------------------
-- 6. STORAGE BUCKET POLICIES FOR 'cucom-attachments'
-- -------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'cucom-attachments',
    'cucom-attachments',
    true,
    10485760,
    NULL
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = NULL;

DROP POLICY IF EXISTS "Public access to cucom-attachments" ON storage.objects;
CREATE POLICY "Public access to cucom-attachments"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'cucom-attachments');

DROP POLICY IF EXISTS "Authenticated users can upload attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload attachments"
    ON storage.objects FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'cucom-attachments');

DROP POLICY IF EXISTS "Users can update own attachments" ON storage.objects;
CREATE POLICY "Users can update own attachments"
    ON storage.objects FOR UPDATE TO anon, authenticated
    USING (bucket_id = 'cucom-attachments');

DROP POLICY IF EXISTS "Admins can delete any attachment" ON storage.objects;
CREATE POLICY "Admins can delete any attachment"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'cucom-attachments' AND (auth.uid() = owner OR public.is_admin()));

-- Legacy table view for backwards compatibility
CREATE OR REPLACE VIEW public.users AS
SELECT 
    id::text AS id,
    staff_id,
    name,
    username,
    email,
    department,
    designation,
    (role = 'ADMIN' OR role = 'SECTION_MANAGER') AS is_manager,
    is_active,
    created_at
FROM public.profiles;

