# qDialer API

Fastify API service for qDialer-native workflows and VICIdial connector boundaries.

## Local Development

```bash
cp apps/qdialer-api/.env.example apps/qdialer-api/.env
npm install
npm run dev:api
```

Default API base:

```text
http://127.0.0.1:8787/api/v1
```

## Current Routes

- `GET /api/v1/health`
- `GET /api/v1/dashboard/snapshot`
- `GET /api/v1/realtime/events`
- `GET /api/v1/vendors/cost-rules`
- `POST /api/v1/vendors/cost-rules`

## Connector Rule

Use read-only VICIdial DB access for reporting inputs. Use the VICIdial API connector only for controlled writes/actions after qDialer audit capture.
