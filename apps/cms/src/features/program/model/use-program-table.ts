/**
 * 프로그램 테이블 Hook
 * Phase 2.1: @tanstack/react-table + Query Parameter 동기화
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
import type { Program } from '@/types/domain'
import { useQueryParams } from '@/shared/hooks/use-query-params'

interface ProgramTableFilters {
  title?: string
  sponsorId?: string
  type?: string
  status?: string
}

const columns: ColumnDef<Program>[] = [
  {
    accessorKey: 'title',
    header: '프로그램명',
  },
  {
    accessorKey: 'sponsorId',
    header: '스폰서',
  },
  {
    accessorKey: 'type',
    header: '유형',
  },
  {
    accessorKey: 'format',
    header: '형태',
  },
  {
    accessorKey: 'status',
    header: '상태',
  },
]

export function useProgramTable(data: Program[]) {
  type QueryParams = ProgramTableFilters & { page?: string; pageSize?: string }
  const { params, setParams } = useQueryParams<Record<string, string | undefined>>() as {
    params: QueryParams
    setParams: (updates: Partial<QueryParams>) => void
  }

  const initialFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    if (params.title) filters.push({ id: 'title', value: params.title })
    if (params.sponsorId) filters.push({ id: 'sponsorId', value: params.sponsorId })
    if (params.type) filters.push({ id: 'type', value: params.type })
    if (params.status) filters.push({ id: 'status', value: params.status })
    return filters
  }, [params.title, params.sponsorId, params.type, params.status])

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

    const filterParams: Partial<ProgramTableFilters> = {}
    columnFilters.forEach(filter => {
      if (filter.value) {
        filterParams[filter.id as keyof ProgramTableFilters] = filter.value as string
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

