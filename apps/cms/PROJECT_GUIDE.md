# Automation 프로젝트 가이드

JAKorea CMS (Automation) 프로젝트 개발 가이드입니다.

## 📋 목차

1. [코드 스타일](#1-코드-스타일)
2. [프로젝트 구조 (FSD)](#2-프로젝트-구조-fsd)
3. [Ant Design System](#3-ant-design-system)
4. [브라우저 환경 및 반응형 디자인](#4-브라우저-환경-및-반응형-디자인)
5. [패키지 관리](#5-패키지-관리)
6. [개발 프로세스](#6-개발-프로세스)
7. [기술 스택](#7-기술-스택)
8. [상태 관리](#8-상태-관리)
9. [라우팅](#9-라우팅)
10. [Mock 데이터 관리](#10-mock-데이터-관리)
11. [폼 검증](#11-폼-검증)
12. [테이블 관리 및 필터링](#12-테이블-관리-및-필터링)
13. [공유 패키지 사용](#13-공유-패키지-사용)
14. [컴포넌트 관심사 분리 및 Custom Hooks](#14-컴포넌트-관심사-분리-및-custom-hooks)

---

## 1. 코드 스타일

### ESLint & Prettier

- 기존 `eslint`/`prettier` 설정을 그대로 공유합니다.
- Workspace 전체에서 `eslint .`와 `prettier --write .` 명령을 실행하면 모든 앱에 적용됩니다.
- 각 앱에서도 개별적으로 실행 가능합니다:
  ```bash
  pnpm --filter cms lint
  pnpm --filter cms format
  ```

### TypeScript

- **엄격한 타입 체크**: `strict: true` 모드 사용
- 모든 컴포넌트와 함수는 TypeScript로 작성합니다.
- 타입 정의는 `types/` 디렉토리에 도메인별로 관리합니다.
- 타입 체크:
  ```bash
  pnpm --filter cms typecheck
  ```

### 파일 네이밍 규칙

- **파일명은 케밥케이스(kebab-case)를 사용**합니다.
- 예시:
  - ✅ `dashboard.tsx`, `instructor-list.tsx`, `layout.tsx`
  - ❌ `Dashboard.tsx`, `InstructorList.tsx`, `Layout.tsx`
- 컴포넌트 파일, 페이지 파일, 유틸리티 파일 모두 케밥케이스 사용
- CSS 파일도 케밥케이스 사용: `layout.css`, `header.css`
- 디렉토리명도 케밥케이스 사용: `instructor-list/`, `program-detail/`

**예외**:

- `index.ts`, `index.tsx`는 예외적으로 허용 (디렉토리 진입점)

---

## 2. 프로젝트 구조 (FSD)

Feature-Sliced Design (FSD) 아키텍처를 적용합니다.

### 디렉토리 구조

```
src/
├── app/              # 앱 초기화, 라우팅, 프로바이더
│   ├── providers/    # 전역 프로바이더 (ConfigProvider 등)
│   └── router/       # 라우팅 설정
├── widgets/          # 복합 UI 블록 (레이아웃, 헤더, 사이드바 등)
│   └── layout/       # 레이아웃 위젯
├── features/         # 비즈니스 기능 단위
│   ├── instructor/   # 강사 관리 기능
│   │   ├── ui/       # UI 컴포넌트
│   │   ├── model/    # 상태 관리 (Zustand)
│   │   ├── api/      # API 호출 (Mock 서비스)
│   │   └── lib/      # 유틸리티 함수
│   ├── program/      # 프로그램 관리 기능
│   ├── application/  # 신청 관리 기능
│   └── ...
├── entities/         # 비즈니스 엔티티 (도메인 모델)
│   ├── instructor/   # 강사 엔티티
│   │   ├── model/    # 타입 정의
│   │   └── api/      # 엔티티별 API
│   └── ...
├── shared/           # 공유 리소스
│   ├── ui/           # 공통 UI 컴포넌트
│   ├── lib/          # 유틸리티 함수
│   ├── hooks/        # 공통 훅
│   └── constants/    # 상수
└── pages/            # 페이지 컴포넌트 (라우트별)
    ├── Dashboard.tsx
    ├── instructors/
    └── ...
```

### 계층별 책임

- **app**: 앱 초기화, 전역 설정, 라우팅
- **widgets**: 복합 UI 블록 (레이아웃, 헤더 등)
- **features**: 비즈니스 기능 단위 (CRUD, 필터링 등)
- **entities**: 도메인 엔티티 (타입, API)
- **shared**: 재사용 가능한 공통 리소스
- **pages**: 라우트별 페이지 컴포넌트

### 컴포넌트 구조 원칙

- 컴포넌트는 기능(Feature) 단위로 묶습니다.
- 레이아웃/틀은 `features/*/ui`에서 정의합니다.
- 공통 컴포넌트는 `shared/ui`에 배치합니다.

---

## 3. Ant Design System

### 기본 설정

- UI 컴포넌트는 **Ant Design** 기반으로 구현합니다.
- Ant Design 공식 문서를 참고하여 사용합니다: https://ant.design/docs/react/introduce
- 한국어만 지원하므로 별도의 Locale 관리가 필요 없습니다.

### 사용 예시

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

### 커스터마이징

- Ant Design 테마 커스터마이징은 `ConfigProvider`의 `theme` prop을 통해 설정합니다.
- 전역 스타일은 `src/index.css`에서 관리합니다.

---

## 4. 브라우저 환경 및 반응형 디자인

### 지원 브라우저

- Chrome (최신 2개 버전)
- Firefox (최신 2개 버전)
- Safari (최신 2개 버전)
- Edge (최신 2개 버전)

### 반응형 디자인

- **최소 1920 x 1080 데스크탑 환경만 고려**합니다.
- 모바일 및 태블릿 환경은 지원하지 않습니다.
- 반응형 디자인은 구현하지 않으며, 고정 레이아웃으로 개발합니다.

### 레이아웃 가이드

- 최소 해상도: 1920px x 1080px
- 컨텐츠 영역: 중앙 정렬 또는 좌측 정렬
- 고정 너비 레이아웃 사용 (반응형 미디어 쿼리 사용 안 함)

---

## 5. 패키지 관리

### pnpm Workspace

- 루트에 `pnpm-workspace.yaml`을 두고 `apps/*`와 `packages/*`를 포함합니다.
- 각 앱은 별도의 `package.json`을 가지고 있습니다.
- `pnpm install`은 루트에서 한 번 실행하면 모든 워크스페이스에 적용됩니다.

### 공유 패키지

- `@jakorea/ui`: 공유 UI 컴포넌트
- `@jakorea/utils`: 공유 유틸리티 함수

### 의존성 설치

```bash
# 루트에서 전체 설치
pnpm install

# 특정 앱에만 의존성 추가
pnpm --filter cms add <package-name>
```

---

## 6. 개발 프로세스

### Phase별 개발 프로세스

각 Phase는 다음 순서로 진행됩니다:

1. **기획 단계**
   - 시니어 기획자와 요구사항 정의
   - 기능 명세서 작성
   - 사용자 시나리오 정의

2. **디자인 단계**
   - 시니어 UX/UI 디자이너와 디자인 검토
   - Ant Design 컴포넌트 활용 방안 논의
   - 디자인 시스템 확정

3. **개발 단계**
   - 시니어 개발자와 기술 검토
   - 구현 계획 수립
   - 코드 리뷰 및 피드백

4. **검증 단계**
   - PM과 함께 기능 검증
   - 사용자 시나리오 테스트
   - 버그 수정 및 개선

### 역할별 책임

- **시니어 개발자**: 기술 아키텍처, 코드 리뷰, 성능 최적화
- **시니어 UX/UI 디자이너**: 디자인 시스템, 사용자 경험 개선
- **시니어 기획자**: 요구사항 정의, 비즈니스 로직 검증
- **PM**: 일정 관리, 우선순위 결정, 의사결정

### 개발 워크플로우

1. Phase별 작업 계획 수립
2. 기획/디자인/개발 단계별 소통
3. 기능 구현 및 테스트
4. 코드 리뷰 및 개선
5. 다음 Phase로 진행

---

## 7. 기술 스택

### 핵심 기술

- **React 19**: UI 라이브러리
- **TypeScript**: 타입 안정성
- **Vite**: 빌드 도구
- **Ant Design 5**: UI 컴포넌트 라이브러리
- **React Router**: 라우팅
- **Zustand**: 상태 관리
- **React Hook Form**: 폼 관리
- **Zod**: 스키마 검증
- **@tanstack/react-table**: 테이블 관리 및 필터링

### 개발 도구

- **ESLint**: 코드 린팅
- **Prettier**: 코드 포맷팅
- **Turbo**: 모노레포 빌드 시스템

---

## 8. 상태 관리

### Zustand 사용

- 전역 상태는 **Zustand**를 사용합니다.
- 각 Feature별로 스토어를 분리합니다.

### 스토어 구조

```typescript
// features/instructor/model/instructorStore.ts
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

### 로컬 상태

- 컴포넌트 내부 상태는 `useState` 또는 `useReducer`를 사용합니다.
- 전역 상태가 필요한 경우에만 Zustand를 사용합니다.

---

## 9. 라우팅

### React Router 설정

- `app/router/` 디렉토리에 라우팅 설정을 관리합니다.
- 중첩 라우팅을 활용하여 레이아웃을 공유합니다.

### 라우팅 구조 예시

```typescript
// app/router/index.tsx
import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/widgets/layout'
import { Dashboard } from '@/pages/Dashboard'
import { InstructorsList } from '@/pages/instructors/InstructorsList'

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

### 라우트 네이밍

- 목록: `/instructors`
- 상세: `/instructors/:id`
- 생성: `/instructors/new`
- 수정: `/instructors/:id/edit`

---

## 10. Mock 데이터 관리

### Mock 데이터 구조

- `entities/*/api/mock/` 디렉토리에 Mock 데이터를 관리합니다.
- 각 엔티티별로 Mock 서비스를 제공합니다.

### Mock 서비스 예시

```typescript
// entities/instructor/api/mock/instructorService.ts
import { Instructor } from '../../model/types'

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

### 데이터 일관성

- 관계형 데이터의 일관성을 유지합니다.
- 예: 프로그램 삭제 시 관련 신청도 함께 처리

---

## 11. 폼 검증

### React Hook Form + Zod

- 폼 관리는 **React Hook Form**을 사용합니다.
- 스키마 검증은 **Zod**를 사용합니다.

### 폼 구조 예시

```typescript
// features/instructor/ui/InstructorForm.tsx
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

### 스키마 위치

- 스키마는 `features/*/model/schema.ts` 또는 `entities/*/model/schema.ts`에 정의합니다.

---

## 12. 테이블 관리 및 필터링

### @tanstack/react-table 사용

테이블 관리 및 필터링은 **@tanstack/react-table** 라이브러리를 사용합니다.

#### 기본 설정

```typescript
// features/instructor/ui/InstructorTable.tsx
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, ColumnDef } from '@tanstack/react-table'
import { Table } from 'antd'
import { Instructor } from '../../model/types'

const columns: ColumnDef<Instructor>[] = [
  {
    accessorKey: 'name',
    header: '이름',
  },
  {
    accessorKey: 'email',
    header: '이메일',
  },
  {
    accessorKey: 'region',
    header: '지역',
  },
]

function InstructorTable({ data }: { data: Instructor[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Table
      dataSource={table.getRowModel().rows.map(row => row.original)}
      columns={columns}
      pagination={{
        current: table.getState().pagination.pageIndex + 1,
        pageSize: table.getState().pagination.pageSize,
        total: table.getFilteredRowModel().rows.length,
        onChange: (page, pageSize) => {
          table.setPageIndex(page - 1)
          table.setPageSize(pageSize)
        },
      }}
    />
  )
}
```

#### 필터링 기능

```typescript
// features/instructor/ui/InstructorTable.tsx
import { useReactTable, ColumnFiltersState, getCoreRowModel, getFilteredRowModel } from '@tanstack/react-table'
import { useState } from 'react'
import { Input, Table } from 'antd'

function InstructorTable({ data }: { data: Instructor[] }) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div>
      <Input
        placeholder="이름 검색"
        value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
        onChange={e => table.getColumn('name')?.setFilterValue(e.target.value)}
      />
      <Table dataSource={table.getRowModel().rows.map(row => row.original)} />
    </div>
  )
}
```

---

### 라우트와 Query Parameter 동기화

테이블 필터 상태를 URL의 query parameter와 동기화하여 브라우저 뒤로가기/앞으로가기, 북마크, 공유 기능을 지원합니다.

#### useQueryParams Hook 생성

```typescript
// shared/hooks/useQueryParams.ts
import { useSearchParams } from 'react-router-dom'
import { useCallback, useMemo } from 'react'

export function useQueryParams<T extends Record<string, string>>() {
  const [searchParams, setSearchParams] = useSearchParams()

  const params = useMemo(() => {
    const result = {} as T
    searchParams.forEach((value, key) => {
      result[key as keyof T] = value as T[keyof T]
    })
    return result
  }, [searchParams])

  const setParam = useCallback(
    (key: keyof T, value: string | null) => {
      const newParams = new URLSearchParams(searchParams)
      if (value === null || value === '') {
        newParams.delete(key as string)
      } else {
        newParams.set(key as string, value)
      }
      setSearchParams(newParams, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const setParams = useCallback(
    (updates: Partial<T>) => {
      const newParams = new URLSearchParams(searchParams)
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') {
          newParams.delete(key)
        } else {
          newParams.set(key, value)
        }
      })
      setSearchParams(newParams, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  const clearParams = useCallback(() => {
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  return { params, setParam, setParams, clearParams }
}
```

#### 테이블 필터와 Query Parameter 동기화

```typescript
// features/instructor/ui/InstructorList.tsx
import { useReactTable, ColumnFiltersState, PaginationState, getCoreRowModel, getFilteredRowModel, getPaginationRowModel } from '@tanstack/react-table'
import { useQueryParams } from '@/shared/hooks/useQueryParams'
import { useState, useEffect, useMemo } from 'react'
import { Input, Select, Table } from 'antd'

const { Option } = Select

interface InstructorListFilters {
  name?: string
  region?: string
  status?: string
}

function InstructorList() {
  const { params, setParams } = useQueryParams<InstructorListFilters & { page?: string; pageSize?: string }>()

  // Query Parameter에서 초기 필터 상태 복원
  const initialFilters: ColumnFiltersState = useMemo(() => {
    const filters: ColumnFiltersState = []
    if (params.name) {
      filters.push({ id: 'name', value: params.name })
    }
    if (params.region) {
      filters.push({ id: 'region', value: params.region })
    }
    if (params.status) {
      filters.push({ id: 'status', value: params.status })
    }
    return filters
  }, [params.name, params.region, params.status])

  const initialPagination: PaginationState = useMemo(
    () => ({
      pageIndex: params.page ? parseInt(params.page) - 1 : 0,
      pageSize: params.pageSize ? parseInt(params.pageSize) : 10,
    }),
    [params.page, params.pageSize]
  )

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialFilters)
  const [pagination, setPagination] = useState<PaginationState>(initialPagination)

  // 필터 변경 시 Query Parameter 업데이트
  useEffect(() => {
    const filterParams: Partial<InstructorListFilters> = {}
    columnFilters.forEach(filter => {
      if (filter.value) {
        filterParams[filter.id as keyof InstructorListFilters] = filter.value as string
      }
    })
    setParams({
      ...filterParams,
      page: pagination.pageIndex > 0 ? String(pagination.pageIndex + 1) : null,
      pageSize: pagination.pageSize !== 10 ? String(pagination.pageSize) : null,
    })
  }, [columnFilters, pagination, setParams])

  const table = useReactTable({
    data: instructors,
    columns,
    state: {
      columnFilters,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div>
      <Input
        placeholder="이름 검색"
        value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
        onChange={e => table.getColumn('name')?.setFilterValue(e.target.value)}
      />
      <Select
        placeholder="지역 선택"
        value={table.getColumn('region')?.getFilterValue() as string}
        onChange={value => table.getColumn('region')?.setFilterValue(value)}
      >
        <Option value="서울">서울</Option>
        <Option value="부산">부산</Option>
      </Select>
      <Table
        dataSource={table.getRowModel().rows.map(row => row.original)}
        pagination={{
          current: pagination.pageIndex + 1,
          pageSize: pagination.pageSize,
          total: table.getFilteredRowModel().rows.length,
          onChange: (page, pageSize) => {
            setPagination(prev => ({
              ...prev,
              pageIndex: page - 1,
              pageSize: pageSize || prev.pageSize,
            }))
          },
        }}
      />
    </div>
  )
}
```

#### Custom Hook으로 추상화

```typescript
// features/instructor/model/useInstructorTable.ts
import {
  useReactTable,
  ColumnFiltersState,
  PaginationState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'
import { useQueryParams } from '@/shared/hooks/useQueryParams'
import { useState, useEffect, useMemo } from 'react'
import { Instructor } from '../../model/types'

interface InstructorTableFilters {
  name?: string
  region?: string
  status?: string
}

export function useInstructorTable(data: Instructor[]) {
  const { params, setParams } = useQueryParams<
    InstructorTableFilters & { page?: string; pageSize?: string }
  >()

  // Query Parameter에서 초기 상태 복원
  const initialFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    if (params.name) filters.push({ id: 'name', value: params.name })
    if (params.region) filters.push({ id: 'region', value: params.region })
    if (params.status) filters.push({ id: 'status', value: params.status })
    return filters
  }, [params.name, params.region, params.status])

  const initialPagination = useMemo<PaginationState>(
    () => ({
      pageIndex: params.page ? parseInt(params.page) - 1 : 0,
      pageSize: params.pageSize ? parseInt(params.pageSize) : 10,
    }),
    [params.page, params.pageSize]
  )

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialFilters)
  const [pagination, setPagination] = useState<PaginationState>(initialPagination)

  // 상태 변경 시 Query Parameter 동기화
  useEffect(() => {
    const filterParams: Partial<InstructorTableFilters> = {}
    columnFilters.forEach(filter => {
      if (filter.value) {
        filterParams[filter.id as keyof InstructorTableFilters] = filter.value as string
      }
    })

    setParams({
      ...filterParams,
      page: pagination.pageIndex > 0 ? String(pagination.pageIndex + 1) : null,
      pageSize: pagination.pageSize !== 10 ? String(pagination.pageSize) : null,
    })
  }, [columnFilters, pagination, setParams])

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      pagination,
    },
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return { table, columnFilters, pagination }
}
```

#### 사용 예시

```typescript
// features/instructor/ui/InstructorList.tsx
function InstructorList() {
  const { instructors, loading } = useInstructorList()
  const { table } = useInstructorTable(instructors)

  return (
    <div>
      <Input
        placeholder="이름 검색"
        value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
        onChange={e => table.getColumn('name')?.setFilterValue(e.target.value)}
      />
      <Table
        dataSource={table.getRowModel().rows.map(row => row.original)}
        loading={loading}
        pagination={{
          current: table.getState().pagination.pageIndex + 1,
          pageSize: table.getState().pagination.pageSize,
          total: table.getFilteredRowModel().rows.length,
          onChange: (page, pageSize) => {
            table.setPageIndex(page - 1)
            table.setPageSize(pageSize)
          },
        }}
      />
    </div>
  )
}
```

#### 주의사항

1. **replace 옵션 사용**: `setSearchParams`에 `{ replace: true }` 옵션을 사용하여 브라우저 히스토리에 불필요한 항목이 쌓이지 않도록 합니다.

2. **초기값 처리**: Query Parameter가 없을 때는 기본값을 사용하고, URL에 반영하지 않습니다.

3. **타입 안정성**: Query Parameter의 타입을 명확히 정의하여 타입 안정성을 보장합니다.

4. **성능 최적화**: `useMemo`와 `useCallback`을 활용하여 불필요한 재계산을 방지합니다.

---

## 13. 공유 패키지 사용

### @jakorea/ui

- 공유 UI 컴포넌트를 사용합니다.
- 예: `Button`, `TextField` 등

```typescript
import { Button } from '@jakorea/ui'

<Button variant="primary">클릭</Button>
```

### @jakorea/utils

- 공유 유틸리티 함수를 사용합니다.
- 예: 날짜 포맷팅, 문자열 처리 등

```typescript
import { formatDate, timeSince } from '@jakorea/utils'

const formatted = formatDate(new Date())
const relative = timeSince(new Date())
```

---

## 13. 컴포넌트 관심사 분리 및 Custom Hooks

### 컴포넌트 관심사 분리 원칙

#### 단일 책임 원칙 (Single Responsibility Principle)

각 컴포넌트는 하나의 명확한 책임만 가져야 합니다.

**❌ 나쁜 예시: 모든 로직이 한 컴포넌트에 집중**

```tsx
// features/instructor/ui/InstructorList.tsx
function InstructorList() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ name: '', region: '' })
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 })

  useEffect(() => {
    setLoading(true)
    instructorService
      .getAll()
      .then(data => {
        // 필터링 로직
        const filtered = data.filter(inst => {
          if (filters.name && !inst.name.includes(filters.name)) return false
          if (filters.region && inst.region !== filters.region) return false
          return true
        })
        // 페이지네이션 로직
        const start = (pagination.page - 1) * pagination.pageSize
        const end = start + pagination.pageSize
        setInstructors(filtered.slice(start, end))
      })
      .finally(() => setLoading(false))
  }, [filters, pagination])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  return (
    <div>
      {/* 필터 UI */}
      {/* 테이블 UI */}
      {/* 페이지네이션 UI */}
    </div>
  )
}
```

**✅ 좋은 예시: 관심사 분리**

```tsx
// features/instructor/ui/InstructorList.tsx (Presentational)
interface InstructorListProps {
  instructors: Instructor[]
  loading: boolean
  filters: InstructorFilters
  pagination: PaginationState
  onFilterChange: (filters: InstructorFilters) => void
  onPaginationChange: (pagination: PaginationState) => void
}

function InstructorList({
  instructors,
  loading,
  filters,
  pagination,
  onFilterChange,
  onPaginationChange,
}: InstructorListProps) {
  return (
    <div>
      <InstructorFilters filters={filters} onChange={onFilterChange} />
      <InstructorTable data={instructors} loading={loading} />
      <Pagination
        current={pagination.page}
        pageSize={pagination.pageSize}
        onChange={onPaginationChange}
      />
    </div>
  )
}

// features/instructor/ui/InstructorListContainer.tsx (Container)
function InstructorListContainer() {
  const { instructors, loading, filters, pagination, setFilters, setPagination } =
    useInstructorList()

  return (
    <InstructorList
      instructors={instructors}
      loading={loading}
      filters={filters}
      pagination={pagination}
      onFilterChange={setFilters}
      onPaginationChange={setPagination}
    />
  )
}
```

#### Presentational vs Container 패턴

- **Presentational 컴포넌트**: UI 렌더링에만 집중, props로 데이터와 핸들러를 받음
- **Container 컴포넌트**: 데이터 페칭, 상태 관리, 비즈니스 로직 처리

#### UI 로직과 비즈니스 로직 분리

```tsx
// ❌ 나쁜 예시: UI와 비즈니스 로직이 섞임
function InstructorForm() {
  const [formData, setFormData] = useState({})
  const [errors, setErrors] = useState({})

  const validate = () => {
    // 검증 로직
    if (!formData.name) {
      setErrors({ ...errors, name: '이름을 입력해주세요' })
      return false
    }
    // ... 더 많은 검증
  }

  const handleSubmit = async () => {
    if (!validate()) return
    await instructorService.create(formData)
    // 성공 처리
  }

  return <Form>...</Form>
}

// ✅ 좋은 예시: 로직을 Custom Hook으로 분리
function InstructorForm() {
  const { formData, errors, handleChange, handleSubmit } = useInstructorForm()

  return (
    <Form onFinish={handleSubmit}>
      <Form.Item label="이름" validateStatus={errors.name ? 'error' : ''} help={errors.name}>
        <Input value={formData.name} onChange={e => handleChange('name', e.target.value)} />
      </Form.Item>
    </Form>
  )
}
```

---

### Custom Hooks 작성 가이드

#### 관심사 분리 원칙

각 Custom Hook은 하나의 명확한 관심사만 다뤄야 합니다.

```tsx
// ✅ 좋은 예시: 데이터 페칭만 담당
// features/instructor/model/useInstructorList.ts
export function useInstructorList() {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    instructorService
      .getAll()
      .then(setInstructors)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  return { instructors, loading, error }
}

// ✅ 좋은 예시: 필터링만 담당
// features/instructor/model/useInstructorFilters.ts
export function useInstructorFilters() {
  const [filters, setFilters] = useState<InstructorFilters>({
    name: '',
    region: '',
  })

  const updateFilter = useCallback((key: keyof InstructorFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({ name: '', region: '' })
  }, [])

  return { filters, updateFilter, resetFilters }
}

// ✅ 좋은 예시: 페이지네이션만 담당
// shared/hooks/usePagination.ts
export function usePagination(initialPage = 1, initialPageSize = 10) {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)

  const reset = useCallback(() => {
    setPage(initialPage)
    setPageSize(initialPageSize)
  }, [initialPage, initialPageSize])

  return { page, pageSize, setPage, setPageSize, reset }
}
```

#### 의존성 관리

Hook의 의존성을 명확히 하고, 불필요한 재렌더링을 방지합니다.

```tsx
// ❌ 나쁜 예시: 의존성 누락, 불필요한 재렌더링
export function useInstructorList(filters: InstructorFilters) {
  const [instructors, setInstructors] = useState<Instructor[]>([])

  useEffect(() => {
    instructorService.getAll().then(data => {
      const filtered = data.filter(/* 필터링 로직 */)
      setInstructors(filtered)
    })
  }) // 의존성 배열 누락!

  return instructors
}

// ✅ 좋은 예시: 의존성 명시, 메모이제이션 활용
export function useInstructorList(filters: InstructorFilters) {
  const [instructors, setInstructors] = useState<Instructor[]>([])
  const [loading, setLoading] = useState(false)

  // 필터링 로직을 메모이제이션
  const filterInstructors = useCallback(
    (data: Instructor[]) => {
      return data.filter(inst => {
        if (filters.name && !inst.name.includes(filters.name)) return false
        if (filters.region && inst.region !== filters.region) return false
        return true
      })
    },
    [filters.name, filters.region] // 의존성 명시
  )

  useEffect(() => {
    setLoading(true)
    instructorService
      .getAll()
      .then(filterInstructors)
      .then(setInstructors)
      .finally(() => setLoading(false))
  }, [filterInstructors]) // 의존성 배열에 포함

  return { instructors, loading }
}
```

#### 재사용성 고려

범용적인 Hook은 `shared/hooks/`에 배치하고, Feature별 Hook은 `features/*/model/`에 배치합니다.

```tsx
// shared/hooks/useAsync.ts (범용 Hook)
interface UseAsyncOptions<T> {
  immediate?: boolean
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

export function useAsync<T>(asyncFn: () => Promise<T>, options: UseAsyncOptions<T> = {}) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await asyncFn()
      setData(result)
      options.onSuccess?.(result)
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      setError(error)
      options.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [asyncFn, options.onSuccess, options.onError])

  useEffect(() => {
    if (options.immediate !== false) {
      execute()
    }
  }, [execute, options.immediate])

  return { data, loading, error, execute }
}

// features/instructor/model/useInstructorList.ts (Feature별 Hook)
export function useInstructorList() {
  return useAsync(() => instructorService.getAll(), {
    immediate: true,
  })
}
```

#### 테스트 가능성

Hook을 독립적으로 테스트할 수 있도록 의존성을 주입 가능하게 만듭니다.

```tsx
// ✅ 좋은 예시: 의존성 주입 가능
// features/instructor/model/useInstructorList.ts
interface UseInstructorListOptions {
  service?: typeof instructorService
}

export function useInstructorList(options: UseInstructorListOptions = {}) {
  const service = options.service || instructorService
  const { data, loading, error, execute } = useAsync(() => service.getAll(), {
    immediate: true,
  })

  return {
    instructors: data || [],
    loading,
    error,
    refetch: execute,
  }
}

// 테스트 예시
describe('useInstructorList', () => {
  it('should fetch instructors', async () => {
    const mockService = {
      getAll: jest.fn().mockResolvedValue([{ id: '1', name: 'Test' }]),
    }

    const { result } = renderHook(() => useInstructorList({ service: mockService }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.instructors).toHaveLength(1)
  })
})
```

#### Hook 조합 (Composition)

여러 Hook을 조합하여 복잡한 로직을 구성합니다.

```tsx
// features/instructor/model/useInstructorListWithFilters.ts
export function useInstructorListWithFilters() {
  const { filters, updateFilter, resetFilters } = useInstructorFilters()
  const { page, pageSize, setPage, setPageSize } = usePagination()
  const { instructors, loading, error } = useInstructorList()

  // 필터링된 결과
  const filteredInstructors = useMemo(() => {
    return instructors.filter(inst => {
      if (filters.name && !inst.name.includes(filters.name)) return false
      if (filters.region && inst.region !== filters.region) return false
      return true
    })
  }, [instructors, filters])

  // 페이지네이션된 결과
  const paginatedInstructors = useMemo(() => {
    const start = (page - 1) * pageSize
    const end = start + pageSize
    return filteredInstructors.slice(start, end)
  }, [filteredInstructors, page, pageSize])

  // 필터 변경 시 첫 페이지로 리셋
  const handleFilterChange = useCallback(
    (key: keyof InstructorFilters, value: string) => {
      updateFilter(key, value)
      setPage(1)
    },
    [updateFilter, setPage]
  )

  return {
    instructors: paginatedInstructors,
    loading,
    error,
    filters,
    pagination: { page, pageSize, total: filteredInstructors.length },
    onFilterChange: handleFilterChange,
    onPaginationChange: { setPage, setPageSize },
    resetFilters,
  }
}
```

---

### Hook 작성 체크리스트

- [ ] 단일 책임 원칙을 따르는가?
- [ ] 의존성 배열이 올바르게 설정되었는가?
- [ ] 불필요한 재렌더링을 방지하기 위해 메모이제이션을 사용하는가?
- [ ] 테스트 가능하도록 의존성을 주입 가능하게 만들었는가?
- [ ] 재사용 가능한 Hook은 `shared/hooks/`에 배치했는가?
- [ ] Feature별 Hook은 `features/*/model/`에 배치했는가?
- [ ] 타입이 명확하게 정의되었는가?

---

## 📝 추가 참고사항

### 개발 서버 실행

```bash
# CMS 프로젝트 개발 서버 실행
pnpm --filter cms dev

# 또는 루트에서
pnpm cms
```

### 빌드

```bash
pnpm --filter cms build
```

### 타입 체크

```bash
pnpm --filter cms typecheck
```

### 린트

```bash
pnpm --filter cms lint
```

---

## 15. 진행 상황 관리

### PROGRESS.md 기록 규칙

프로젝트 진행 상황은 `apps/cms/PROGRESS.md`에 롤별로 기록합니다.

#### 기록 형식

각 작업 항목은 다음 형식으로 기록합니다:

```markdown
### [날짜] - [작업명]

**프롬프트/요청**:

- [요청 내용]

**결과**:

- ✅ [완료된 작업 1]
- ✅ [완료된 작업 2]

**롤별 역할**:

- 🎨 **디자이너**: [디자이너가 수행한 역할]
- 📋 **기획자**: [기획자가 수행한 역할]
- 👨‍💼 **PM**: [PM이 수행한 역할]
- 👨‍💻 **개발자**: [개발자가 수행한 역할]

**참고사항**:

- [추가 참고사항]
```

#### 기록 대상

- ✅ **기록 대상**: 디버깅을 제외한 모든 의미있는 프롬프트/요청
- ❌ **기록 제외**: 단순 디버깅, 오타 수정 등

#### 롤별 역할 정의

- **🎨 디자이너**: UI/UX 디자인, 디자인 시스템, 사용자 경험 개선
- **📋 기획자**: 요구사항 정의, 기능 명세서 작성, 사용자 시나리오 정의
- **👨‍💼 PM**: 일정 관리, 우선순위 결정, 의사결정, 팀 간 소통 조율
- **👨‍💻 개발자**: 코드 구현, 기술 아키텍처, 개발 환경 설정

#### 업데이트 주기

- 각 Phase 완료 시 업데이트
- 주요 마일스톤 달성 시 업데이트
- 의미있는 작업 완료 시 즉시 업데이트

---

## 16. Phase별 진행 브리핑

### Phase 시작 전 브리핑

각 Phase 시작 전, 다음 롤별로 브리핑을 진행합니다:

#### 🎨 디자이너 브리핑

- **작업 목표**: 해당 Phase에서 필요한 디자인 작업
- **주요 작업 내용**: 구체적인 디자인 작업 항목
- **제약사항**: 해상도, 언어, 디자인 시스템 등
- **산출물**: 디자인 시안, 스타일 가이드 등
- **예상 소요 시간**: 작업 예상 기간

#### 📋 기획자 브리핑

- **작업 목표**: 해당 Phase에서 필요한 기획 작업
- **주요 작업 내용**: 구체적인 기획 작업 항목
- **참고 문서**: 관련 문서 링크
- **산출물**: 기능 명세서, 사용자 시나리오 등
- **예상 소요 시간**: 작업 예상 기간

#### 👨‍💼 PM 브리핑

- **작업 목표**: 해당 Phase 일정 관리 및 의사결정
- **주요 의사결정 사항**: 승인이 필요한 항목
- **일정 관리**: 각 롤별 예상 소요 시간
- **체크포인트**: 주요 마일스톤
- **예상 소요 시간**: 전체 Phase 예상 기간

#### 👨‍💻 개발자 브리핑

- **작업 목표**: 해당 Phase에서 필요한 개발 작업
- **주요 작업 내용**: 구체적인 개발 작업 항목
- **준비사항**: 필요한 준비 작업
- **산출물**: 구현된 기능, 컴포넌트 등
- **예상 소요 시간**: 작업 예상 기간

### 브리핑 문서 위치

- Phase별 브리핑: `apps/cms/PHASE_X_BRIEFING.md`
- 진행 상황: `apps/cms/PROGRESS.md`

---

## 17. 이벤트 처리 가이드

### 이벤트 버블링 및 전파 방지

모든 컴포넌트에서 이벤트 버블링을 고려하여 `stopPropagation()`을 적절히 사용해야 합니다.

**주요 적용 규칙**:

1. **테이블 작업 컬럼**: 드롭다운 메뉴, 버튼, Popconfirm 등 모든 인터랙티브 요소에 `stopPropagation()` 적용
2. **폼 요소**: Select, Input, DatePicker, Radio.Group 등 onChange/onClick 이벤트 처리
3. **캘린더**: Calendar의 onSelect, onPanelChange, Radio.Group (월간/연간 전환)
4. **모달/Drawer**: 내부의 모든 인터랙티브 요소
5. **Popover/Tooltip**: 내부의 링크, 버튼

**체크리스트**:

- [ ] 테이블의 작업 컬럼 버튼에 `stopPropagation()` 적용
- [ ] 드롭다운 메뉴의 클릭 이벤트에 `stopPropagation()` 적용
- [ ] 폼 요소의 onChange/onClick에 `stopPropagation()` 적용
- [ ] Radio.Group, Checkbox.Group에 `stopPropagation()` 적용
- [ ] 캘린더의 패널 변경 이벤트에 `stopPropagation()` 적용

자세한 내용은 `EVENT_HANDLING_GUIDE.md` 참고.

---

## 🔗 관련 문서

- [MVP 로드맵](../../MVP_ROADMAP.md)
- [진행 상황](./PROGRESS.md)
- [디자인 가이드라인](../../DESIGN_GUIDELINES.md)
- [이벤트 처리 가이드](./EVENT_HANDLING_GUIDE.md)

---

**마지막 업데이트**: 2024년
