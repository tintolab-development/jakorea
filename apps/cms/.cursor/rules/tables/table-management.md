---
priority: medium
always_include: false
category: tables
---

# 테이블 관리 및 필터링

## @tanstack/react-table 사용

테이블 관리 및 필터링은 **@tanstack/react-table** 라이브러리를 사용합니다.

## 기본 설정

```typescript
// features/instructor/ui/instructor-table.tsx
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

## 필터링 기능

```typescript
// features/instructor/ui/instructor-table.tsx
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

## 라우트와 Query Parameter 동기화

테이블 필터 상태를 URL의 query parameter와 동기화하여 브라우저 뒤로가기/앞으로가기, 북마크, 공유 기능을 지원합니다.

### useQueryParams Hook

```typescript
// shared/hooks/use-query-params.ts
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

### Custom Hook으로 추상화

```typescript
// features/instructor/model/use-instructor-table.ts
import {
  useReactTable,
  ColumnFiltersState,
  PaginationState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table'
import { useQueryParams } from '@/shared/hooks/use-query-params'
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

## 주의사항

1. **replace 옵션 사용**: `setSearchParams`에 `{ replace: true }` 옵션을 사용하여 브라우저 히스토리에 불필요한 항목이 쌓이지 않도록 합니다.

2. **초기값 처리**: Query Parameter가 없을 때는 기본값을 사용하고, URL에 반영하지 않습니다.

3. **타입 안정성**: Query Parameter의 타입을 명확히 정의하여 타입 안정성을 보장합니다.

4. **성능 최적화**: `useMemo`와 `useCallback`을 활용하여 불필요한 재계산을 방지합니다.

## 관련 규칙

- [테이블 구현 컨텍스트](./table-implementation.md) - Ant Design Table 컬럼·CSS·필터 패턴
- [라우팅](../architecture/routing.md)
- [Custom Hooks](../coding/custom-hooks.md)
