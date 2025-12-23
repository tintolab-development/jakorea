/**
 * 학교 테이블 Hook
 * Phase 1.4: @tanstack/react-table + Query Parameter 동기화
 * Phase 1.5: 공통 테이블 훅 사용으로 리팩토링
 */

import type { ColumnDef } from '@tanstack/react-table'
import type { School } from '@/types/domain'
import { useTableWithQuery } from '@/shared/hooks/use-table-with-query'

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
  return useTableWithQuery({
    data,
    columns,
    filterKeys: ['name', 'region'],
    defaultPageSize: 10,
  })
}




