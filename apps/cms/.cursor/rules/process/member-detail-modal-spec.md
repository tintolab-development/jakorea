---
priority: high
category: process
---

# Users — member detail modal (screenshot reference)

Opened from a **row click** on the all-members table. Match screenshot + this spec.

## Regions

1. **Header** — Teal bar, localized title per product copy, white close (X).  
2. **Permission row** — Gray hint left; **Withdraw** (danger outline) + **Edit** (teal outline) right, `space-between`.  
3. **Tabs** — Basic info | Program history (n) | Volunteer history (n); active tab = teal underline.  
4. **Basic tab body** — Left: **photo** (184.5×240, rounded border, `object-fit: cover`, empty state). Right: **key–value grid** (light dividers, label column ~180px, row height ~48px).  
5. **Footer** — Single centered **Close** (outline).

## Dimensions

- Width **1400px**. Body height **458px** (includes footer “Close” area, excludes chrome).  
- Padding ~20–30px horizontal per design.

## Permissions

- Only the **member themselves or admins** may edit; show hint text. Enable **Edit** / **Withdraw** only when allowed.

## Tab keys

`basic` · `programs` · `volunteer` — align labels with product copy.

## Basic info grid (high level)

- **Left column**: Name block (KO/EN sub-rows + optional badge), phone, address, linked social.  
- **Right column**: Birth date + age, gender, email, affiliation/grade, joined date.  
- Use `|` between paired values where design shows it.  
- Admin-only extra rows (role tags, scope, status) when applicable.  
- Extend `User` with missing fields or placeholders per design.

## Footer

- **Close** centers, outline style, closes modal.

## Implementation notes

- Prefer **Modal** (or fixed-size Drawer) to hit **1400×458**; if using Drawer, match dimensions.  
- Withdraw may wire to existing delete flow — confirm with product.  
- Code: `UserDetailFullPageModal`, `DetailFullPageModal`, `user-detail-modal.css`; see also `TealHeaderModal`, `enrollment-status-detail-modal`.

## Related

- [member-list-table-spec.md](./member-list-table-spec.md)  
- [persona.md](./persona.md)  

**Last updated:** 2026-04-21
