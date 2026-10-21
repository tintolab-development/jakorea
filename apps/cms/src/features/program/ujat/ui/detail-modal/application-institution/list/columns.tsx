import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { UjatInstitutionApplicationStatusBadge } from './status-badge'
import { UjatInlineDividedSegments } from '../../shared/ujat-inline-divided-segments'
import type { UjatInstitutionScheduleColumn } from '../education-schedule'
import type { UjatInstitutionApplicationRow } from './types'

const COL = {
  no: 80,
  institution: 180,
  /** 「임시 배정 평가」 16px bold + 패딩 */
  status: 160,
  /** 「학년 별 신청 학급 수」 + 학년 세그먼트 본문 */
  grade: 340,
  /** 헤더 「총 신청 학급 수」 16px bold + 좌우 패딩 16px */
  total: 152,
  /** 「M월 D일」 헤더 */
  schedule: 112,
  teacher: 120,
  selection: 68,
} as const

const GRADE_CELL_CLASS = 'ujat-institution-application-list__cell-grade'
const TOTAL_CELL_CLASS = 'ujat-institution-application-list__cell-total'
const STATUS_CELL_CLASS = 'ujat-institution-application-list__cell-status'
const SCHEDULE_CELL_CLASS = 'ujat-institution-application-list__cell-schedule'
const INSTITUTION_CELL_CLASS = 'ujat-institution-application-list__cell-institution'

function renderGradeClassCounts(row: UjatInstitutionApplicationRow) {
  if (row.gradeClassCounts.length === 0) return '-'
  return (
    <UjatInlineDividedSegments
      segments={row.gradeClassCounts.map(
        g => `${g.gradeLabel} / ${g.classCount == null ? '-' : g.classCount}`
      )}
    />
  )
}

/** 선택 열 + 본문 열 너비 합(가로 스크롤 최소값) */
export function ujatInstitutionApplicationTableScrollX(scheduleColumnCount: number): number {
  return (
    COL.selection +
    COL.no +
    COL.institution +
    COL.status +
    COL.grade +
    COL.total +
    COL.schedule * scheduleColumnCount +
    COL.teacher
  )
}

export function useUjatInstitutionApplicationColumns(
  scheduleColumns: readonly UjatInstitutionScheduleColumn[]
): ColumnsType<UjatInstitutionApplicationRow> {
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
        title: '신청 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: COL.institution,
        align: 'center',
        onHeaderCell: () => ({ className: INSTITUTION_CELL_CLASS }),
        onCell: () => ({ className: INSTITUTION_CELL_CLASS }),
      },
      {
        title: '임시 배정 평가',
        dataIndex: 'tempAssignmentStatus',
        key: 'tempAssignmentStatus',
        width: COL.status,
        align: 'center',
        onHeaderCell: () => ({ className: STATUS_CELL_CLASS }),
        onCell: () => ({ className: STATUS_CELL_CLASS }),
        render: (status: UjatInstitutionApplicationRow['tempAssignmentStatus']) => (
          <UjatInstitutionApplicationStatusBadge status={status} />
        ),
      },
      {
        title: '학년 별 신청 학급 수',
        key: 'gradeClassCounts',
        width: COL.grade,
        align: 'center',
        onHeaderCell: () => ({ className: GRADE_CELL_CLASS }),
        onCell: () => ({ className: GRADE_CELL_CLASS }),
        render: (_: unknown, record) => renderGradeClassCounts(record),
      },
      {
        title: '총 신청 학급 수',
        dataIndex: 'totalClassCount',
        key: 'totalClassCount',
        width: COL.total,
        align: 'center',
        className: TOTAL_CELL_CLASS,
        onHeaderCell: () => ({ className: TOTAL_CELL_CLASS }),
        onCell: () => ({ className: TOTAL_CELL_CLASS }),
        render: (count: number) => `${count}학급`,
      },
      ...scheduleColumns.map(col => ({
        title: col.title,
        key: col.key,
        width: COL.schedule,
        align: 'center' as const,
        onHeaderCell: () => ({ className: SCHEDULE_CELL_CLASS }),
        onCell: () => ({ className: SCHEDULE_CELL_CLASS }),
        render: (_: unknown, record: UjatInstitutionApplicationRow) =>
          record.scheduleSlots[col.key] ?? '-',
      })),
      {
        title: '신청 교사명',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: COL.teacher,
        align: 'center',
      },
    ],
    [scheduleColumns]
  )
}
