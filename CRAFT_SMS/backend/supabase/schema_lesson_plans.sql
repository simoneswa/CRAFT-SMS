-- Schema for lesson_plans and lesson_plan_comments
-- Non-destructive: create in staging Cloud SQL / Supabase schema for verification

CREATE TABLE IF NOT EXISTS lesson_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  subject_id UUID,
  class_id UUID,
  academic_year TEXT,
  term TEXT,
  week_number INT,
  topic TEXT,
  sub_topic TEXT,
  objectives TEXT,
  activities TEXT,
  assessment TEXT,
  resources JSONB,
  reflection TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_plans_tenant_status ON lesson_plans (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher ON lesson_plans (teacher_id);

CREATE TABLE IF NOT EXISTS lesson_plan_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_plan_id UUID NOT NULL REFERENCES lesson_plans(id) ON DELETE CASCADE,
  commenter_id UUID NOT NULL,
  commenter_role TEXT NOT NULL,
  comment TEXT NOT NULL,
  decision TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- NOTE: Row-Level Security (RLS) policies should be authored to preserve tenant isolation.
-- Example: ENABLE RLS THEN create policy allowing access when tenant_id = current_setting('app.current_tenant')::uuid
