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
| Padding top | **16px** |
| Divider under tabs | **None** |
| Layout | Tabs left; actions (edit, preview) right — `justify-content: space-between` |

Use `.program-detail-fullpage-modal__tabs-row`. Override global `button` padding so tab buttons are not affected (`index.css` defaults).

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

- Only on active tab, **text width** (not full button width).  
- **2px** thick, mint color, slightly rounded ends.  
- Implement via label `::after` on e.g. `.program-detail-fullpage-modal__tab-label` — **do not** use full-width `border-bottom` on the button.

## Files

- `program-detail-fullpage-modal.css`, `program-detail-fullpage-modal.tsx`

## Checklist

- [ ] 52px left padding  
- [ ] No divider under tab row  
- [ ] Underline matches text width, 2px mint  
- [ ] Active/inactive typography as above  
- [ ] Tab padding 6 / 16 / 10 with specific selectors  

**Last updated:** 2026-04-21
