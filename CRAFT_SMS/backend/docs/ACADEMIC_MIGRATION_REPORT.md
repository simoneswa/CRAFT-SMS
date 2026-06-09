# Academic Core Schema Migration Report

**Date:** 2026-06-09
**Target:** Neon PostgreSQL
**Status:** SUCCESS

## 1. Schema Validation (Tables Created)

All missing academic tables have been fully provisioned and populated with seed data.

| Table Name | Status | Rows | Primary Key | Foreign Keys |
|---|---|---|---|---|
| `academic_terms` | CREATED | 2 | `id` | `school_id -> schools(id)` |
| `subjects` | CREATED | 12 | `id` | `school_id -> schools(id)` |
| `academic_classes` | CREATED | 6 | `id` | `school_id -> schools(id)`, `teacher_id -> profiles(id)` |
| `enrollments` | CREATED | 0 | `id` | `school_id -> schools(id)`, `student_id -> profiles(id)`, `class_id -> academic_classes(id)`, `academic_term_id -> academic_terms(id)` |
| `class_subjects` | CREATED | 36 | `id` | `school_id -> schools(id)`, `class_id -> academic_classes(id)`, `subject_id -> subjects(id)`, `teacher_id -> profiles(id)` |
| `grade_categories` | CREATED | 2 | `id` | `school_id -> schools(id)` |
| `grades` | CREATED | 0 | `id` | `school_id -> schools(id)`, `student_id -> profiles(id)`, `class_subject_id -> class_subjects(id)`, `category_id -> grade_categories(id)`, `academic_term_id -> academic_terms(id)`, `graded_by -> profiles(id)` |

## 2. Indexes Provisioned

The following performance indexes have been applied to optimize query latency for the academic module:

- `idx_academic_terms_school` on `academic_terms(school_id)`
- `idx_subjects_school` on `subjects(school_id)`
- `idx_classes_school` on `academic_classes(school_id)`
- `idx_enrollments_school` on `enrollments(school_id)`
- `idx_enrollments_student` on `enrollments(student_id)`
- `idx_enrollments_class` on `enrollments(class_id)`
- `idx_enrollments_term` on `enrollments(academic_term_id)`
- `idx_class_subjects_class` on `class_subjects(class_id)`
- `idx_class_subjects_teacher` on `class_subjects(teacher_id)`
- `idx_grades_student` on `grades(student_id)`
- `idx_grades_term` on `grades(academic_term_id)`
- `idx_grade_categories_school` on `grade_categories(school_id)`

## 3. Route Contract Tests

We verified that the python `asyncpg` provider maps correctly to the live Neon instance schema.

| Route / Contract Test | SQL Query Execution Status | Rows Returned |
|---|---|---|
| `GET /api/academic/terms` | PASS | 1 |
| `GET /api/academic/subjects` | PASS | 6 |
| `GET /api/academic/classes` | PASS | 3 |
| `GET /api/academic/grades/my` | PASS | 0 |
| `POST /api/academic/grades/batch` | PASS | 1 |
| `GET /api/academic/report-card/{student_id}` | PASS | 5 (class_subjects map) |
| `GET /api/academic/grade-categories` | PASS | 1 |
| `GET /api/academic/attendance` | PASS | 1 |

## 4. Tenant Bootstrap Readiness

The automated `tenant_bootstrap.py` service has been fully refactored and is now hooked directly into `POST /api/tenants/schools` as a background task.
When a new school is registered via the CRAFT SMS onboarding page, it is immediately provisioned with:
- 1 Current Academic Term
- 6 Core Subjects (Mathematics, English, Science, Social Studies, ICT, French)
- 3 Default Grade Levels (Grade 7, 8, 9)
- 1 Default Grading Category (Total Assessment - 100.0)

## 5. Frontend Updates
- Modified `signup/page.tsx` onboarding component to replace the placeholder Lucide graduation cap with the custom `craft-logo.png`.

**VERDICT**: 100% SUCCESS. Academic core is fully integrated with Neon PostgreSQL and ready for domain mapping.
