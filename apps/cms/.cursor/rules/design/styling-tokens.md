---
priority: high
always_include: true
category: design
---

# Design tokens (CSS variables)

**Definition file:** `src/app/providers/theme-provider.css`

## Priority

Always prefer tokens for **color, spacing, typography, radius, shadow**. Do not duplicate literals when a token exists.

## Rules

- **Colors:** `var(--color-*)` — no raw `#hex` in new CMS CSS.  
- **Spacing:** `var(--spacing-*)` for padding/margin/gap.  
- **Type:** `var(--font-size-*)`, `var(--font-weight-*)`, `var(--line-height-*)`.  
- **Radius / shadow:** `var(--radius-*)`, `var(--shadow-*)`.

### Token groups (non-exhaustive)

- Brand & domain: `--color-brand-primary`, `--color-program`, `--color-school`, …  
- Text: `--color-text-heading`, `--color-text-body`, `--color-link`  
- Surfaces: `--color-bg-base`, `--color-border`, …  
- Spacing: `--spacing-4` … `--spacing-32`

## Good vs bad

```css
/* Good */
.card {
  padding: var(--spacing-16);
  color: var(--color-text-body);
  border-radius: var(--radius-8);
}

/* Bad */
.card {
  padding: 16px;
  color: #333;
}
```

## Exceptions

- Third-party overrides may need literals—comment why and keep minimal.  
- If a value is missing, **add a token** in `theme-provider.css` first.

## Related

- [color-palette.md](./color-palette.md)  
- [color-system.md](./color-system.md)  

**Last updated:** 2026-04-21
