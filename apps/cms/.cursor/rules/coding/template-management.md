---
priority: high
category: implementation
---

# Template management — implementation rules

**Scope:** `apps/cms/src/features/template/**`, `apps/cms/src/pages/templates/**`  
**Out of scope:** product copy, IA, PM-only specs (track in `docs/`).

---

## Where to put UI

| Location | Use for |
|----------|---------|
| `@/features/template/ui` | Reusable full-page modal shell, left/right nav, section cards for **authoring / issuance** flows |
| `@/features/template` (rest) | SMS/email CRUD, tables, filters, batch send, previews—**channel-specific** behaviour |

If two+ screens share the same full-page shell → keep it in `features/template/ui`.

---

## Common imports (full-page shell)

- `template-list-card`, `template-fullpage-modal`, `template-modal-left-content`, `template-modal-right-navigation`

---

## Module map (reference)

- `model/template.schema.ts` — variants / sections  
- `lib/build-template-config.ts` — left/right builder  
- `hooks/*` — modal, CRUD, clipboard, editor, preview  
- `template-route-redirects.tsx` — legacy URL redirects  

Pages under `pages/templates` **compose** features; promote duplicated patterns into `features/template`.

---

## Route areas

- **A — Form management (author / issue):** `/templates` with `tab` query; uses schema + `use-template-modal` + `template-table` (+ sections as needed).  
- **B — SMS / email pages:** can differ from A; do not force the same shell if UX differs.  
- **C — Legacy/simple pages** (`template-files-page`, etc.) keep their own stack unless explicitly unified.

---

## Shared field widgets

Prefer **`CmsCheckbox` / `CmsCheckbox.Group`** from `@/shared/ui/cms-checkbox` with `checkboxSize="large"` for template form sections instead of raw Ant checkboxes, per design alignment.

---

## Related

- [template-files-improvement.md](../process/template-files-improvement.md) — URL/category strategy  
- [list-page composition](./list-page-composition.mdc) — list pages elsewhere  

**Last updated:** 2026-04-21
