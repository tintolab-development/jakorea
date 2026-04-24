---
priority: high
always_include: true
category: architecture
---

# Feature-Sliced Design (FSD)

We follow FSD for `apps/cms/src`.

## Layout

```
src/
├── app/           # bootstrap, router, providers
├── widgets/     # composite blocks (shell, layout)
├── features/    # business features (ui/model/api/lib)
├── entities/    # domain models + entity APIs
├── shared/      # ui, hooks, lib, constants
└── pages/       # route-level pages composing features/widgets
```

## Responsibilities

| Layer | Purpose |
|-------|---------|
| `app` | Router, global providers |
| `widgets` | Layout shell, headers, sidebars combining features |
| `features` | Use-cases (CRUD, filters, flows) |
| `entities` | Types + entity services |
| `shared` | Reusable primitives only |
| `pages` | Route components wiring features |

## Dependency rules

- **`shared` must not import** `features` or `entities`. Inject auth via context from `app` when needed.  
- **ACL helpers** (`program-acl`, download permission) live in `features/permission-request/lib`, not `shared`.  
- **`ProtectedRoute`** stays in `app/components/protected-route`.  
- Prefer **feature public API** imports: `@/features/<name>` (barrel) from pages/other features.

## Principles

- Group by feature; page chrome in `features/*/ui` when feature-specific.  
- Shared visuals in `shared/ui`.

## Related

- [routing.md](./routing.md)  
- [component-patterns.md](../coding/component-patterns.md)  

**Last updated:** 2026-04-21
