/**
 * 신청 테이블 Hook
 * Phase 2.2: @tanstack/react-table + Query Parameter 동기화
 * Phase 1.5: 공통 테이블 훅 사용으로 리팩토링
 */

import type { ColumnDef } from '@tanstack/react-table'
import type { Application } from '@/types/domain'
import { useTableWithQuery } from '@/shared/hooks/use-table-with-query'

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
  return useTableWithQuery({
    data,
    columns,
    filterKeys: ['programId', 'subjectType', 'status'],
    defaultPageSize: 10,
  })
}




