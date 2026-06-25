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

## Button `loading`

**`loading` 시 텍스트·아이콘 없이 스피너만** 표시한다. 전역 CSS(`button-loading-only.css`)가 raw `Button`에도 적용된다.

- CMS 스타일 버튼: `CmsButton`, `AppButton`, `ExcelButton`
- antd 기본 스타일·auth 폼: `LoadingButton` (`@/shared/ui/loading-button`)
- 상세: [button-loading-only.mdc](../design/button-loading-only.mdc)

## `CmsCheckbox`

For admin forms, prefer **`CmsCheckbox` / `CmsCheckbox.Group`** from `@/shared/ui/cms-checkbox` instead of raw Ant `Checkbox`.

- Default visual size: `checkboxSize="large"` unless design specifies `medium` for dense rows.

```tsx
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'

<CmsCheckbox checkboxSize="large">Label</CmsCheckbox>
```

## `CmsRadio`

Prefer **`CmsRadio` / `CmsRadio.Group` / `CmsRadio.Button`** from `@/shared/ui` (or `@/shared/ui/cms-radio`) instead of raw Ant `Radio`.

- Group `size`: `large` (default) | `medium` for dense rows.
- Segmented list/calendar toggles may use `CmsRadio.Button` or `SegmentedTab` per screen spec.

```tsx
import { CmsRadio } from '@/shared/ui'

<CmsRadio.Group value={value} onChange={e => setValue(e.target.value)}>
  <CmsRadio value="a">옵션 A</CmsRadio>
  <CmsRadio value="b">옵션 B</CmsRadio>
</CmsRadio.Group>
```

## Theming

Customize via `ConfigProvider` `theme`; global CSS entry: `src/index.css`.

## Toast (`message`)

**CMS에서 `antd` `message`·`App.useApp().message`·토스트 헬퍼 사용 금지.** [no-antd-message.mdc](./no-antd-message.mdc) — 확인·안내는 모달·인라인 UI 우선.

## Modals

Center modals to the **viewport** — [modal-viewport-centering.md](../design/modal-viewport-centering.md).

단일 확인 안내(세션 만료·선택 안내 등)는 공통 **[CMS Alert 모달](./cms-alert-modal.md)** (`useCmsAlert` / `cmsAlertModal`)을 우선 검토합니다.

## Related

- [svg-icons.md](../design/svg-icons.md)  
- [ui-principles.md](../design/ui-principles.md)  
- [component-patterns.md](../coding/component-patterns.md)  
- [admin-notice-form-modal-spec.md](../process/admin-notice-form-modal-spec.md)  
- [cms-alert-modal.md](./cms-alert-modal.md)  

**Last updated:** 2026-06-25
