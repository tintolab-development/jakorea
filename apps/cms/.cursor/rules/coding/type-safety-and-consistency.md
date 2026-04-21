---
priority: high
always_include: true
category: coding
---

# Type safety and consistency

## 1. No deprecated symbols

Do **not** use APIs marked `@deprecated`. Examples (follow current code, not this list alone):

- Prefer `AdminLevel` / `hasAdminLevel` over legacy admin-role helpers.  
- Prefer `programRoles[programId]` / `ProgramRole` over legacy program-role fields.  
- Use current `UserRole` enum values from shared types.

## 2. No “compat” shims in new code

```ts
// Bad
const level = user.adminLevel ?? user.adminRole

// Good
if (!user.adminLevel) throw new Error('adminLevel required')
```

## 3. One concept → one type

- User role: `UserRole`  
- Admin level: `AdminLevel`  
- Program role: `ProgramRole`  

Do not mix deprecated aliases in new signatures.

## 4. Consistent helpers

Use the project’s permission helpers (`hasAdminLevel`, `hasProgramRole`, etc.) as defined in `shared/config` / entities — not ad-hoc string checks scattered everywhere.

## 5. Field access

Read fields that exist on the current `User` (and related) types only; extend types when the API adds data instead of casting.

## Checklist

- [ ] No `@deprecated` imports in new/edited code  
- [ ] No `adminRole` / legacy role fields unless migrating old files explicitly  
- [ ] Shared helpers for permission checks  
- [ ] `pnpm typecheck` clean  

---

**Last updated:** 2026-04-21
