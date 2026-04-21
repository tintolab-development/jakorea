---
priority: medium
always_include: false
category: data
---

# Mock data

## Placement

Keep mock **services** in `entities/*/api/*-service.ts` (or feature-local mocks when experimental). Arrays/objects should mirror real API shapes.

## Consistency

When deleting or mutating entities, keep **referential integrity** (e.g. cascade deletes where the real API would).

## Related

- [api-spec-mock.md](./api-spec-mock.md)  
- [fsd-structure.md](../architecture/fsd-structure.md)  

**Last updated:** 2026-04-21
