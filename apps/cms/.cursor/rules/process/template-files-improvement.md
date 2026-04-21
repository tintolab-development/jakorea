---
priority: high
category: implementation
---

# Template management — file-form category structure

## Problem

“File forms” had many sub-routes but one page implementation filtered by category. That caused **URL/menu/history mismatch** and confused operators.

## Goals

- **Operator UX:** find the right template quickly; URL matches visible filter.  
- **Engineering:** simpler router; category state synced with URL (query or path—pick one product-wide).  
- **Shareable URLs:** bookmarking reflects category.

## Recommended directions (choose one per product decision)

**A — Query parameter (single route)**  
- Route: `/templates/file-forms`  
- Category: `?category=instructor-resume`  
- Sidebar: one “File forms” entry; category via in-page tabs or filter synced to query.

**B — Dedicated paths (menu depth kept)**  
- Keep `/templates/file-forms/:category` (or similar) **if** IA requires separate menu items.  
- Each path renders the same page component with a resolved category prop.

**C — Hybrid**  
- Menu stays nested; deep links use query for filter state—document the canonical pattern in router + menu config.

## Implementation notes

- Keep **menu-config** and **router** as the source of truth; avoid duplicate category lists.  
- When removing duplicate routes, add redirects from old URLs if they were shared.  
- Full **template feature** UI (files / SMS / email) lives in `features/template` + `pages/templates`—see [template-management.md](../coding/template-management.md).

## Acceptance (example)

- Category changes update the URL and are restorable via refresh/back.  
- No “different path, identical ambiguous screen” without an explicit filter state.

**Last updated:** 2026-04-21
