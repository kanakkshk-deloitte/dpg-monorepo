---
title: Utils And Packages
description: Utility modules and packages required to decode and display network-schema data.
head: []
---

## Engine Utilities

| File | Purpose |
|------|---------|
| `engine/schema/schema-loader.ts` | Loads schemas from inline objects, URLs, and API references |
| `engine/schema/resolve-schema.ts` | Resolves local, relative, and remote `$ref` values and flattens `allOf` |
| `engine/schema/schema-privacy.ts` | Filters schemas/data by the `private: true` convention |
| `engine/map/map-registry.ts` | Registers/selects map providers |
| `engine/types.ts` | UI-side network, action, map, and filter types |

## API Utilities

| File | Purpose |
|------|---------|
| `lib/api-config.ts` | API base URL selection from env and local storage |
| `lib/api-client.ts` | Axios client with bearer token attachment |
| `lib/network-api.ts` | Network config and network item fetch calls |
| `lib/item-api.ts` | Local item CRUD and action calls |
| `lib/auth-api.ts` | Unified OTP, session, and sign-out calls |
| `lib/auth-token.ts` | Token storage helpers |
| `lib/item-utils.ts` | Item geocoding/extraction helpers |
| `lib/utils.ts` | Shared UI utility helpers |

## Required Packages

For equivalent schema decoding and display behavior, keep these package categories:

| Package | Needed for |
|---------|------------|
| `react`, `react-dom` | UI runtime |
| `react-router-dom` | Routes and query params |
| `@rjsf/core`, `@rjsf/shadcn`, `@rjsf/utils`, `@rjsf/validator-ajv8` | JSON Schema forms |
| `ajv`, `ajv-formats` | JSON Schema validation support |
| `axios` | API client |
| `@radix-ui/*`, `radix-ui`, `vaul` | Dialogs, drawers, popovers, selects, tooltips |
| `tailwindcss`, `tailwind-merge`, `clsx`, `class-variance-authority` | Styling and component variants |
| `lucide-react` | Icons |
| `sonner` | Toasts |
| `leaflet`, `react-leaflet`, `@types/leaflet` | Default map implementation |
| `date-fns`, `react-day-picker` | Date picker widget |
| `schemas` workspace package | Shared schema package dependency |

If you do not reuse the existing visual components, you still need a JSON Schema renderer, a `$ref` resolver, privacy filtering, an API client, and map/geocoding utilities for equivalent behavior.
