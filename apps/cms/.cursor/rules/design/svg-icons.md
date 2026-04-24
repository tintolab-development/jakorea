---
priority: high
always_include: true
category: design
---

# Custom SVG icons

## Location

- `apps/cms/src/shared/ui/icons/`  
- Re-export from `index.ts`; import via `@/shared/ui/icons` or `@/shared/ui`.

Use **`@ant-design/icons`** for standard UI glyphs. Store **brand or illustration-specific SVGs** here only.

## Naming

- File & component: **PascalCase** + `Icon` suffix (`LogoutIcon.tsx`).

## Implementation

- Preserve `viewBox`; expose `size`, `fill`, `className`, etc.  
- Use `useId()` for `mask`/`clipPath` ids to avoid collisions.  
- Decorative icons: `aria-hidden`; meaningful icons: proper `role` / `aria-label`.

## Sharing rule

If more than one feature needs the asset, move it to `shared/ui/icons`.

## Related

- [ant-design-usage.md](../libraries/ant-design-usage.md)  
- [ui-principles.md](./ui-principles.md)  

**Last updated:** 2026-04-21
