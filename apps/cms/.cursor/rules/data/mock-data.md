---
priority: medium
always_include: false
category: data
---

# Mock 데이터 관리

## Mock 데이터 구조

`entities/*/api/` 디렉토리에 Mock 서비스를 관리합니다.
각 엔티티별로 Mock 서비스를 제공합니다.

## Mock 서비스 예시

```typescript
// entities/instructor/api/instructor-service.ts
import { Instructor } from '../model/types'

const mockInstructors: Instructor[] = [
  // ... Mock 데이터
]

export const instructorService = {
  getAll: async (): Promise<Instructor[]> => {
    return Promise.resolve(mockInstructors)
  },
  getById: async (id: string): Promise<Instructor> => {
    const instructor = mockInstructors.find(i => i.id === id)
    if (!instructor) throw new Error('Not found')
    return Promise.resolve(instructor)
  },
  create: async (data: Omit<Instructor, 'id'>): Promise<Instructor> => {
    const newInstructor = { ...data, id: Date.now().toString() }
    mockInstructors.push(newInstructor)
    return Promise.resolve(newInstructor)
  },
}
```

## 데이터 일관성

관계형 데이터의 일관성을 유지합니다.

### 예시

- 프로그램 삭제 시 관련 신청도 함께 처리
- 엔티티 간 참조 무결성 유지

## 관련 규칙

- [API 명세](./api-spec-mock.md)
- [FSD 구조](../architecture/fsd-structure.md)

