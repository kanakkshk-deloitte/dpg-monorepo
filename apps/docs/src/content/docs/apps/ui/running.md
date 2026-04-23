---
title: Running The UI
description: How to run the schema-driven UI locally and what backend routes it expects.
head: []
---

Run the UI from the monorepo root:

```bash
pnpm dev:ui
```

Build it for production:

```bash
pnpm build:ui
```

Preview the production build:

```bash
pnpm preview:ui
```

## Runtime Env

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_URL` | `http://localhost:3000` | Base URL for the API app |
| `VITE_DEFAULT_API_URL` | — | Preferred default API URL when multiple URLs are configured |
| `VITE_API_URLS` | — | JSON map of named API URLs |
| `VITE_SHOW_INSTANCE_SELECTOR` | dev mode | Forces API instance selector behavior |
| `VITE_NETWORK_NAME` | first returned network | Comma-separated allowlist of network names to expose in the UI |
| `VITE_MAP_PROVIDER` | `leaflet` | Active registered map provider |
| `VITE_GEOCODING_API_URL` | `api.postalpincode.in` | Pincode geocoding endpoint |

## Required Backend Routes

| Capability | Endpoint |
|------------|----------|
| Network config discovery | `GET /api/v1/network/schemas` |
| Network-wide item browsing | `GET /api/v1/network/item/fetch` |
| User-owned item discovery | `GET /api/v1/item/fetch` |
| Item creation | `POST /api/v1/item/create` |
| Item update | `PATCH /api/v1/item/:itemId` |
| Action submission | `POST /api/v1/action/perform` |
| Action inbox/outbox | `GET /api/v1/action/fetch` |
| Action event history | `GET /api/v1/action/fetch-events` |
| Action status updates | `POST /api/v1/action/update-status` |
| OTP check/request/verify | `/api/auth/unified-otp/*` |
| Session lookup | `GET /api/auth/get-session` |
| Sign out | `POST /api/auth/sign-out` |

The UI expects `/api/v1/network/schemas` to include entries with `kind === 'network_config'`.

## Startup Flow

1. `HomePage` fetches network configs from the API.
2. `?network=<name>` selects a configured network when present; otherwise the first configured or returned network is used.
3. The selected config is resolved with `resolveNetworkRefs()`.
4. User-owned local items are fetched from local item APIs.
5. Target domain items are fetched through network item APIs.
6. Cards, forms, actions, maps, and action-management screens render from the loaded schemas and action APIs.

## Auth Notes

- `LoginPage` supports both phone and email identifiers.
- OTP verification stores the returned bearer token and hydrates the session in `AuthProvider`.
- `RequireAuth` redirects protected routes to `/auth/login?redirect=...` and returns users to the original path after login.
