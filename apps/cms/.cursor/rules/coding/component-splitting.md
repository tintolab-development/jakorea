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

```
features/school/ui/
├── teacher-detail-modal.tsx
├── teacher-basic-info-tab.tsx
└── teacher-resume-tab.tsx
```

## Helpers & hooks

- Pure helpers beside the consumer or `lib/` if shared.  
- Complex state → `hooks/use-*.ts`.

## Rules

1. Parent composes; children receive minimal props.  
2. Shared CSS file is fine across tab files.  
3. Name tabs `{parent}-{tab}-tab.tsx`.  
4. Prefer named exports.

## When not to split

Tiny modals, single table pages, or splits that increase coupling.

**Last updated:** 2026-04-21
