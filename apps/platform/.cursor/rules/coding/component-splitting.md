---
priority: high
always_include: true
category: coding
---

# When to split components

| Lines | Action |
|-------|--------|
| ~200 | OK as-is |
| 200–300 | Split if clear sections exist |
| 300+ | **Must split** before merge |

## Tabs

Put each tab body in its own file:

```txt
features/program/ui/
├── detail-modal.tsx
├── detail-basic-info-tab.tsx
└── detail-schedule-tab.tsx
```

## Helpers & hooks

- Pure helpers beside the consumer or `lib/` if shared.
- Complex state → `hooks/use-*.ts` (kebab-case file).

## Rules

1. Parent composes; children receive minimal props.
2. Shared CSS Module is fine across tab files when scoped to the same feature.
3. Name tabs `{parent}-{tab}-tab.tsx`.
4. Prefer named exports (`export function DetailModal`).

## When not to split

Tiny modals, single-section pages, or splits that increase coupling.

**Last updated:** 2026-06-08
