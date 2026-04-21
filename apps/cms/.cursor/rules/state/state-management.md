---
priority: medium
always_include: false
category: state
---

# State management (Zustand)

## Global state

Use **Zustand** stores scoped by **feature** (`features/<name>/model/*-store.ts`).

## Local state

Prefer `useState` / `useReducer` inside components. Promote to Zustand only when multiple distant components must share the same data.

## Example

```typescript
interface InstructorState {
  instructors: Instructor[]
  setInstructors: (rows: Instructor[]) => void
}

export const useInstructorStore = create<InstructorState>(set => ({
  instructors: [],
  setInstructors: instructors => set({ instructors }),
}))
```

## Related

- [custom-hooks.md](../coding/custom-hooks.md)  
- [fsd-structure.md](../architecture/fsd-structure.md)  

**Last updated:** 2026-04-21
