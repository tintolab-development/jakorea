# Settlement item detail modal — variants (design handoff)

Implementation: `settlement-item-setting-detail-modal.tsx`, `.css`, `settlement-item-setting-detail.mock.ts`.

## Baseline — Tier-1 instructor fee (`w-1`, `tier1`)

- `ContentModal` **800×715**.  
- Body gap **30px**; label→control **6px**.  
- Basis row: Select + numeric input + radios (radio gap **16px** from inputs).  
- Amount row: three fields + 32px divider at opacity 0.5.  
- Qualification / remark rich text heights per CSS tokens.  
- Typography: `#464646`, Pretendard 16/500/150%.  
- No outer body scroll; only rich text areas scroll inside.

## Variant A — Special lecture (`w-4`, `simple`)

- Modifier: `settlement-item-setting-detail-modal--special-lecture`, size **800×618**.  
- Basis: Select only, **180×44**.  
- Cap field: single **180×44**.  
- Rich text: qual **56px**, remark **80px** (classes `__richtext--qual56`, `__richtext--remark`).  
- Verify **180px** overrides generic `width: 100%` on `basis-row--simple`.

## Variant B — Transport (`p-1`, `transport`)

- Modifier: `settlement-item-setting-detail-modal--transport`, **800×715**.  
- Distance Select + km input + radios (**180×44**).  
- Cap **180×44**.  
- Support text **104px**; remark **80px**; evidence radios `__evidence-radios`.

## Shared

- Keep **180×44** controls on a shared selector for maintainability.  
- Visual regression: check spacing when switching `w-1` / `w-4` / `p-1`.

**Last updated:** 2026-04-21
