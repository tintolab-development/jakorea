import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { displayServerPiiAsIs } from '@/features/program/shared/lib/program-pii-display'
import { UjatEducationProgressVolunteerAssignmentStatusLabel } from './assignment-status-label'
import type { UjatEducationProgressVolunteerRow } from './types'

/** Figma 4082:108069 Table / Horizontal header 폭 */
const COL = {
  selection: 60,
  no: 80,
  name: 160,
  grade: 140,
  region: 180,
  mobile: 200,
  email: 220,
  totalDays: 160,
  status: 180,
} as const

function formatTotalAssignedDays(days: number | null): string {
  return days == null ? '-' : String(days)
}

export const UJAT_EDU_PROGRESS_VOLUNTEERS_TABLE_MIN_SCROLL_X =
  COL.selection +
  COL.no +
  COL.name +
  COL.grade +
  COL.region +
  COL.mobile +
  COL.email +
  COL.totalDays +
  COL.status

export function useUjatEducationProgressVolunteerColumns(): ColumnsType<UjatEducationProgressVolunteerRow> {
  return useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: COL.no,
        align: 'center',
      },
      {
        title: '봉사자명',
        dataIndex: 'volunteerName',
        key: 'volunteerName',
        width: COL.name,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '봉사자 학년',
        dataIndex: 'grade',
        key: 'grade',
        width: COL.grade,
        align: 'center',
      },
      {
        title: '교육 활동 지역',
        dataIndex: 'regionLabel',
        key: 'regionLabel',
        width: COL.region,
        align: 'center',
      },
      {
        title: '연락처',
        dataIndex: 'mobile',
        key: 'mobile',
        width: COL.mobile,
        align: 'center',
        ellipsis: true,
        render: (mobile: string) => displayServerPiiAsIs(mobile),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: COL.email,
        align: 'center',
        ellipsis: true,
        render: (email: string) => displayServerPiiAsIs(email),
      },
      {
        title: '총 교육 배정일 수',
        dataIndex: 'totalAssignedDays',
        key: 'totalAssignedDays',
        width: COL.totalDays,
        align: 'center',
        render: (days: number | null) => formatTotalAssignedDays(days),
      },
      {
        title: '교육 배정 현황',
        dataIndex: 'assignmentStatus',
        key: 'assignmentStatus',
        width: COL.status,
        align: 'center',
        render: (status: UjatEducationProgressVolunteerRow['assignmentStatus']) => (
          <UjatEducationProgressVolunteerAssignmentStatusLabel status={status} />
        ),
      },
    ],
    []
  )
}
