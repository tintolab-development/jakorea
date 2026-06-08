---
priority: high
always_include: true
category: coding
---

# Type safety and consistency

## 1. No deprecated symbols

Do **not** use APIs marked `@deprecated`. Prefer current types and helpers from `entities/` or `@jakorea/*`.

## 2. No "compat" shims in new code

```ts
// Bad
const value = user.newField ?? user.legacyField

// Good — extend types or handle absence explicitly
if (user.newField == null) return null
```

## 3. One concept → one type

Do not mix deprecated aliases in new signatures. Extend entity types when the API adds data instead of casting.

## 4. Consistent helpers

Use shared helpers from `shared/lib` or `entities/` — not ad-hoc string checks scattered everywhere.

## 5. Field access

Read fields that exist on current types only; extend types when the API adds data instead of `as` casting.

## Checklist

- [ ] No `@deprecated` imports in new/edited code
- [ ] Shared helpers for repeated logic
- [ ] `pnpm --filter platform typecheck` clean

**Last updated:** 2026-06-08
