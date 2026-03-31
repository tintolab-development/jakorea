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

## 커스터마이징

Ant Design 테마 커스터마이징은 `ConfigProvider`의 `theme` prop을 통해 설정합니다.
전역 스타일은 `src/index.css`에서 관리합니다.

## 관련 규칙

- [커스텀 SVG 아이콘](../design/svg-icons.md) — Ant Design에 없는 디자인 전용 SVG는 `shared/ui/icons`에서 관리
- [UI 원칙](../design/ui-principles.md)
- [컴포넌트 패턴](../coding/component-patterns.md)
- [이벤트 처리](../design/event-handling.md)

