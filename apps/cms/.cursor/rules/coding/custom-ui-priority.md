---
priority: critical
always_include: true
category: coding
---

# Prefer shared CMS controls (`Cms*`)

For **new or touched** UI in `apps/cms/src/**`, prefer components under `shared/ui` instead of raw Ant controls when equivalents exist.

## Mandatory

1. If `shared/ui` provides a control for the job, **do not** drop raw Ant `Button`, `Input`, `Select`, `Radio`, `Checkbox`, `Switch`, `DatePicker` in new code.  
2. Standard replacements include **`CmsInput`, `CmsSelect`, `CmsRadio(Group)`, `CmsCheckbox`, `CmsToggle`, `CmsDatePicker`, `CmsDateRangePicker`, `CmsButton`**.  
3. Do **not** introduce new `AppButton` usage in CMS—migrate to `CmsButton` when editing legacy files.  
4. Avoid importing **other features’ CSS** into new components for styling shortcuts.  
5. Prefer **`StatusDisplay` / status badges** over bare `Tag` walls for state.  
6. For member-style forms, prefer **`DetailInfoForm`** patterns where applicable.

## Exceptions

Only when no shared wrapper exists **and** extending it is out of scope—leave:

```tsx
// TODO(custom-ui): Ant fallback until shared wrapper exists.
```

## Scope

All new pages/modals/filters; any edit that adds inputs must follow the same rule.

**Last updated:** 2026-04-21
