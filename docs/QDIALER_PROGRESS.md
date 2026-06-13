# qDialer Progress Tracker

Last updated: 2026-06-13

## Overall Progress

qDialer v1 is roughly **44% complete**.

```text
[######################............................] 44%
```

This score is product-progress weighted, not just code volume. The foundation is real now, but the agency reporting value is still ahead of us.

## Phase Progress

| Phase | Status | Progress |
| --- | --- | ---: |
| Phase 1: White-label shell and deployed modern app | Mostly complete | 90% |
| Phase 2: Roles, vendor setup, source mapping, status mapping | In progress | 45% |
| Phase 3: Vendor cost attribution engine, snapshots, corrections, audit | Foundation only | 10% |
| Phase 4: Vendor Cost and Agent Productivity reports with real data | Early data wiring | 20% |
| Phase 5: Recording review and recommendations | Concept/UI placeholder | 5% |

## Completed

- qDialer branch exists and is pushed.
- Existing VICIdial behavior remains available.
- qDialer PHP shell and legacy styling pass are deployed.
- React/Vite qDialer app scaffold is deployed at `/qdialer/app/`.
- Fastify API is running behind Apache at `/api/v1/`.
- Node.js/npm installed on the VPS.
- Build passes on the VPS.
- npm audit reports zero high vulnerabilities.
- Postgres is installed and running for qDialer-owned data.
- Redis is installed and running for cache/realtime support.
- Initial Postgres migration is applied.
- API health reports dependency status for Postgres, Redis, VICIdial DB, and VICIdial API.
- Read-only VICIdial database user is configured.
- Dashboard and SSE snapshot endpoints now use real `vicidial_live_agents` data when available.
- Vendor/source cost rules are now backed by qDialer Postgres when configured.
- qDialer React app includes a Lists & Sources setup card for creating and activating/deactivating vendor cost rules.
- Dashboard Vendor Cost rows prefer saved vendor rules when available, while full attribution math remains upcoming.
- React shell navigation now opens distinct functional pages instead of dumping every workflow onto one long dashboard.
- Users, Live Agents, Lead Lookup, Recording Lookup, Numbers, In-Groups, Campaigns, Lists/Sources, Reports, Setup, and Advanced VICIDIAL all have dedicated qDialer destinations with working launch actions.

## Current State

- API mode is still `mock`.
- Postgres and Redis are healthy.
- VICIdial read-only DB connector is configured and healthy.
- VICIdial API connector is not configured yet.
- Live agent counts now come from VICIdial.
- Vendor Cost rows can now show saved vendor setup rules, but attribution metrics are not calculated yet.
- Agent Productivity screens still use mock data.

## Next Progress Slice

The next meaningful slice is to turn saved setup rules into calculated reporting:

1. Add status mapping endpoints for acquisition/bad-lead categories.
2. Join saved vendor rules against VICIdial call/lead data for billable counts, spend, and Vendor CPA.
3. Add duration clock selection per vendor/source, defaulting to agent-connected talk time.
4. Add audit events for vendor rule changes and later corrections.
5. Keep VICIdial API connector for audited write actions only.
