# qDialer Web

Modern qDialer product shell built with Vite, React, Tailwind, Headless UI, shadcn-style components, TanStack Query, TanStack Table, and Zustand.

## Local Development

From the repository root:

```bash
npm install
npm run dev:web
```

The Vite dev server proxies `/api/*` to `http://127.0.0.1:8787`.

## Production Build

```bash
npm run build:web
```

The static build output goes to:

```text
www/qdialer/app
```

Apache can serve that directory directly, while `/api/v1/*` should be proxied to the qDialer API service.
