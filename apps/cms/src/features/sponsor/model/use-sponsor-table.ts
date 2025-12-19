/**
 * 스폰서 테이블 Hook
 * Phase 1.3: @tanstack/react-table + Query Parameter 동기화
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
import type { Sponsor } from '@/types/domain'
import { useQueryParams } from '@/shared/hooks/use-query-params'

interface SponsorTableFilters {
  name?: string
}

const columns: ColumnDef<Sponsor>[] = [
  {
    accessorKey: 'name',
    header: '스폰서명',
  },
  {
    accessorKey: 'description',
    header: '설명',
  },
  {
    accessorKey: 'contactInfo',
    header: '연락처',
  },
]

export function useSponsorTable(data: Sponsor[]) {
  type QueryParams = SponsorTableFilters & { page?: string; pageSize?: string }
  const { params, setParams } = useQueryParams<Record<string, string | undefined>>() as {
    params: QueryParams
    setParams: (updates: Partial<QueryParams>) => void
  }

  const initialFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = []
    if (params.name) filters.push({ id: 'name', value: params.name })
    return filters
  }, [params.name])

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

  // 초기화 완료 후에만 쿼리 파라미터 동기화
  useEffect(() => {
    if (!isInitialized) {
      setIsInitialized(true)
      return
    }

    const filterParams: Partial<SponsorTableFilters> = {}
    columnFilters.forEach(filter => {
      if (filter.value) {
        filterParams[filter.id as keyof SponsorTableFilters] = filter.value as string
      }
    })

    const updates: Partial<QueryParams> = { ...filterParams }

    // 기본값이 아닐 때만 파라미터 추가
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

