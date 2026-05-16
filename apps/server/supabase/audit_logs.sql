-- Institutional-Grade Audit & Sync Telemetry

-- 1. Audit Chain (Append-only forensic history)
CREATE TABLE IF NOT EXISTS public.audit_chain (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    actor_id UUID REFERENCES public.profiles(id),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL, -- CREATE, UPDATE, DELETE, FINALIZE
    previous_state JSONB,
    new_state JSONB,
    metadata JSONB DEFAULT '{}'::jsonb, -- Includes Device ID, IP, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Failed Mutations (Disaster Recovery Queue)
CREATE TABLE IF NOT EXISTS public.failed_mutations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    device_id TEXT NOT NULL,
    mutation_id TEXT NOT NULL,
    payload JSONB NOT NULL,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'FAILED', -- FAILED, REPLAYED, ABANDONED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 3. Sync Analytics
CREATE TABLE IF NOT EXISTS public.sync_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    device_id TEXT NOT NULL,
    duration_ms INTEGER,
    mutation_count INTEGER,
    status TEXT, -- SUCCESS, PARTIAL_FAILURE
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES
ALTER TABLE public.audit_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.failed_mutations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_analytics ENABLE ROW LEVEL SECURITY;

-- Only School Admins can view audit logs for their school
CREATE POLICY "School Admins view audit chain" ON public.audit_chain
    FOR SELECT USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'SCHOOL_ADMIN');

CREATE POLICY "School Admins view failed mutations" ON public.failed_mutations
    FOR SELECT USING (school_id = public.get_my_school_id() AND public.get_my_role() = 'SCHOOL_ADMIN');
