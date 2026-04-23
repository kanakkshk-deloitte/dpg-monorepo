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
| `VITE_NETWORK_NAME` | first returned network | Locks the UI to one network |
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
| OTP check/request/verify | `/api/auth/unified-otp/*` |
| Session lookup | `GET /api/auth/get-session` |
| Sign out | `POST /api/auth/sign-out` |

The UI expects `/api/v1/network/schemas` to include entries with `kind === 'network_config'`.

## Startup Flow

1. `HomePage` fetches network configs from the API.
2. `VITE_NETWORK_NAME` selects a network when configured.
3. The selected config is resolved with `resolveNetworkRefs()`.
4. User-owned local items are fetched from local item APIs.
5. Target domain items are fetched through network item APIs.
6. Cards, forms, actions, and maps render from the loaded schemas.
