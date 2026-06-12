# qDialer Modern App Architecture

## Direction

qDialer should become a modern product surface that runs beside VICIdial, not a fragile rewrite of every legacy PHP screen.

The clean split is:

- VICIdial keeps doing what it is excellent at: dialing, campaigns, Asterisk integration, agent session mechanics, call logs, recordings, and legacy admin operations.
- qDialer owns the modern agency experience: command center, vendor cost rules, agent productivity, recording review, audit, recommendations, SaaS deployment metadata, and billing surfaces.
- Legacy VICIdial pages stay available as advanced fallback screens while qDialer progressively replaces the manager workflows that matter most.

## Repository Shape

- `apps/qdialer-web`: Vite, React, Tailwind, Headless UI, shadcn-style components, TanStack Query, TanStack Table, and Zustand.
- `apps/qdialer-api`: Fastify API process that exposes qDialer endpoints, SSE, and connector boundaries.
- `packages/qdialer-shared`: Shared TypeScript contracts for API responses, report rows, live state, and setup models.
- `db/qdialer-postgres`: qDialer-owned Postgres schema migrations.
- `www/`: Existing VICIdial and current PHP qDialer assets. This remains the Apache-served legacy/current runtime until the React app is built into `www/qdialer/app`.

## Runtime Model

For each client deployment, qDialer and VICIdial can run on the same VPS:

- Apache continues serving `/agc`, `/vicidial`, and legacy PHP pages.
- The React app is built as static assets and served from `/qdialer/app`.
- Fastify runs on localhost, for example `127.0.0.1:8787`.
- Apache or Nginx proxies `/api/v1/*` to the Fastify service.
- Redis is optional at first, then useful for realtime fanout, report cache, and background job status.
- Postgres stores qDialer-native data that should not be custom columns in VICIdial tables.
- VICIdial MySQL/MariaDB is accessed through a read-only reporting user for analytics queries.
- The VICIdial API connector is reserved for controlled writes/actions such as status corrections that must sync back into VICI.

## Data Ownership

Use Postgres for qDialer-native data:

- Vendor records and source mappings.
- Vendor cost rules for CPA, CPL, and duration models.
- Status category mappings.
- Report snapshots and backfill job state.
- Recording review tags and notes.
- Role flags and report permissions layered over VICIdial users.
- Corrections and audit history.
- SaaS deployment/account metadata.

Use VICIdial DB read-only access for source-of-truth reporting inputs:

- Leads and lists.
- In-groups.
- Call logs and closer logs.
- Agent state and agent performance source data.
- Recording metadata.
- Campaign and user lookups.

Use VICIdial API for writes where qDialer must change VICIdial state:

- Disposition/status correction sync.
- Controlled admin actions after audit capture.
- Future provisioning operations where the VICIdial API is safer than direct table writes.

## Report Strategy

Vendor Cost Report:

- Attribute accepted leads/calls to list, in-group, or webhook source.
- Apply CPA, CPL, or duration rules from qDialer Postgres.
- Use highest billable event wins to avoid double-counting.
- Preserve first acquisition per lead by default.
- Allow authorized correction workflows with audit trail.

Agent Productivity Report:

- Read calls, statuses, talk time, pauses, and sale/acquisition outcomes from VICIdial.
- Present raw leaderboard plus normalized efficiency metrics.
- Keep vendor cost hidden from agents and non-authorized managers.

## Deployment Path

Phase 1:

- Keep existing PHP qDialer shell as the stable server entry.
- Add the React app under `/qdialer/app` for the new command center.
- Add Fastify as a localhost-only service.
- Run reports on mock data until the connector credentials are configured.

Phase 2:

- Add Postgres schema migrations for qDialer tables.
- Add read-only VICIdial queries behind the Fastify API.
- Add Redis-backed report cache and SSE live updates.
- Replace mock dashboard data with real metrics.

## Current VPS Runtime

The test VPS now runs:

- Apache serving VICIdial/PHP and the built qDialer React app.
- `qdialer-api.service` running Fastify on `127.0.0.1:8787`.
- Apache proxy for `/api/v1/*` to Fastify.
- PostgreSQL for qDialer-owned app data.
- Redis for qDialer cache/realtime support.

The qDialer API reads environment from:

```text
/etc/qdialer/qdialer-api.env
```

This file is root-only and should contain deployment secrets such as `DATABASE_URL`, `REDIS_URL`, and later VICIdial connector credentials.

Phase 3:

- Add setup flows for vendors, sources, status mapping, and permissions.
- Add audited correction flows.
- Add billing/provisioning in a separate Launch Console if qDialer becomes multi-client SaaS.

## Why This Pivot Is Better

Trying to make every old VICIdial PHP page feel like a modern SaaS app fights the codebase at the wrong layer. A React/Fastify qDialer layer lets us move quickly on the product experience managers actually want, while keeping the proven dialer engine intact.

The result should feel like qDialer first, with VICIdial available underneath for advanced operations and compatibility.
