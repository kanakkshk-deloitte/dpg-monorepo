---
title: Schema-Generated Parts
description: What the UI autoloads and renders from DPG network schemas.
head: []
---

The UI loads network config documents from the API and renders most domain behavior from that data.

| Network schema source | UI behavior |
|-----------------------|-------------|
| `network.name` | API context, item requests, action payloads |
| `display_name` | Network selector label |
| `description` | Optional user-facing context |
| `domains[]` | Sidebar domain list and create-profile role choices |
| `domains[].description` | Human-readable domain labels |
| `domains[].item_schemas` | Profile forms, card fields, map marker public data |
| `instances[]` | Instance metadata available to create/fetch flows |
| `actions.connect.interactions[]` | Visible target domains for the current source domain |
| `requirement_schema` | Dynamic action form in the modal/drawer |
| `event_schema` | Stored in action metadata; not yet rendered as a full event UI |
| JSON Schema `$ref` | Expanded before rendering through `resolveNetworkRefs()` / `resolveRefs()` |
| property `private: true` | Hidden from public cards and map markers |

## Forms

`SchemaForm` renders `domains[].item_schemas` with RJSF and AJV8.

Generated behavior:

- field order follows schema property order
- `format: "date"` uses `DatePickerWidget`
- `format: "email"` gets an email placeholder
- string enums get select-style placeholder behavior
- `private: true` fields are hidden in compact mode

## Cards

`DomainCard` and `CardFieldsFromSchema` render item cards from schema properties. Public cards filter out fields marked `private: true`.

The component does not need domain-specific code if it receives:

- the JSON Schema
- the item state data
- optional action metadata

## Actions

Action modals render `requirement_schema` dynamically. When an action has no requirement schema, the UI can submit an empty requirements object.

The current app only wires `connect`; a custom UI can render every valid action interaction from the network config.
