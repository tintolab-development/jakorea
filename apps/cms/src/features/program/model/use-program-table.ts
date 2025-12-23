/**
 * 프로그램 테이블 Hook
 * Phase 2.1: @tanstack/react-table + Query Parameter 동기화
 * Phase 1.5: 공통 테이블 훅 사용으로 리팩토링
 */

import type { ColumnDef } from '@tanstack/react-table'
import type { Program } from '@/types/domain'
import { useTableWithQuery } from '@/shared/hooks/use-table-with-query'

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
  return useTableWithQuery({
    data,
    columns,
    filterKeys: ['title', 'sponsorId', 'type', 'status'],
    defaultPageSize: 10,
  })
}




