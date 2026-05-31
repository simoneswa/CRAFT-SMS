# Lesson Plan Module Specification

This document captures UI, API and data model details for the Lesson Plan Management module.

Database: see `CRAFT_SMS/backend/supabase/schema_lesson_plans.sql`.

API Endpoints (FastAPI)

- `POST /api/lesson-plans/` — create lesson plan (teacher)
- `GET /api/lesson-plans/` — list lesson plans (filter by status)
- `GET /api/lesson-plans/{id}` — get plan details
- `POST /api/lesson-plans/{id}/submit` — submit plan for review
- `POST /api/lesson-plans/{id}/comments` — add comment/review decision

UI Flows

Teacher
- Create / edit draft
- Save as Draft
- Submit for review

VPI (Vice Principal Academic)
- View submitted plans assigned to their school
- Add comments, request revisions, approve/reject

Principal
- View school-wide plan compliance and reports

Analytics & Dashboard
- Teacher dashboard: counts for draft, submitted, approved, revision requested
- VPI dashboard: pending reviews, review times, approval rates

Notes on multi-tenancy & permissions

- All queries must filter by `tenant_id` (school_id) for non-SUPER_ADMIN users.
- Backend enforces role-based permissions via existing `RoleChecker` dependency.
