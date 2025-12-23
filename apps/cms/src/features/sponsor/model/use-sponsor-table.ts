/**
 * 스폰서 테이블 Hook
 * Phase 1.3: @tanstack/react-table + Query Parameter 동기화
 * Phase 1.5: 공통 테이블 훅 사용으로 리팩토링
 */

import type { ColumnDef } from '@tanstack/react-table'
import type { Sponsor } from '@/types/domain'
import { useTableWithQuery } from '@/shared/hooks/use-table-with-query'

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
  return useTableWithQuery({
    data,
    columns,
    filterKeys: ['name'],
    defaultPageSize: 10,
  })
}

