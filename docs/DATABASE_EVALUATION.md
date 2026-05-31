 # Database Evaluation: Firestore vs Cloud SQL (PostgreSQL)

 This document evaluates Firestore (NoSQL) and Cloud SQL (PostgreSQL) for CRAFT SMS workload. The evaluation focuses on the app's main domains: students, teachers, parents, attendance, grades, lesson plans, finance, reports, analytics, and multi-tenancy.

 ## Requirements Recap (from product)

 - Strong relational data model: students, classes, enrollments, grades, attendance records, and financial transactions have complex relationships and transactional semantics.
 - Multi-tenancy: tenant isolation (school_id) and row-level security are critical.
 - Reporting and analytics: complex queries, aggregations, joins, and historical snapshots.
 - ACID correctness for financial operations and grade records.
 - Scalability and predictable performance.

 ## Option A — Firestore (NoSQL)

 Pros:
 - Scales horizontally with serverless pricing.
 - Excellent for document-centric, denormalized data and mobile/offline sync with SDKs.
 - Built-in real-time listeners and offline support.

 Cons:
 - Joins and complex aggregations are difficult and expensive; requires denormalization or separate aggregation pipelines.
 - Implementing multi-tenant isolation and strict RLS-like policies is more complex and shifts responsibility to the application layer.
 - Strong transactional guarantees are limited compared to Postgres (Firestore supports transactions but limited scope and complexity).
 - Reporting and analytics workloads would likely require additional systems (BigQuery) and ETL.

 Best Fit:
 - Read-heavy, document-centric features with simple relationships and real-time sync needs.

 ## Option B — Cloud SQL (PostgreSQL)

 Pros:
 - Relational model fits students/teachers/enrollments/grades/finance with natural joins and strong ACID semantics.
 - Native support for RLS (Row-Level Security) and PostgreSQL features (JSONB, indexes, materialized views) useful for multi-tenancy and reporting.
 - Easier migration from existing Supabase Postgres schema; greater compatibility with existing code that uses Postgres semantics.
 - Supports connection pooling (PgBouncer), read replicas, and managed backups.

 Cons:
 - Requires managed connection pooling for serverless Cloud Run (Cloud SQL Proxy, IAM DB auth or private IP), and extra operational setup.
 - Autoscaling Cloud Run with Cloud SQL needs correct pooler sizing to avoid connection exhaustion.

 Best Fit:
 - Transactional workloads, complex joins, reporting, and preservation of RLS semantics.

 ## Recommendation

 Based on the application's requirements — strict multi-tenancy, row-level security, complex joins and transactional operations for finance and grades, and the existing Postgres/Supabase implementation — **Cloud SQL (PostgreSQL)** is the recommended choice.

 Rationale:
 - Preserves existing data model and RLS policies.
 - Minimal application-level refactor when moving from Supabase Postgres to Cloud SQL (mostly connection and auth changes).
 - Stronger fit for analytics and reporting without heavy denormalization.

 Migration note:
 - Export Supabase Postgres schema and data; validate constraints and indexes in Cloud SQL; use logical replication or dump & restore for initial sync; schedule short maintenance window for writable cutover.
