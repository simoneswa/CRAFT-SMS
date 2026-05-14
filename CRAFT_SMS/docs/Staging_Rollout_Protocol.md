# CRAFT SMS - Staging Rollout Protocol
**Safe Pre-Live Verification & Certification**

The staging environment exists to validate production-ready code in a real-world infrastructure context without risking the integrity of the live institutional domain.

## 1. Staging Environment Architecture
- **Frontend**: Vercel Preview Deployments (accessible via unique `.vercel.app` URLs).
- **Backend**: Railway Staging Service (mirroring production resource allocations).
- **Database**: Supabase Staging Project (pre-populated with sanitized institutional data).

## 2. Pre-Live Verification Flow
1. **Pull Request**: Open a PR from `development` to `staging`.
2. **Automated CI**: GitHub Actions must pass (Lint, TSC, Build).
3. **Staging Linkage**: Manually point the Vercel Preview URL to the Railway Staging API.
4. **Tenant Simulation**: Use `HOST` header manipulation or temporary subdomains (e.g., `test.staging-craftsms.vercel.app`) to verify middleware routing.

## 3. Certification Checklist (Pre-Merge)
- [ ] **Auth Persistence**: Verify session remains active across navigation.
- [ ] **Sync Integrity**: Verify IndexedDB to Supabase synchronization.
- [ ] **PDF Fidelity**: Verify high-fidelity Transcript and Receipt exports.
- [ ] **Role Isolation**: Verify that a 'Teacher' cannot access 'Finance' modules.

## 4. Promotion to Production
Only after 100% success in the Staging Rollout phase can the code be merged into the `main` branch for public deployment.

## 5. Rollback Strategy
If any regression is discovered in staging:
1. **Revert**: Revert the PR on the `staging` branch.
2. **Analyze**: Use Railway/Vercel logs to identify the bottleneck.
3. **Patch**: Apply fix to `development` and restart the protocol.
