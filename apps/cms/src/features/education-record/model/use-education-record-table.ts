/**
 * 실적 통계 테이블 Hook
 * 엑셀 데이터 기반 통합 테이블
 */

import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { Program } from '@/types/domain'
import { useTableWithQuery } from '@/shared/hooks/use-table-with-query'

// 교육 월 필터 함수 (startDate에서 월 추출)
const educationMonthFilter: FilterFn<Program> = (row, _columnId, filterValue) => {
  if (!filterValue) return true
  const date = row.original.startDate
  if (!date) return false
  const month = new Date(date).getMonth() + 1
  return String(month) === filterValue
}

const columns: ColumnDef<Program>[] = [
  {
    accessorKey: 'title',
    header: '세부 프로그램명',
  },
  {
    accessorKey: 'sponsorId',
    header: '후원사명',
  },
  {
    accessorKey: 'businessArea',
    header: '사업분야',
  },
  {
    accessorKey: 'ips',
    header: 'IPS',
  },
  {
    accessorKey: 'targetLevel',
    header: '대상 구분',
  },
  {
    accessorKey: 'institutionType',
    header: '기관 구분',
  },
  {
    id: 'educationMonth',
    accessorFn: (row) => {
      if (!row.startDate) return null
      return String(new Date(row.startDate).getMonth() + 1)
    },
    header: '교육 월',
    filterFn: educationMonthFilter,
  },
  {
    accessorKey: 'totalParticipants',
    header: '총 참가자',
  },
]

export function useEducationRecordTable(data: Program[]) {
  return useTableWithQuery({
    data,
    columns,
    filterKeys: [
      'title',
      'sponsorId',
      'businessArea',
      'ips',
      'targetLevel',
      'institutionType',
      'educationMonth',
      // 'region'은 Program에 직접 필드가 아니므로 filterKeys에서 제외
      // 컴포넌트 레벨에서 별도로 필터링 처리
    ],
    defaultPageSize: 20,
  })
}

