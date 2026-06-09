"""
migrate_academic_core.py
========================
Creates all missing academic tables in the Neon PostgreSQL database.
Safe to re-run (idempotent — all statements use IF NOT EXISTS / DO blocks).

Tables created:
  - academic_terms
  - subjects
  - classes
  - enrollments
  - class_subjects
  - grade_categories   (required by academic.py grade engine)

Foreign key hierarchy:
  schools
  └── academic_terms
  └── subjects
  └── classes
        └── enrollments (→ profiles, → academic_terms)
        └── class_subjects (→ subjects, → profiles[teacher])

Run:
    python migrate_academic_core.py
"""
from __future__ import annotations

import asyncio
import os
import sys

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

NEON_DSN = os.environ.get("CLOUD_SQL_DATABASE_URL", "")
if not NEON_DSN:
    print("[FATAL] CLOUD_SQL_DATABASE_URL is not set.")
    sys.exit(1)

STEPS = [

    ("Create academic_terms table", """
CREATE TABLE IF NOT EXISTS public.academic_terms (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    start_date   DATE,
    end_date     DATE,
    is_current   BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);
"""),

    ("Create subjects table", """
CREATE TABLE IF NOT EXISTS public.subjects (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    code         TEXT,
    department   TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);
"""),

    ("Create classes table", """
CREATE TABLE IF NOT EXISTS public.classes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    grade_level  TEXT,
    room_number  TEXT,
    teacher_id   UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);
"""),

    ("Create enrollments table", """
CREATE TABLE IF NOT EXISTS public.enrollments (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id          UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    student_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    class_id           UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    academic_term_id   UUID NOT NULL REFERENCES public.academic_terms(id) ON DELETE CASCADE,
    enrolled_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, class_id, academic_term_id)
);
"""),

    ("Create class_subjects table", """
CREATE TABLE IF NOT EXISTS public.class_subjects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id    UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id  UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(class_id, subject_id)
);
"""),

    ("Create grade_categories table", """
CREATE TABLE IF NOT EXISTS public.grade_categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id   UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    weight      DECIMAL(5,2) NOT NULL DEFAULT 100.0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
"""),

    ("Migrate grades table to full schema", """
ALTER TABLE public.grades
    ADD COLUMN IF NOT EXISTS class_subject_id UUID REFERENCES public.class_subjects(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS category_id      UUID REFERENCES public.grade_categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS academic_term_id UUID REFERENCES public.academic_terms(id)   ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS status           TEXT DEFAULT 'DRAFT',
    ADD COLUMN IF NOT EXISTS notes            TEXT;
"""),

    ("Create performance indexes", """
CREATE INDEX IF NOT EXISTS idx_academic_terms_school   ON public.academic_terms(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school         ON public.subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_school          ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_school      ON public.enrollments(school_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student     ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class       ON public.enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_term        ON public.enrollments(academic_term_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_class    ON public.class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher  ON public.class_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_grades_student          ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_term             ON public.grades(academic_term_id);
CREATE INDEX IF NOT EXISTS idx_grade_categories_school ON public.grade_categories(school_id);
"""),

]


async def run():
    import asyncpg

    print("=" * 65)
    print("  CRAFT SMS — Academic Core Migration")
    print(f"  Target: {NEON_DSN.split('@')[-1]}")
    print("=" * 65 + "\n")

    conn = await asyncpg.connect(dsn=NEON_DSN)
    passed = 0
    failed = 0

    for name, sql in STEPS:
        try:
            await conn.execute(sql)
            print(f"  [OK]   {name}")
            passed += 1
        except Exception as e:
            print(f"  [FAIL] {name}")
            print(f"         -> {e}")
            failed += 1

    await conn.close()
    print(f"\n  Done: {passed} applied, {failed} failed\n")
    return failed


if __name__ == "__main__":
    errors = asyncio.run(run())
    sys.exit(1 if errors else 0)
