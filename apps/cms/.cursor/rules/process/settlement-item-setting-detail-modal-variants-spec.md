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

## Variant B — Transport (`p-1` 강사, `p-2` 학생, `transport`)

- Modifier: `settlement-item-setting-detail-modal--transport`, **800×715**.  
- **조건**: `ModalSpecTable` — 지급 요건·비고 textarea. p-1은 176px variant(6/5 rows), p-2는 `modal-spec-table--transport-student-condition`(104px, 3/3 rows).  
- **산정 기준**: 산정 기준 단위(km) + **이용 수단**(자차/대중교통) + 증빙 자료 제출 여부.  
- Numeric inputs **120×40** in spec table; evidence radios inline.

## Variant C — Lodging (`p-3`, `p-7`, `lodging`)

- Modifier: `settlement-item-setting-detail-modal--lodging`.  
- **조건**: 104px rows (`modal-spec-table--lodging-condition`).  
- **산정 기준**: 일 기준 단위 + (p-3 **최대 한도 금액** / p-7 **지급액**) + 증빙.

## Variant D — Meal / Activity (`p-4` meal, `p-6` volunteerActivity)

- Modifiers: `--meal`, `--volunteer-activity`.  
- **조건**: 104px rows.  
- **산정 기준**: **최대 한도 금액 + 증빙만** (산정 기준 단위 행 없음 — Notion 2-3·2-4).

## Variant E — Withholding daily worker (`d-1`, `withholdingDailyWorker`)

- Modifier: `settlement-item-setting-detail-modal--withholding-daily-worker`.  
- **조건**: 공제 요건 + **소액 부징수 범위**(원천징수세액 1,000원 이하 미징수).  
- **근로소득공제** / **소득세율** 각각 `ModalSpecTable` 섹션.

## Variant F — Gemini instructor fee (`w-gemini`, `gemini`)

- Modifier: `settlement-item-setting-detail-modal--gemini`, **800×715** (tier1 stack).  
- **조건**: `ModalSpecTable` — 지급 요건(`paymentRequirementShort` 80px)·비고(`remark` 128px) textarea.  
- **산정 기준**: `ModalSpecTable` — **1~4차시** 행, 각 행 `160×40` currency + `원` suffix.

## Shared

- Keep **120×40** (basis) / **160×40** (currency) controls in `ModalSpecTable` via settlement modal CSS overrides.  
- Visual regression: check spacing when switching wage / transport / meal / withholding variants.

**Last updated:** 2026-08-27
