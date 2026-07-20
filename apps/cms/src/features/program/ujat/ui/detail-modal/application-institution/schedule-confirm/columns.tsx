import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { UjatInstitutionScheduleConfirmStatusBadge } from './status-badge'
import {
  UJAT_SCHEDULE_CONFIRM_GRADE_YEAR_LABELS,
  type UjatScheduleConfirmRow,
} from './types'

const COL = {
  no: 64,
  institution: 180,
  status: 140,
  confirmedSchedule: 450,
  gradeYear: 88,
  total: 120,
  teacher: 120,
} as const

const GRADE_COUNT_CELL_CLASS = 'ujat-schedule-confirm-list__cell-grade-count'
const CONFIRMED_SCHEDULE_CELL_CLASS = 'ujat-schedule-confirm-list__cell-confirmed-schedule'

function formatGradeCountCell(count: number): string {
  return count > 0 ? `${count}학급` : '-'
}

export const UJAT_SCHEDULE_CONFIRM_TABLE_MIN_SCROLL_X =
  COL.no +
  COL.institution +
  COL.status +
  COL.confirmedSchedule +
  COL.gradeYear * UJAT_SCHEDULE_CONFIRM_GRADE_YEAR_LABELS.length +
  COL.total +
  COL.teacher

export function useUjatScheduleConfirmColumns(): ColumnsType<UjatScheduleConfirmRow> {
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
        title: '참여 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: COL.institution,
        align: 'center',
      },
      {
        title: '일정 확인 현황',
        dataIndex: 'scheduleConfirmStatus',
        key: 'scheduleConfirmStatus',
        width: COL.status,
        align: 'center',
        render: (status: UjatScheduleConfirmRow['scheduleConfirmStatus']) => (
          <UjatInstitutionScheduleConfirmStatusBadge status={status} />
        ),
      },
      {
        title: '교육 진행 일정',
        dataIndex: 'confirmedScheduleDisplay',
        key: 'confirmedScheduleDisplay',
        width: COL.confirmedSchedule,
        className: CONFIRMED_SCHEDULE_CELL_CLASS,
        onHeaderCell: () => ({ className: CONFIRMED_SCHEDULE_CELL_CLASS }),
        onCell: () => ({ className: CONFIRMED_SCHEDULE_CELL_CLASS }),
      },
      ...UJAT_SCHEDULE_CONFIRM_GRADE_YEAR_LABELS.map(gradeLabel => ({
        title: gradeLabel,
        key: gradeLabel,
        width: COL.gradeYear,
        align: 'center' as const,
        className: GRADE_COUNT_CELL_CLASS,
        onHeaderCell: () => ({ className: GRADE_COUNT_CELL_CLASS }),
        onCell: () => ({ className: GRADE_COUNT_CELL_CLASS }),
        render: (_: unknown, record: UjatScheduleConfirmRow) =>
          formatGradeCountCell(record.assignedGradeCounts[gradeLabel]),
      })),
      {
        title: '총 교육 학급',
        dataIndex: 'totalEducationClassCount',
        key: 'totalEducationClassCount',
        width: COL.total,
        align: 'center',
        render: (count: number) => (count > 0 ? `${count}개` : '-'),
      },
      {
        title: '담당 교사명',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: COL.teacher,
        align: 'center',
      },
    ],
    []
  )
}
