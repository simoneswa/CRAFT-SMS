-- CRAFT SMS - RLS Enforcement Script (Operational Spine)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_my_school_id() 
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'school_id')::UUID;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 3. ENABLE RLS ON ALL TABLES
ALTER TABLE public.event_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_chain ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slips ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES

-- Event Store: Only members of the school can see their events
DROP POLICY IF EXISTS "Tenant event isolation" ON public.event_store;
CREATE POLICY "Tenant event isolation" ON public.event_store
    FOR SELECT USING (tenant_id = public.get_my_school_id());

-- Audit Chain: Only members of the school can see their audit trail
DROP POLICY IF EXISTS "Tenant audit isolation" ON public.audit_chain;
CREATE POLICY "Tenant audit isolation" ON public.audit_chain
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.event_store 
        WHERE id = audit_chain.event_id AND tenant_id = public.get_my_school_id()
    ));

-- Projections: standard school_id isolation
DROP POLICY IF EXISTS "Tenant school isolation" ON public.schools;
CREATE POLICY "Tenant school isolation" ON public.schools
    FOR SELECT USING (id = public.get_my_school_id());

DROP POLICY IF EXISTS "Tenant profile isolation" ON public.profiles;
CREATE POLICY "Tenant profile isolation" ON public.profiles
    FOR SELECT USING (school_id = public.get_my_school_id());

DROP POLICY IF EXISTS "Tenant slip isolation" ON public.slips;
CREATE POLICY "Tenant slip isolation" ON public.slips
    FOR SELECT USING (school_id = public.get_my_school_id());

-- 5. WRITE PROTECTION (Non-Negotiable)
-- Projections should NEVER be written to directly by the API.
-- However, for the Projection Engine (which runs with Service Key), it needs access.
-- The following policies ensure that normal users cannot write.

CREATE POLICY "No direct writes to schools" ON public.schools FOR ALL 
    USING (false) WITH CHECK (false);

CREATE POLICY "No direct writes to profiles" ON public.profiles FOR ALL 
    USING (false) WITH CHECK (false);

CREATE POLICY "No direct writes to slips" ON public.slips FOR ALL 
    USING (false) WITH CHECK (false);
