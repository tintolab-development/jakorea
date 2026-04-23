# Design backlog (reference)

Historical design/product asks. **Implement only what is in current specs/roadmap**—treat this as context, not a checklist.

## Theme / color

- Domain accents exist in `theme-provider` — see [color-system.md](./color-system.md).  
- Designers should refine distinguishability, brand fit, and WCAG contrast.  
- Document Tag/Badge usage per state when finalizing DS.

## Richer Ant Design usage

Prefer appropriate Ant primitives (Layout, Navigation, Data Display, Feedback) instead of bespoke HTML when they fit CMS patterns.

## Documents & exports (interview themes)

- Official letters, certificates, volunteer/instructor proofs, settlement PDFs, previews, template management.  
- Track scope in product docs—not all items may be scheduled.

## Content admin (interview themes)

- Main popups, image banks, impact stories, downloadable assets with analytics.

## Settlement UX (interview themes)

- Monthly views, automation rules, payment statements, approval flows—align with finance stakeholders before build.

## Where code lives

- `theme-provider.tsx`, `theme-provider.css`, `shared/constants/colors.ts`

## Related

- [color-palette.md](./color-palette.md)  
- Ant Design theming: https://ant.design/docs/react/customize-theme  

**Last updated:** 2026-04-21
