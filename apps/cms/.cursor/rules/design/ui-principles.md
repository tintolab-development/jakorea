---
priority: high
always_include: true
category: design
---

# Shared UI principles

**References:** [MVP_ROADMAP_V4_DETAILED.md](../../../docs/roadmap/MVP_ROADMAP_V4_DETAILED.md), [requirements progress](../../../docs/requirements-specification/progress.md)  
**Scope:** All user-facing CMS screens.

---

## Status copy

1. **Use full sentences**, not color/icon alone (Badge/Tag are secondary).  
2. **Show one primary state** for the current step; use `Timeline` for history.  
3. **Drive UI from enums/constants**, not ad-hoc strings.  
4. **Show `reason_public` verbatim** — do not rewrite.

---

## CTA

1. **At most one primary CTA** per view; tuck extras in menus.  
2. **Concrete labels** (“Submit report”) not vague (“Next step”).  
3. **Navigate with server `targetUrl`** when provided; hide CTA if no URL/action.

---

## Filters

For screens with an explicit **Search/Apply** pattern: **do not** live-filter on every keystroke; commit filter state on **Apply** (or equivalent) so behaviour matches admin list patterns.

---

## Copy / guidance

1. **Fixed copy** from API as-is (no summarizing).  
2. **Preserve order** of multi-line guidance.  
3. **Calm tone** — avoid alarming wording unless required.

---

## Modal body height

When a spec gives “body height”, it means **below header**, including **footer actions** (not header-only). Header is typically ~50px; total modal = header + body(incl. footer).

---

## Forbidden

1. **Infer or invent status** — only server-provided state.  
2. **Expose internal/admin fields** (`reason_internal`, logs, debug).  
3. **“Contact us” nudges** as default UX unless product requires it.  
4. **Multiple competing primary CTAs.**  
5. **Client-only eligibility** (e.g. derive “can apply” from dates without API).

```tsx
// Bad: client-derived eligibility
// Good: `applicationOpen` + `applicationUrl` from API
```

---

## Ant Design usage (summary)

- **Status:** Badge/Tag + sentence text.  
- **Primary action:** single `Button type="primary"`.  
- **Guidance:** `Alert` / `Typography`.  
- **Grouping:** `Card`, `Descriptions`, `Tabs`, `Timeline` as needed.

---

## Checklist

- [ ] Status as clear sentence; single current state  
- [ ] Enums/constants for branching; `reason_public` unchanged  
- [ ] One primary CTA; `targetUrl` respected  
- [ ] Filters use explicit apply if spec says so  
- [ ] No internal fields; no invented status  
- [ ] No client-only business rules contradicting API  

---

## Related

- [MVP_ROADMAP_V4_DETAILED.md](../../../docs/roadmap/MVP_ROADMAP_V4_DETAILED.md)  
- [requirements progress](../../../docs/requirements-specification/progress.md)  

**Last updated:** 2026-04-21
