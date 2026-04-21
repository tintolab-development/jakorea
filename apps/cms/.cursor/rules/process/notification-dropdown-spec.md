---
priority: high
category: process
---

# Header notification bell — dropdown spec

Use a **Dropdown**, not a **Modal**. Reference screenshot `Screenshot_2026-03-11_at_10.44.58_AM-*.png`.

## Trigger & placement

- Bell in header opens panel below (`placement` e.g. `bottomRight`).

## Count badge typography (e.g. “N items”)

| Property | Value |
|----------|--------|
| Color | `var(--default-BK, #3D3D3D)` |
| Font | Pretendard 14px / 500 / 130% |

Apply via e.g. `.main-header-notification-count` in `main-header.css`.

## Panel container

- **406×500** (content area).  
- Padding **16px**, radius **6px**, border `1px solid #D4D4D4`, background `#FAFAFA`, shadow `0 4px 12px rgba(32,32,33,0.10)`.

## Category header (63px)

Six filters, fixed order: **All** · **Application/Matching** · **Settlement** · **Inquiry** · **Updates** · **System**.  
Active: teal fill + white text; inactive: light gray.  
Map types: e.g. `matching`, `settlement`, `schedule`/`update`, `system` — extend when backend adds “inquiry”.

## Body

- **16px** below header. Scroll inside panel when list is long.

## List item card

Rounded **6px**, background `#FAFAFA`. Stack: category tag (bracketed, mint), title, optional subtitle, date `YYYY.MM.DD`.

## Behavior

- Click outside / blur closes.  
- Item click: mark read + navigate if `link`, then close.  
- “Mark all read” keeps existing handler if present.

## Code pointers

- `main-header.tsx` — replace modal trigger with dropdown.  
- `use-notifications.ts`, `notification-service.ts`  
- Reuse or split from `notification-modal.tsx` → e.g. `NotificationDropdown`.

## Acceptance

- [ ] Opens as dropdown, not modal  
- [ ] Container and typography match §§2–4  
- [ ] Six categories + filtering  
- [ ] Dismiss on outside click  

**Last updated:** 2026-04-21
