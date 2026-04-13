---
priority: high
always_include: true
category: libraries
---

# Ant Design 사용법

## 기본 설정

UI 컴포넌트는 **Ant Design** 기반으로 구현합니다.
Ant Design 공식 문서를 참고하여 사용합니다: https://ant.design/docs/react/introduce
한국어만 지원하므로 별도의 Locale 관리가 필요 없습니다.

## 사용 예시

```tsx
import { Button, Card, Form, Input, Table } from 'antd'

function MyComponent() {
  return (
    <Card>
      <Form>
        <Form.Item name="name" label="이름">
          <Input />
        </Form.Item>
        <Button type="primary">제출</Button>
      </Form>
    </Card>
  )
}
```

## CMS 체크박스 (`CmsCheckbox`)

폼·상세 편집 등 CMS 화면에서는 `antd`의 `Checkbox` 대신 **`@/shared/ui/cms-checkbox`** 의 `CmsCheckbox` / `CmsCheckbox.Group`을 사용한다.

- **사이즈**: **`checkboxSize="large"`** 를 기본으로 한다. (`CmsCheckbox` 컴포넌트 기본값도 `large`이나, 코드에서 의도를 드러내려면 명시해도 된다.)
- **`medium`**: 디자인/기획에서 좁은 행·보조 옵션 등으로 지정한 경우에만 사용한다.

```tsx
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'

<CmsCheckbox checkboxSize="large">라벨</CmsCheckbox>
<CmsCheckbox.Group checkboxSize="large" options={['a', 'b']} />
```

## 커스터마이징

Ant Design 테마 커스터마이징은 `ConfigProvider`의 `theme` prop을 통해 설정합니다.
전역 스타일은 `src/index.css`에서 관리합니다.

## 관련 규칙

- [커스텀 SVG 아이콘](../design/svg-icons.md) — Ant Design에 없는 디자인 전용 SVG는 `shared/ui/icons`에서 관리
- [UI 원칙](../design/ui-principles.md)
- [컴포넌트 패턴](../coding/component-patterns.md)
- [이벤트 처리](../design/event-handling.md)

