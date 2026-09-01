---
priority: high
category: process
---

# Program detail full-page modal — tab row

**Target:** `ProgramDetailFullPageModal` main tabs (shared info, progress, applicants, managers).  
**Assets:** project screenshots `Screenshot_2026-03-16_at_2.18.*` for padding and underline.

## Tab row layout

| Property | Value |
|----------|--------|
| Padding left | **52px** |
| Padding right | **24px** (or `var(--spacing-24)`) |
| Padding top | **16px** (풀페이지 상세 모달만; 목록형 페이지 탭은 없음) |
| Divider under tabs | **None** |
| Layout | Tabs left; actions (edit, preview) right — `justify-content: space-between` |

Prefer shared **`CmsTextTabs`** (`@/shared/ui/cms-text-tabs`) for new screens. `variant="detail"`(기본): 목록형은 하단만(32px); `.detail-fullpage-modal` / `.program-detail-fullpage-modal` 안에서는 상·하(16/32px). `variant="list"`: 행 패딩 없음. Legacy BEM remains aliased in `cms-text-tabs.css`.

## Tab button padding

Top **6px**, left/right **16px**, bottom **10px** on `button.program-detail-fullpage-modal__tab` (+ `box-sizing: border-box`).

## Inactive tab text

- Color `#7D7D7D`  
- Pretendard / `var(--font-family-primary)`  
- 18px / weight **500** / line-height **150%**  
- No bottom border.

## Active tab text

- Color `var(--JA-mint-01, #01A1AF)`  
- 18px / weight **700** / line-height **150%**

## Active underline

- **2px** `border-bottom` on the tab button (`cms-text-tabs__tab--active` / `program-detail-fullpage-modal__tab--active`).  
- Text–stroke gap from button padding **6 / 16 / 10** + `border-bottom` (not label `::after`).

## Files

- `cms-text-tabs.tsx`, `cms-text-tabs.css` (source of truth)
- `program-detail-fullpage-modal.css` (imports `cms-text-tabs.css`, legacy aliases)

## Checklist

- [ ] 52px left padding  
- [ ] No divider under tab row  
- [ ] Underline matches text width, 2px mint  
- [ ] Active/inactive typography as above  
- [ ] Tab padding 6 / 16 / 10 with specific selectors  

**Last updated:** 2026-04-21
