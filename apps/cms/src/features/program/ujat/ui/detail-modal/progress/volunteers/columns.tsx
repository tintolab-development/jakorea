import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import { UjatEducationProgressVolunteerAssignmentStatusLabel } from './assignment-status-label'
import type { UjatEducationProgressVolunteerRow } from './types'

const COL = {
  selection: 48,
  no: 64,
  name: 120,
  grade: 100,
  region: 120,
  mobile: 140,
  email: 180,
  totalDays: 140,
  status: 120,
} as const

function formatTotalAssignmentDays(days: number | null): string {
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
        render: (mobile: string) => MASKING_POLICY.phone(mobile.replace(/\s/g, '')) || mobile,
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: COL.email,
        align: 'center',
        render: (email: string) => MASKING_POLICY.email(email),
      },
      {
        title: '총 교육 배정일 수',
        dataIndex: 'totalAssignmentDays',
        key: 'totalAssignmentDays',
        width: COL.totalDays,
        align: 'center',
        render: (days: number | null) => formatTotalAssignmentDays(days),
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
