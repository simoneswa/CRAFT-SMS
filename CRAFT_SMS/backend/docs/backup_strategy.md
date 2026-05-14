# CRAFT SMS Institutional Backup & Recovery Strategy

This document outlines the protocols for ensuring data continuity and disaster recovery for the CRAFT SMS Multi-Tenant Platform.

## 1. Database Persistence (Supabase PostgreSQL)
- **Point-in-Time Recovery (PITR)**: Enabled for production to allow restoration to any specific second within the last 7 days.
- **Daily Logical Backups**: Automated daily exports stored in a geographically separate region (S3/R2).
- **Retention**: 
  - Daily backups: 30 days.
  - Monthly snapshots: 12 months.

## 2. Institutional Media Redundancy (Supabase Storage)
- **Bucket Versioning**: Enabled for `school-logos` and `payment-slips` to prevent accidental deletion or corruption.
- **Cross-Region Replication**: Critical institutional media is replicated to a secondary storage cluster.

## 3. Disaster Recovery Protocols
- **RTO (Recovery Time Objective)**: < 4 Hours for platform-wide outages.
- **RPO (Recovery Point Objective)**: < 1 Hour (utilizing WAL-G logs).
- **Tenant Isolation Integrity**: Every restoration event must be followed by a `SecurityAudit.py` run to verify RLS boundary correctness.

## 4. Tenant Restoration Procedure
1. **Request Verification**: Verify Institutional Admin identity via Multi-Factor Authentication.
2. **Isolation Freeze**: Pause synchronization for the specific tenant during the restoration window.
3. **Point-in-Time Restore**: Execute Supabase PITR for the tenant's `school_id` schema.
4. **Validation**: Verify institutional KPIs against pre-outage snapshots.
5. **Release**: Resume operational synchronization.

## 5. Contact & Escalation
- Infrastructure Lead: [infra@craft-sms.com]
- Security Compliance: [security@craft-sms.com]
