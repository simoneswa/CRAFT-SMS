-- CRAFT SMS - Row-Level Security (RLS) Policies for Multi-Tenant Tables
-- These policies enforce tenant isolation at the database level
-- Date: 2026-05-31

-- ============================================================================
-- LESSON PLANS - RLS Policies
-- ============================================================================
-- Ensures only users from the same school can access lesson plans

-- Drop existing policies if present
DROP POLICY IF EXISTS "Users can see lesson plans from their school" ON public.lesson_plans CASCADE;
DROP POLICY IF EXISTS "Super Admins can see all lesson plans" ON public.lesson_plans CASCADE;
DROP POLICY IF EXISTS "Teachers can create lesson plans in their school" ON public.lesson_plans CASCADE;

-- Enable RLS on lesson_plans if not already enabled
ALTER TABLE public.lesson_plans ENABLE ROW LEVEL SECURITY;

-- SELECT: Users see lesson plans from their own school
CREATE POLICY "Users can see lesson plans from their school" ON public.lesson_plans
  FOR SELECT
  USING (
    tenant_id = (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    )
    OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
  );

-- INSERT: Only TEACHER and SCHOOL_ADMIN can create lesson plans for their school
CREATE POLICY "Teachers can create lesson plans in their school" ON public.lesson_plans
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('TEACHER', 'SCHOOL_ADMIN')
    AND
    tenant_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

-- UPDATE: Only teachers and admins can update their school's lesson plans
CREATE POLICY "Teachers can update lesson plans in their school" ON public.lesson_plans
  FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('TEACHER', 'SCHOOL_ADMIN')
    AND
    tenant_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
  );

-- DELETE: Only school admins can delete lesson plans
CREATE POLICY "Admins can delete lesson plans in their school" ON public.lesson_plans
  FOR DELETE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('SCHOOL_ADMIN', 'SUPER_ADMIN')
    AND
    (
      tenant_id = (SELECT school_id FROM public.profiles WHERE id = auth.uid())
      OR
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
    )
  );


-- ============================================================================
-- LESSON PLAN COMMENTS - RLS Policies
-- ============================================================================
-- Ensures comments are only visible to users from the same school

-- Drop existing policies if present
DROP POLICY IF EXISTS "Users can see comments for lesson plans in their school" ON public.lesson_plan_comments CASCADE;
DROP POLICY IF EXISTS "Authorized users can comment on plans in their school" ON public.lesson_plan_comments CASCADE;

-- Enable RLS on lesson_plan_comments if not already enabled
ALTER TABLE public.lesson_plan_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: Users see comments only for lesson plans in their school
CREATE POLICY "Users can see comments for lesson plans in their school" ON public.lesson_plan_comments
  FOR SELECT
  USING (
    (
      SELECT tenant_id FROM public.lesson_plans WHERE id = lesson_plan_id
    ) = (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    )
    OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
  );

-- INSERT: Users can comment on lesson plans in their school
CREATE POLICY "Authorized users can comment on plans in their school" ON public.lesson_plan_comments
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('TEACHER', 'SCHOOL_ADMIN', 'VPI')
    AND
    (
      SELECT tenant_id FROM public.lesson_plans WHERE id = lesson_plan_id
    ) = (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    )
  );


-- ============================================================================
-- PARENT-STUDENT LINKS - RLS Policies
-- ============================================================================
-- Ensures parent-student relationships are scoped by school and verified

-- Drop existing policies if present
DROP POLICY IF EXISTS "Parents can see their linked students" ON public.parent_student_links CASCADE;
DROP POLICY IF EXISTS "Admins can manage parent-student links in their school" ON public.parent_student_links CASCADE;

-- Enable RLS on parent_student_links if not already enabled
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

-- SELECT: Parents see only their own links; admins see school's links
CREATE POLICY "Parents can see their linked students" ON public.parent_student_links
  FOR SELECT
  USING (
    parent_id = auth.uid()
    OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('SCHOOL_ADMIN', 'SUPER_ADMIN')
    AND
    (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    ) = (
      SELECT school_id FROM public.profiles WHERE id = student_id
    )
  );

-- INSERT: Admins can create parent-student links for their school
CREATE POLICY "Admins can manage parent-student links in their school" ON public.parent_student_links
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('SCHOOL_ADMIN', 'SUPER_ADMIN')
    AND
    (
      SELECT school_id FROM public.profiles WHERE id = parent_id
    ) = (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    )
  );


-- ============================================================================
-- MESSAGES - RLS Policies
-- ============================================================================
-- Ensures messages are scoped by school

-- Drop existing policies if present
DROP POLICY IF EXISTS "Users can see messages in their school" ON public.messages CASCADE;
DROP POLICY IF EXISTS "Users can send messages in their school" ON public.messages CASCADE;

-- Enable RLS on messages if not already enabled
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- SELECT: Users see messages from their school
CREATE POLICY "Users can see messages in their school" ON public.messages
  FOR SELECT
  USING (
    school_id = (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    )
    OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
  );

-- INSERT: Users can send messages within their school
CREATE POLICY "Users can send messages in their school" ON public.messages
  FOR INSERT
  WITH CHECK (
    school_id = (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    )
  );


-- ============================================================================
-- BROADCASTS - RLS Policies
-- ============================================================================
-- Ensures broadcasts are scoped by school

-- Drop existing policies if present
DROP POLICY IF EXISTS "Users can see broadcasts in their school" ON public.broadcasts CASCADE;
DROP POLICY IF EXISTS "Admins can create broadcasts in their school" ON public.broadcasts CASCADE;

-- Enable RLS on broadcasts if not already enabled
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- SELECT: Users see broadcasts from their school
CREATE POLICY "Users can see broadcasts in their school" ON public.broadcasts
  FOR SELECT
  USING (
    school_id = (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    )
    OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
  );

-- INSERT: Only admins can create broadcasts in their school
CREATE POLICY "Admins can create broadcasts in their school" ON public.broadcasts
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('SCHOOL_ADMIN', 'SUPER_ADMIN')
    AND
    school_id = (
      SELECT school_id FROM public.profiles WHERE id = auth.uid()
    )
  );


-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Verify RLS is enabled on all critical tables
SELECT table_name, rowsecurity 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('lesson_plans', 'lesson_plan_comments', 'parent_student_links', 'messages', 'broadcasts')
  AND rowsecurity = true;

-- Count total RLS policies
SELECT COUNT(*) as total_rls_policies 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('lesson_plans', 'lesson_plan_comments', 'parent_student_links', 'messages', 'broadcasts');

-- List all RLS policies
SELECT tablename, policyname, permissive, roles 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('lesson_plans', 'lesson_plan_comments', 'parent_student_links', 'messages', 'broadcasts')
ORDER BY tablename, policyname;
