/**
 * 신청 테이블 Hook
 * Phase 2.2: @tanstack/react-table + Query Parameter 동기화
 * Phase 1.5: 공통 테이블 훅 사용으로 리팩토링
 */

import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { Application } from '@/types/domain'
import { useTableWithQuery } from '@/shared/hooks/use-table-with-query'

// notificationSent 필터 함수 (boolean 값을 문자열로 변환하여 비교)
const notificationSentFilterFn: FilterFn<Application> = (row, _columnId, value) => {
  const notificationSent = row.original.notificationSent
  if (value === 'true') {
    return notificationSent === true
  }
  if (value === 'false') {
    return notificationSent === false || notificationSent === undefined
  }
  return true
}

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
  {
    accessorKey: 'notificationSent',
    header: '알림 발송',
    filterFn: notificationSentFilterFn,
  },
]

export function useApplicationTable(data: Application[], includeNotificationFilter = false) {
  const filterKeys = ['programId', 'subjectType', 'status']
  if (includeNotificationFilter) {
    filterKeys.push('notificationSent')
  }

  return useTableWithQuery({
    data,
    columns,
    filterKeys,
    defaultPageSize: 10,
    tableOptions: {
      filterFns: {
        notificationSentFilter: notificationSentFilterFn,
      },
    },
  })
}
