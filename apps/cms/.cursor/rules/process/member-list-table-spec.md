---
priority: high
category: process
---

# Users — all members table (screenshot reference)

Match the design screenshot. Implementation: `user-list.tsx`, `user-list-page.tsx`, `user-list-page.css`.

## Columns (six data columns + optional selection)

| Column | Notes |
|--------|--------|
| (optional) | Checkbox — `rowSelection` |
| No. | Centered, 1-based index |
| Name | `name` |
| Phone | `phone` or `—` |
| Email | `email` |
| Role | Map enum to localized labels (product copy) |
| Joined | `createdAt` as `YYYY. MM. DD` |

## Visual

- Header: centered labels, slightly bolder than body.  
- Light cell borders (see border rules below).  
- Selected row: light blue highlight.  
- Rounded top corners per DS.  
- Consistent dark text.

## Border rules (aligned with `.program-list-card`)

| Selector | Rules |
|----------|--------|
| `thead th` | `border-right` / `border-bottom` 1px `var(--color-bg-base)` |
| `thead th:last-child` | `border-right: none` |
| `tbody td` | `border-right` / `border-bottom` 1px `var(--color-border-light)` |
| `tbody td:last-child` | `border-right: none` |
| `tbody tr:last-child td` | `border-bottom: none` |

Scope: `.user-list-page__table-card .user-list-table`.

## Role labels

`INDIVIDUAL` / `SCHOOL` / `INSTRUCTOR` / `ADMIN` → display strings per locale (see codebase / product).

## Register-member modal

- New users from this flow are always **Individual**.  
- “Agreement document” action shows a not-ready alert until the feature ships.  
- Home address uses shared `AddressSearch`.

## Mock data

Mocks should populate phone, email, name, `createdAt`; fallback phone `—` and formatted date.

## Related

- [persona.md](./persona.md)  
- [member-detail-modal-spec.md](./member-detail-modal-spec.md)  

**Last updated:** 2026-04-21
