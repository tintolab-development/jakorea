/**
 * 프로그램 테이블 Hook
 * Phase 2.1: @tanstack/react-table + Query Parameter 동기화
 * Phase 1.5: 공통 테이블 훅 사용으로 리팩토링
 * 7단계 동기화: status 쿼리 파라미터를 lifecycleStatus 필터로 매핑
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
  {
    accessorKey: 'lifecycleStatus',
    header: '진행 상태',
  },
  {
    accessorKey: 'category',
    header: '수강 대상',
  },
  {
    accessorKey: 'businessArea',
    header: '교육 분야',
  },
  {
    accessorKey: 'targetLevel',
    header: '교육 대상',
  },
  {
    accessorKey: 'institutionType',
    header: '기관 구분',
  },
]

export function useProgramTable(data: Program[]) {
  // lifecycleStatus 필터는 페이지 레벨(ProgramListPage)에서 URL status 파라미터로 처리
  // 테이블 컬럼 필터에서 제외하여 이중 필터링 방지
  return useTableWithQuery({
    data,
    columns,
    filterKeys: [
      'title',
      'sponsorId',
      'type',
      'category',
      'businessArea',
      'targetLevel',
      'institutionType',
    ],
    defaultPageSize: 10,
  })
}
