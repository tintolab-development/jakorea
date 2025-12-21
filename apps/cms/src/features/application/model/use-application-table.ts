/**
 * 신청 테이블 Hook
 * Phase 2.2: @tanstack/react-table + Query Parameter 동기화
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
import type { Application } from '@/types/domain'
import { useQueryParams } from '@/shared/hooks/use-query-params'

interface ApplicationTableFilters {
  programId?: string
  subjectType?: string
  status?: string
}

const columns: ColumnDef<Application>[] = [
  {
    accessorKey: 'programId',
    header: '프로그램',
  },
  {
    accessorKey: 'subjectType',
    header: '신청 주체',
  },
  {
    accessorKey: 'status',
    header: '상태',
  },
]

export function useApplicationTable(data: Application[]) {
  type QueryParams = ApplicationTableFilters & { page?: string; pageSize?: string }
  const { params, setParams } = useQueryParams<Record<string, string | undefined>>() as {
    params: QueryParams
    setParams: (updates: Partial<QueryParams>) => void
  }

  const initialFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    if (params.programId) filters.push({ id: 'programId', value: params.programId })
    if (params.subjectType) filters.push({ id: 'subjectType', value: params.subjectType })
    if (params.status) filters.push({ id: 'status', value: params.status })
    return filters
  }, [params.programId, params.subjectType, params.status])

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

    const filterParams: Partial<ApplicationTableFilters> = {}
    columnFilters.forEach(filter => {
      if (filter.value) {
        filterParams[filter.id as keyof ApplicationTableFilters] = filter.value as string
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




