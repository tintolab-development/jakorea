---
priority: high
always_include: false
category: process
---

# Styling token refactor — developer handoff

**Goal:** Replace hard-coded colors/spacing in CMS CSS/inline styles with tokens from `theme-provider.css` (`var(--*)`). See [styling-tokens.md](../design/styling-tokens.md) and [persona.md](./persona.md).

## Scope

- Tokens live in `src/app/providers/theme-provider.css`.  
- Applies to global CSS, layout, features, pages, and TSX `style={{}}` where values are static.

## Status (summary)

- **P0** — `index.css`, `sidebar.css`, `main-header.css` — done.  
- **P1** — `app-button.css`, `teal-header-modal.css`, `filter-controls-common.css` — done.  
- **P2** — dashboard, program, schedule, auth, headers, modals — largely done per checklist in repo.  
- **P3** — inline styles in TSX: migrate to CSS + `var(--*)` or `style={{ color: 'var(--token)' }}` for high-traffic surfaces.

## Rules

- Third-party overrides: comment exceptions.  
- Missing token → add to `theme-provider.css` first.  
- Ensure `theme-provider.css` loads before consumers that reference tokens.

## Checklist

- [x] P0–P2 major files  
- [ ] P3 inline constants reduced per plan  
- [x] New styles follow [styling-tokens.md](../design/styling-tokens.md)

**Last updated:** 2026-04-21
