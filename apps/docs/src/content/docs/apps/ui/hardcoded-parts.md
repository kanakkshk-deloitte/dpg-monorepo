---
title: Hardcoded Parts
description: Product-specific UI assumptions that are not generic DPG requirements.
head: []
---

These are current product choices in `apps/ui`. Treat them as replaceable when building a custom interface.

| Area | Current behavior |
|------|------------------|
| Routes | Fixed routes for home, profile create/edit, login, and OTP |
| Action name | `HomePage` assumes the primary action is `connect` |
| Action copy | The action button/modal uses connect-oriented text |
| Visible domains | Targets are derived from `network.actions.connect.interactions` |
| Item type selection | The first key in `domain.item_schemas` is used |
| Fallback item type | Some paths fall back to `profile` |
| Default network | `VITE_NETWORK_NAME` wins; otherwise first API network is used |
| Profile fallback network | `ProfileFormPage` falls back to `yellow_dot` if no env network is set |
| Title fields | Cards look for `name`, `full_name`, `title`, `provider_id`, `learner_id`, `student_id` |
| Domain icons | Known domain names map to lucide icons; unknown domains use generic icons |
| Location fields | Map rendering uses known coordinate, postal, address, city, region, and country field names |
| Map default | India center with Leaflet/OpenStreetMap |
| Auth | Phone OTP is the only built login flow |
| Item language | The UI calls generic items “profiles” |

## Customization Points

To generalize the UI:

- replace the `connect` lookup with iteration over `Object.entries(network.actions)`
- expose an item-type selector for domains with multiple item schemas
- move title field selection into schema metadata or a UI config
- move icon mapping into config
- replace profile wording with domain/item wording
- replace phone OTP pages if your product uses another login flow
- make map center and geocoding rules configurable
