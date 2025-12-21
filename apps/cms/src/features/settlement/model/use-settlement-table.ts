/**
 * 정산 테이블 Hook
 * Phase 4: @tanstack/react-table + Query Parameter 동기화
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
import { useState, useEffect, useMemo, useRef } from 'react'
import type { Settlement } from '@/types/domain'
import { useQueryParams } from '@/shared/hooks/use-query-params'

interface SettlementTableFilters {
  status?: string
  programId?: string
  period?: string
}

const columns: ColumnDef<Settlement>[] = [
  {
    accessorKey: 'period',
    header: '기간',
  },
  {
    accessorKey: 'programId',
    header: '프로그램',
  },
  {
    accessorKey: 'instructorId',
    header: '강사',
  },
  {
    accessorKey: 'status',
    header: '상태',
  },
  {
    accessorKey: 'totalAmount',
    header: '총액',
  },
]

export function useSettlementTable(data: Settlement[]) {
  type QueryParams = SettlementTableFilters & { page?: string; pageSize?: string }
  const { params, setParams } = useQueryParams<Record<string, string | undefined>>() as {
    params: QueryParams
    setParams: (updates: Partial<QueryParams>) => void
  }

  const isMounted = useRef(false)

  const initialFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    if (params.status) filters.push({ id: 'status', value: params.status })
    if (params.programId) filters.push({ id: 'programId', value: params.programId })
    if (params.period) filters.push({ id: 'period', value: params.period })
    return filters
  }, [params.status, params.programId, params.period])

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
    if (!isMounted.current) {
      isMounted.current = true
      return
    }

    const filterParams: Partial<SettlementTableFilters> = {}
    columnFilters.forEach(filter => {
      if (filter.value) {
        filterParams[filter.id as keyof SettlementTableFilters] = filter.value as string
      }
    })
    setParams({
      ...filterParams,
      page: pagination.pageIndex > 0 ? String(pagination.pageIndex + 1) : undefined,
      pageSize: pagination.pageSize !== 10 ? String(pagination.pageSize) : undefined,
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

