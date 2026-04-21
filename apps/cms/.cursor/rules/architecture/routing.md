---
priority: medium
always_include: false
category: architecture
---

# Routing

Configure routes under `app/router/`. Use nested routes so `Layout` wraps feature pages.

## Naming

| Pattern | Path |
|---------|------|
| List | `/instructors` |
| Create | `/instructors/new` |
| Detail | `/instructors/:id` |
| Edit | `/instructors/:id/edit` |

Apply the same pattern to other domains (`/programs`, etc.).

## Example

```tsx
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'instructors', element: <InstructorsList /> },
    ],
  },
])
```

## Related

- [fsd-structure.md](./fsd-structure.md)  
- [table-management.md](../tables/table-management.md) — URL sync for filters  

**Last updated:** 2026-04-21
