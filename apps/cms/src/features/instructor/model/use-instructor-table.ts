/**
 * 강사 테이블 Hook
 * Phase 1.2: @tanstack/react-table + Query Parameter 동기화
 * Phase 1.5: 공통 테이블 훅 사용으로 리팩토링
 */

import type { ColumnDef } from '@tanstack/react-table'
import type { Instructor } from '@/types/domain'
import { useTableWithQuery } from '@/shared/hooks/use-table-with-query'

const columns: ColumnDef<Instructor>[] = [
  {
    accessorKey: 'name',
    header: '이름',
  },
  {
    accessorKey: 'contactPhone',
    header: '연락처',
  },
  {
    accessorKey: 'contactEmail',
    header: '이메일',
  },
  {
    accessorKey: 'region',
    header: '지역',
  },
  {
    accessorKey: 'specialty',
    header: '전문분야',
    cell: ({ getValue }) => {
      const specialties = getValue() as string[]
      return specialties?.join(', ') || '-'
    },
  },
  {
    accessorKey: 'rating',
    header: '평점',
    cell: ({ getValue }) => {
      const rating = getValue() as number | undefined
      return rating ? `${rating.toFixed(1)}/5.0` : '-'
    },
  },
]

export function useInstructorTable(data: Instructor[]) {
  return useTableWithQuery({
    data,
    columns,
    filterKeys: ['name', 'region', 'specialty'],
    defaultPageSize: 10,
  })
}

