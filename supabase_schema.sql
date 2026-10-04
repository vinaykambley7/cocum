-- =========================================================================
-- Commonwealth University College of Medicine (CUCOM) - Supabase Schema
-- Run this in your Supabase Project Dashboard -> SQL Editor -> New Query -> Run
-- Project: https://zvzjdmqlrxduapvqoeke.supabase.co
-- =========================================================================

-- 1. Create Reports Table for Daily Submissions
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    staff_id TEXT,
    staff_name TEXT NOT NULL,
    department TEXT NOT NULL,
    designation TEXT,
    date TEXT NOT NULL,
    submission_time TEXT,
    submission_timestamp TEXT,
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
    reviewed_at TEXT,
    is_draft BOOLEAN DEFAULT FALSE,
    updated_at TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Users Table for Candidates & Leadership
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    staff_id TEXT,
    name TEXT NOT NULL,
    username TEXT NOT NULL,
    email TEXT,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    is_manager BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Disable Row Level Security (RLS) or Allow Public Full Access for Simple Operations
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access on reports" ON public.reports;
CREATE POLICY "Public full access on reports" ON public.reports FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access on users" ON public.users;
CREATE POLICY "Public full access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

-- 4. Enable Realtime Replication
ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;

