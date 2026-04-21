---
priority: high
always_include: true
category: libraries
---

# Ant Design usage

Reference upstream docs: https://ant.design/docs/react/introduce  

CMS copy is **Korean**; locale wiring follows project defaults.

## Typical imports

```tsx
import { Button, Card, Form, Input, Table } from 'antd'
```

## `CmsCheckbox`

For admin forms, prefer **`CmsCheckbox` / `CmsCheckbox.Group`** from `@/shared/ui/cms-checkbox` instead of raw Ant `Checkbox`.

- Default visual size: `checkboxSize="large"` unless design specifies `medium` for dense rows.

```tsx
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'

<CmsCheckbox checkboxSize="large">Label</CmsCheckbox>
```

## Theming

Customize via `ConfigProvider` `theme`; global CSS entry: `src/index.css`.

## Modals

Center modals to the **viewport** — [modal-viewport-centering.md](../design/modal-viewport-centering.md).

## Related

- [svg-icons.md](../design/svg-icons.md)  
- [ui-principles.md](../design/ui-principles.md)  
- [component-patterns.md](../coding/component-patterns.md)  
- [admin-notice-form-modal-spec.md](../process/admin-notice-form-modal-spec.md)  

**Last updated:** 2026-04-21
