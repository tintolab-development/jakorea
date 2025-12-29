---
priority: medium
always_include: false
category: state
---

# 상태 관리

## Zustand 사용

전역 상태는 **Zustand**를 사용합니다.
각 Feature별로 스토어를 분리합니다.

## 스토어 구조

```typescript
// features/instructor/model/instructor-store.ts
import { create } from 'zustand'

interface InstructorState {
  instructors: Instructor[]
  selectedInstructor: Instructor | null
  setInstructors: (instructors: Instructor[]) => void
  setSelectedInstructor: (instructor: Instructor | null) => void
}

export const useInstructorStore = create<InstructorState>(set => ({
  instructors: [],
  selectedInstructor: null,
  setInstructors: instructors => set({ instructors }),
  setSelectedInstructor: instructor => set({ selectedInstructor: instructor }),
}))
```

## 로컬 상태

컴포넌트 내부 상태는 `useState` 또는 `useReducer`를 사용합니다.
전역 상태가 필요한 경우에만 Zustand를 사용합니다.

## 관련 규칙

- [Custom Hooks](../coding/custom-hooks.md)
- [FSD 구조](../architecture/fsd-structure.md)

