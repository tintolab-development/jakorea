/**
 * 학교 테이블 Hook
 * Phase 1.4: @tanstack/react-table + Query Parameter 동기화
 */

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnFiltersState,
  type PaginationState,
  type ColumnDef,
} from '@tanstack/react-table'
import { useState, useEffect, useMemo } from 'react'
import type { School } from '@/types/domain'
import { useQueryParams } from '@/shared/hooks/use-query-params'

interface SchoolTableFilters {
  name?: string
  region?: string
}

const columns: ColumnDef<School>[] = [
  {
    accessorKey: 'name',
    header: '학교명',
  },
  {
    accessorKey: 'region',
    header: '지역',
  },
  {
    accessorKey: 'address',
    header: '주소',
  },
  {
    accessorKey: 'contactPerson',
    header: '담당자',
  },
  {
    accessorKey: 'contactPhone',
    header: '연락처',
  },
  {
    accessorKey: 'contactEmail',
    header: '이메일',
  },
]

export function useSchoolTable(data: School[]) {
  type QueryParams = SchoolTableFilters & { page?: string; pageSize?: string }
  const { params, setParams } = useQueryParams<Record<string, string | undefined>>() as {
    params: QueryParams
    setParams: (updates: Partial<QueryParams>) => void
  }

  const initialFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    if (params.name) filters.push({ id: 'name', value: params.name })
    if (params.region) filters.push({ id: 'region', value: params.region })
    return filters
  }, [params.name, params.region])

  const initialPagination = useMemo<PaginationState>(
    () => ({
      pageIndex: params.page ? parseInt(params.page) - 1 : 0,
      pageSize: params.pageSize ? parseInt(params.pageSize) : 10,
    }),
    [params.page, params.pageSize]
  )

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialFilters)
  const [pagination, setPagination] = useState<PaginationState>(initialPagination)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true)
      return
    }

    const filterParams: Partial<SchoolTableFilters> = {}
    columnFilters.forEach(filter => {
      if (filter.value) {
        filterParams[filter.id as keyof SchoolTableFilters] = filter.value as string
      }
    })

    const updates: Partial<QueryParams> = { ...filterParams }

    if (pagination.pageIndex > 0) {
      updates.page = String(pagination.pageIndex + 1)
    }
    if (pagination.pageSize !== 10) {
      updates.pageSize = String(pagination.pageSize)
    }

    setParams(updates)
  }, [columnFilters, pagination, setParams, isInitialized])

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

