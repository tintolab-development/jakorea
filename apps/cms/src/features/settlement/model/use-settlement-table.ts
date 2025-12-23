/**
 * 정산 테이블 Hook
 * Phase 4: @tanstack/react-table + Query Parameter 동기화
 * Phase 1.5: 공통 테이블 훅 사용으로 리팩토링
 */

import type { ColumnDef } from '@tanstack/react-table'
import type { Settlement } from '@/types/domain'
import { useTableWithQuery } from '@/shared/hooks/use-table-with-query'

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
  return useTableWithQuery({
    data,
    columns,
    filterKeys: ['status', 'programId', 'period'],
    defaultPageSize: 10,
  })
}

