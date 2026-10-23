-- ImpactMap AI: Supabase Database Schema
-- All tables prefixed with 'impact_map_' to avoid collision in shared Supabase projects.

-- 1. Cache Table: Stores finished simulation summaries and columnar segments
CREATE TABLE IF NOT EXISTS public.impact_map_cache (
    cache_key VARCHAR(32) PRIMARY KEY,
    versions JSONB NOT NULL,
    hazard VARCHAR(32) NOT NULL DEFAULT 'flood',
    evidence_level VARCHAR(32) NOT NULL DEFAULT 'validated',
    scenario JSONB NOT NULL,
    base_cache_key VARCHAR(32),
    region_totals JSONB NOT NULL,
    ranking JSONB NOT NULL,
    top_communities JSONB NOT NULL,
    assumptions JSONB NOT NULL,
    segments JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Index for quick cache lookups
CREATE INDEX IF NOT EXISTS idx_impact_map_cache_created_at ON public.impact_map_cache(created_at DESC);

-- 2. Jobs Table: Tracks async simulation requests
CREATE TABLE IF NOT EXISTS public.impact_map_jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(20) NOT NULL CHECK (status IN ('queued', 'running', 'done', 'failed')),
    cache_key VARCHAR(32) NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    result_url TEXT,
    error JSONB,
    scenario_payload JSONB NOT NULL,
    expires_at TIMESTAMPTZ DEFAULT (timezone('utc', now()) + INTERVAL '24 hours')
);

-- Index for polling by job_id and status lookups
CREATE INDEX IF NOT EXISTS idx_impact_map_jobs_status ON public.impact_map_jobs(status);
CREATE INDEX IF NOT EXISTS idx_impact_map_jobs_cache_key ON public.impact_map_jobs(cache_key);

-- 3. Users Table (for optional P1 accounts/alerts)
CREATE TABLE IF NOT EXISTS public.impact_map_users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role VARCHAR(50) DEFAULT 'viewer',
    alert_preferences JSONB DEFAULT '{"telegram": false, "email": false}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.impact_map_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_map_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impact_map_users ENABLE ROW LEVEL SECURITY;

-- Allow Public/Anon Access for read and write (Hackathon Decision Support Tool)
CREATE POLICY "Allow public read access to impact_map_cache" 
    ON public.impact_map_cache FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update to impact_map_cache" 
    ON public.impact_map_cache FOR ALL USING (true);

CREATE POLICY "Allow public read access to impact_map_jobs" 
    ON public.impact_map_jobs FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update to impact_map_jobs" 
    ON public.impact_map_jobs FOR ALL USING (true);

CREATE POLICY "Allow public read access to impact_map_users" 
    ON public.impact_map_users FOR SELECT USING (true);
