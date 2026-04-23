---
title: Components
description: UI component responsibilities and which ones are reusable.
head: []
---

## Layout

| Component | File | Purpose |
|-----------|------|---------|
| `PageShell` | `components/layout/page-shell.tsx` | Root layout with sidebar, top bar, and content region |
| `AppSidebar` | `components/layout/sidebar.tsx` | Network selector, domain browsing, profile list, create/edit links |
| `TopBar` | `components/layout/top-bar.tsx` | Search input and list/map view toggle |

## Cards

| Component | File | Purpose |
|-----------|------|---------|
| `CardGrid` | `components/cards/card-grid.tsx` | Responsive repeated item grid with loading and empty states |
| `DomainCard` | `components/cards/domain-card.tsx` | One schema-backed item card |
| `CardFieldsFromSchema` | `components/cards/card-field.tsx` | Public field rendering from JSON Schema |
| `ActionButton` | `components/cards/action-button.tsx` | Button for a schema-derived action |

## Forms

| Component | File | Purpose |
|-----------|------|---------|
| `SchemaForm` | `components/forms/schema-form.tsx` | RJSF + AJV8 form renderer for item and action schemas |
| `DatePickerWidget` | `components/forms/custom-widgets/date-picker-widget.tsx` | Custom date widget for `format: "date"` fields |

## Actions

| Component | File | Purpose |
|-----------|------|---------|
| `ActionHandler` | `components/actions/action-handler.tsx` | Owns action modal state and submit lifecycle |
| `ActionModal` | `components/actions/action-modal.tsx` | Desktop dialog/mobile drawer for action requirement forms |

## Auth

| Component | File | Purpose |
|-----------|------|---------|
| `AuthProvider` | `contexts/auth-context.tsx` | User/session/token state |
| `LoginPage` | `pages/auth/login-page.tsx` | Phone number entry and OTP request |
| `OtpPage` | `pages/auth/otp-page.tsx` | OTP verification |
| `OtpInput` | `components/auth/otp-input.tsx` | OTP entry control |
| `UserMenu` | `components/auth/user-menu.tsx` | Signed-in user and sign-out UI |

## Maps

| Component | File | Purpose |
|-----------|------|---------|
| `MapView` | `components/map/map-container.tsx` | Converts schema-backed items into map markers |
| `FitBounds` | `components/map/fit-bounds.tsx` | Fits Leaflet viewport to markers |
| `leaflet-provider` | `components/map/providers/leaflet-provider.tsx` | Default map provider |
| `google-maps-provider` | `components/map/providers/google-maps-provider.tsx` | Provider slot for Google Maps |

## Design System

`components/ui/*` contains shadcn/Radix primitives: buttons, cards, dialogs, drawers, popovers, selects, sidebar, skeletons, toggles, tooltips, calendar, inputs, labels, and separators.

For a custom product UI, the highest-value reusable components are `SchemaForm`, `DomainCard`, `CardFieldsFromSchema`, `ActionHandler`, `ActionModal`, and `MapView`.
