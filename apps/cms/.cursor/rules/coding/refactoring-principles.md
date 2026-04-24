# Refactoring principles

**Scope:** All components and hooks.  
**Goal:** Reusable, testable, maintainable React code.

---

## 1. Reusability

- Single responsibility; clear props.  
- Minimize hidden dependencies (avoid pulling stores into dumb UI when avoidable).  
- Shared visuals live under `shared/ui/`.

---

## 2. Testability

- Put business logic in **hooks**; components mostly render from props/state from hooks.  
- Prefer pure functions and injectable dependencies for side effects.

---

## 3. Maintainability

- Split by concern (`ui/` vs `hooks/`).  
- Prefer many small files over one “god” file.  
- Typical trigger to split: **~200+ lines** or mixed unrelated concerns.

---

## 4. Readability

- Descriptive names; avoid deep nesting.  
- Co-locate feature pieces under the same feature folder.

---

## 5. Type safety

- No `any` without justification; run `pnpm typecheck` before merge.

---

## Patterns (short)

**Hook + presentational component**

```tsx
export function useMfaVerification(opts: { open: boolean }) {
  /* state + handlers */
  return { form, submit, ... }
}

export function MfaVerificationModal({ open }: Props) {
  const v = useMfaVerification({ open })
  return <Modal>...</Modal>
}
```

**Bad:** hundreds of lines mixing effects, handlers, and JSX in one file.

---

## Related

- [component-patterns.md](./component-patterns.md)  
- [custom-hooks.md](./custom-hooks.md)  

**Last updated:** 2026-04-21
