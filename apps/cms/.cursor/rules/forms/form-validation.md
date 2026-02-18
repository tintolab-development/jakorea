---
priority: medium
always_include: false
category: forms
---

# 폼 검증

## 프로젝트 규칙: 모든 폼은 React Hook Form으로 관리

- 새로 작성하는 **모든 폼**은 **react-hook-form** 라이브러리로 상태를 관리한다.
- Ant Design `Form`을 레이아웃용으로 쓸 수 있으나, 값·제출·검증은 `useForm`(react-hook-form)으로 처리한다.

## React Hook Form + Zod

폼 관리는 **React Hook Form**을 사용합니다.
스키마 검증은 **Zod**를 사용합니다.

## 폼 구조 예시

```typescript
// features/instructor/ui/instructor-form.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, Input, Button } from 'antd'

const instructorSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('올바른 이메일을 입력해주세요'),
})

type InstructorFormData = z.infer<typeof instructorSchema>

function InstructorForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<InstructorFormData>({
    resolver: zodResolver(instructorSchema),
  })

  const onSubmit = (data: InstructorFormData) => {
    // 제출 로직
  }

  return (
    <Form onFinish={handleSubmit(onSubmit)}>
      <Form.Item label="이름" help={errors.name?.message}>
        <Input {...register('name')} />
      </Form.Item>
      <Button type="primary" htmlType="submit">제출</Button>
    </Form>
  )
}
```

## 스키마 위치

스키마는 `features/*/model/schema.ts` 또는 `entities/*/model/schema.ts`에 정의합니다.

## 관련 규칙

- [컴포넌트 패턴](../coding/component-patterns.md)
- [이벤트 처리](../design/event-handling.md)
