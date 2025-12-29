---
priority: medium
always_include: false
category: architecture
---

# 라우팅

## React Router 설정

`app/router/` 디렉토리에 라우팅 설정을 관리합니다.
중첩 라우팅을 활용하여 레이아웃을 공유합니다.

## 라우팅 구조 예시

```typescript
// app/router/index.tsx
import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/widgets/layout'
import { Dashboard } from '@/pages/dashboard'
import { InstructorsList } from '@/pages/instructors/instructor-list-page'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'instructors', element: <InstructorsList /> },
    ],
  },
])
```

## 라우트 네이밍 규칙

### 표준 패턴

- **목록**: `/instructors`
- **상세**: `/instructors/:id`
- **생성**: `/instructors/new`
- **수정**: `/instructors/:id/edit`

### 예시

```
/instructors              # 강사 목록
/instructors/new          # 강사 등록
/instructors/:id          # 강사 상세
/instructors/:id/edit     # 강사 수정
/programs                 # 프로그램 목록
/programs/:id           # 프로그램 상세
```

## 관련 규칙

- [FSD 구조](./fsd-structure.md)
- [테이블 관리](../tables/table-management.md) - Query Parameter 동기화

