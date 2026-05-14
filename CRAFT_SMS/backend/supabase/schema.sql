-- CRAFT SMS - Supabase Database Schema
-- Multi-Tenancy via Row-Level Security (RLS)

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Schools (Tenants)
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    branding JSONB DEFAULT '{"primary_color": "#0D9488", "secondary_color": "#111827"}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Profiles (Users - extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    school_id UUID REFERENCES public.schools(id),
    full_name TEXT,
    role TEXT CHECK (role IN ('SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'STUDENT', 'BUSINESS', 'PARENT')),
    custom_id TEXT UNIQUE, -- e.g., STU_2024_001
    avatar_url TEXT,
    phone_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Financial Slips
CREATE TABLE IF NOT EXISTS public.slips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    student_id UUID NOT NULL REFERENCES public.profiles(id),
    slip_number TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    image_url TEXT,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News Feed
CREATE TABLE IF NOT EXISTS public.news_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id), -- NULL means global news
    author_id UUID REFERENCES public.profiles(id),
    content TEXT NOT NULL,
    image_url TEXT,
    is_global BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gamification: Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id),
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER DEFAULT 10,
    category TEXT, -- e.g., 'Attendance', 'Homework', 'Behavior'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gamification: Task Completions
CREATE TABLE IF NOT EXISTS public.task_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES public.tasks(id),
    student_id UUID REFERENCES public.profiles(id),
    school_id UUID REFERENCES public.schools(id),
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    points_awarded INTEGER
);

-- 3. ROW LEVEL SECURITY (RLS)

-- Enable RLS
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

-- 4. ADDITIONAL TABLES

-- Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    student_id UUID NOT NULL REFERENCES public.profiles(id),
    date DATE DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
    recorded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grades
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    student_id UUID NOT NULL REFERENCES public.profiles(id),
    subject TEXT NOT NULL,
    score DECIMAL(5, 2),
    max_score DECIMAL(5, 2) DEFAULT 100,
    term TEXT, -- e.g., 'First Period', 'Midterm'
    graded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES public.schools(id),
    actor_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    target_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. FUNCTIONS & RLS POLICIES

-- Helper Function to get current user's school_id
CREATE OR REPLACE FUNCTION get_my_school_id() 
RETURNS UUID AS $$
  SELECT school_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE;

-- Schools: Only Super Admin or the school itself can see/edit
CREATE POLICY "Public schools are viewable by all" ON public.schools FOR SELECT USING (true);
CREATE POLICY "Super Admins can manage all schools" ON public.schools FOR ALL 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

-- Profiles: Users see their own profile, or admins see all in their school
CREATE POLICY "Users can see their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "School Admins can see all profiles in their school" ON public.profiles FOR SELECT 
    USING (school_id = get_my_school_id());
CREATE POLICY "Super Admins can see all profiles" ON public.profiles FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));

-- Slips: Students see their own, Business sees their school's, Parents see their student's
CREATE POLICY "Students see their own slips" ON public.slips FOR SELECT 
    USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.parent_student_links WHERE parent_id = auth.uid() AND student_id = public.slips.student_id));
CREATE POLICY "Business can manage their school slips" ON public.slips FOR ALL 
    USING (school_id = get_my_school_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'BUSINESS'));

-- News Feed: Everyone sees global news, only school members see school news
CREATE POLICY "Global news is public" ON public.news_feed FOR SELECT 
    USING (is_global = true);
CREATE POLICY "School news is for school members" ON public.news_feed FOR SELECT 
    USING (school_id = get_my_school_id());

-- Attendance RLS
CREATE POLICY "Students see their own attendance" ON public.attendance FOR SELECT 
    USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.parent_student_links WHERE parent_id = auth.uid() AND student_id = public.attendance.student_id));
CREATE POLICY "Teachers can manage attendance in their school" ON public.attendance FOR ALL 
    USING (school_id = get_my_school_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('TEACHER', 'SCHOOL_ADMIN')));

-- Grades RLS
CREATE POLICY "Students see their own grades" ON public.grades FOR SELECT 
    USING (student_id = auth.uid() OR EXISTS (SELECT 1 FROM public.parent_student_links WHERE parent_id = auth.uid() AND student_id = public.grades.student_id));
CREATE POLICY "Teachers can manage grades in their school" ON public.grades FOR ALL 
    USING (school_id = get_my_school_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('TEACHER', 'SCHOOL_ADMIN')));

-- Audit Logs RLS
CREATE POLICY "School Admins can see their school audit logs" ON public.audit_logs FOR SELECT 
    USING (school_id = get_my_school_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN'));
CREATE POLICY "Super Admins can see all audit logs" ON public.audit_logs FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'));
-- Inserts to audit_logs are handled by the backend using Service Key to ensure integrity

-- 6. TRIGGERS

-- Custom ID Generation Logic
CREATE OR REPLACE FUNCTION generate_profile_custom_id()
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    year_str TEXT;
    count_val INTEGER;
BEGIN
    -- Only generate if custom_id is NULL and school_id/role are present
    IF NEW.custom_id IS NOT NULL OR NEW.school_id IS NULL OR NEW.role IS NULL THEN
        RETURN NEW;
    END IF;

    -- Determine prefix based on role
    CASE NEW.role
        WHEN 'STUDENT' THEN prefix := 'STU';
        WHEN 'TEACHER' THEN prefix := 'TEA';
        WHEN 'BUSINESS' THEN prefix := 'BUS';
        WHEN 'SCHOOL_ADMIN' THEN prefix := 'ADM';
        WHEN 'SUPER_ADMIN' THEN prefix := 'SA';
        ELSE prefix := 'USR';
    END CASE;

    year_str := to_char(CURRENT_DATE, 'YYYY');

    -- Count existing profiles with this prefix and school_id for the current year
    SELECT COUNT(*) + 1 INTO count_val
    FROM public.profiles
    WHERE school_id = NEW.school_id
    AND role = NEW.role
    AND custom_id LIKE prefix || '_' || year_str || '_%';

    -- Format: PREFIX_YEAR_SEQUENCE (e.g., STU_2024_001)
    NEW.custom_id := prefix || '_' || year_str || '_' || LPAD(count_val::text, 3, '0');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_profile_custom_id
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION generate_profile_custom_id();

-- Auto-update profiles on auth.users changes
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, school_id, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'school_id')::uuid,
    new.raw_user_meta_data->>'role'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- Automatically generate role-based custom IDs (e.g., STU_2024_0001)
CREATE OR REPLACE FUNCTION generate_custom_id() 
RETURNS TRIGGER AS $$
DECLARE
    prefix TEXT;
    year_str TEXT;
    next_val INT;
    new_id TEXT;
BEGIN
    -- Only generate if custom_id is null
    IF NEW.custom_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- Set prefix based on role
    CASE NEW.role
        WHEN 'STUDENT' THEN prefix := 'STU';
        WHEN 'TEACHER' THEN prefix := 'TEA';
        WHEN 'SCHOOL_ADMIN' THEN prefix := 'ADM';
        WHEN 'BUSINESS' THEN prefix := 'BIZ';
        WHEN 'SUPER_ADMIN' THEN prefix := 'SUP';
        ELSE prefix := 'USR';
    END CASE;

    year_str := to_char(CURRENT_DATE, 'YYYY');

    -- Get next sequence value for this school, role, and year
    -- Using a simple count + 1 for now, but in high-concurrency systems, a real sequence per tenant is better.
    SELECT COUNT(*) + 1 INTO next_val 
    FROM public.profiles 
    WHERE school_id = NEW.school_id 
    AND role = NEW.role 
    AND custom_id LIKE prefix || '_' || year_str || '_%';

    NEW.custom_id := prefix || '_' || year_str || '_' || LPAD(next_val::TEXT, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_custom_id ON public.profiles;
CREATE TRIGGER tr_generate_custom_id
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION generate_custom_id();
-- Academic Terms
CREATE TABLE IF NOT EXISTS public.academic_terms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    name TEXT NOT NULL, -- e.g., 'Term 1 2024', 'Semester 1'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE, -- To prevent changes after finalization
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    name TEXT NOT NULL,
    code TEXT, -- e.g., 'MATH101'
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    name TEXT NOT NULL, -- e.g., 'Grade 10A'
    grade_level TEXT,
    room_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Class-Subject assignments (Links classes, subjects, and teachers)
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    class_id UUID NOT NULL REFERENCES public.classes(id),
    subject_id UUID NOT NULL REFERENCES public.subjects(id),
    teacher_id UUID REFERENCES public.profiles(id),
    schedule JSONB DEFAULT '[]'::jsonb, -- Store days/times
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Enrollments (Links students to classes)
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    class_id UUID NOT NULL REFERENCES public.classes(id),
    student_id UUID NOT NULL REFERENCES public.profiles(id),
    academic_term_id UUID NOT NULL REFERENCES public.academic_terms(id),
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WITHDRAWN', 'GRADUATED')),
    UNIQUE(student_id, academic_term_id) -- A student can only be in one class per term
);

-- Grade Categories (Weighted grading)
CREATE TABLE IF NOT EXISTS public.grade_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    name TEXT NOT NULL, -- e.g., 'Exams', 'Quizzes', 'Homework'
    weight DECIMAL(5, 2) NOT NULL, -- e.g., 40.00 for 40%
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Refined Grades Table
DROP TABLE IF EXISTS public.grades;
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    student_id UUID NOT NULL REFERENCES public.profiles(id),
    class_subject_id UUID NOT NULL REFERENCES public.class_subjects(id),
    category_id UUID NOT NULL REFERENCES public.grade_categories(id),
    academic_term_id UUID NOT NULL REFERENCES public.academic_terms(id),
    score DECIMAL(5, 2),
    max_score DECIMAL(5, 2) DEFAULT 100,
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED')),
    graded_by UUID REFERENCES public.profiles(id),
    graded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO' CHECK (type IN ('INFO', 'ACADEMIC', 'FINANCE', 'SYSTEM')),
    read_at TIMESTAMPTZ,
    link TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for new tables
ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for Academic Tables (Simplified for brevity, following the established pattern)
CREATE POLICY "School members can view academic data" ON public.academic_terms FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "School members can view subjects" ON public.subjects FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "School members can view classes" ON public.classes FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "School members can view class assignments" ON public.class_subjects FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "School members can view enrollments" ON public.enrollments FOR SELECT USING (school_id = get_my_school_id());
CREATE POLICY "School members can view grade categories" ON public.grade_categories FOR SELECT USING (school_id = get_my_school_id());

-- Notification Policies
CREATE POLICY "Users can see their own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Management Policies (Admin/Teacher)
CREATE POLICY "Admins can manage academic structure" ON public.academic_terms FOR ALL USING (school_id = get_my_school_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN'));
CREATE POLICY "Admins can manage subjects" ON public.subjects FOR ALL USING (school_id = get_my_school_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN'));
CREATE POLICY "Admins can manage classes" ON public.classes FOR ALL USING (school_id = get_my_school_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN'));
CREATE POLICY "Teachers can manage grades" ON public.grades FOR ALL USING (school_id = get_my_school_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('TEACHER', 'SCHOOL_ADMIN')));

-- Parent-Student Links
CREATE TABLE IF NOT EXISTS public.parent_student_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    parent_id UUID NOT NULL REFERENCES public.profiles(id),
    student_id UUID NOT NULL REFERENCES public.profiles(id),
    relationship TEXT, -- e.g., 'Father', 'Mother', 'Guardian'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, student_id)
);

-- Institutional Messaging
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    receiver_id UUID NOT NULL REFERENCES public.profiles(id), -- For DM
    content TEXT NOT NULL,
    attachment_url TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Broadcasts (Announcements)
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id),
    author_id UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    target_roles TEXT[] DEFAULT '{STUDENT, TEACHER, PARENT}'::TEXT[],
    is_emergency BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for new tables
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

-- Parent-Student Links Policies
CREATE POLICY "Parents see their own student links" ON public.parent_student_links FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY "Admins can manage student links" ON public.parent_student_links FOR ALL USING (school_id = get_my_school_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SCHOOL_ADMIN'));

-- Messages Policies
CREATE POLICY "Users see their own sent/received messages" ON public.messages FOR SELECT 
    USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT 
    WITH CHECK (sender_id = auth.uid());

-- Broadcasts Policies
CREATE POLICY "School members see relevant broadcasts" ON public.broadcasts FOR SELECT 
    USING (school_id = get_my_school_id() AND (target_roles && ARRAY[(SELECT role FROM public.profiles WHERE id = auth.uid())]));
CREATE POLICY "Admins/Teachers can create broadcasts" ON public.broadcasts FOR INSERT 
    WITH CHECK (school_id = get_my_school_id() AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SCHOOL_ADMIN', 'TEACHER')));
