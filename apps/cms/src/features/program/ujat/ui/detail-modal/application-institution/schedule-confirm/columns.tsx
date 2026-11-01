import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { CMS_TABLE_NO_COL_CLASS } from '@/shared/constants/table'
import { UjatInstitutionScheduleConfirmStatusBadge } from './status-badge'
import {
  UJAT_SCHEDULE_CONFIRM_GRADE_YEAR_LABELS,
  type UjatScheduleConfirmRow,
} from './types'

/** Figma 4082:91349 Table / Horizontal 열 폭 */
const COL = {
  no: 80,
  institution: 260,
  status: 160,
  confirmedSchedule: 466,
  gradeYear: 120,
  total: 120,
  teacher: 120,
} as const

const NO_CELL_CLASS = CMS_TABLE_NO_COL_CLASS
const INSTITUTION_CELL_CLASS = 'ujat-schedule-confirm-list__cell-institution'
const STATUS_CELL_CLASS = 'ujat-schedule-confirm-list__cell-status'
const CONFIRMED_SCHEDULE_CELL_CLASS = 'ujat-schedule-confirm-list__cell-confirmed-schedule'
const GRADE_COUNT_CELL_CLASS = 'ujat-schedule-confirm-list__cell-grade-count'
const TOTAL_CELL_CLASS = 'ujat-schedule-confirm-list__cell-total'
const TEACHER_CELL_CLASS = 'ujat-schedule-confirm-list__cell-teacher'

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

function cellClass(className: string) {
  return {
    className,
    onHeaderCell: () => ({ className }),
    onCell: () => ({ className }),
  }
}

export function useUjatScheduleConfirmColumns(): ColumnsType<UjatScheduleConfirmRow> {
  return useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: COL.no,
        align: 'center',
        ...cellClass(NO_CELL_CLASS),
      },
      {
        title: '참여 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: COL.institution,
        align: 'center',
        ellipsis: true,
        ...cellClass(INSTITUTION_CELL_CLASS),
      },
      {
        title: '일정 확인 현황',
        dataIndex: 'scheduleConfirmStatus',
        key: 'scheduleConfirmStatus',
        width: COL.status,
        align: 'center',
        ...cellClass(STATUS_CELL_CLASS),
        render: (status: UjatScheduleConfirmRow['scheduleConfirmStatus']) =>
          status ? <UjatInstitutionScheduleConfirmStatusBadge status={status} /> : '-',
      },
      {
        title: '교육 진행 확정 일정',
        dataIndex: 'confirmedScheduleDisplay',
        key: 'confirmedScheduleDisplay',
        width: COL.confirmedSchedule,
        align: 'center',
        ellipsis: true,
        ...cellClass(CONFIRMED_SCHEDULE_CELL_CLASS),
        render: (value: UjatScheduleConfirmRow['confirmedScheduleDisplay']) => {
          const text = value?.trim() || '-'
          return (
            <span className="ujat-schedule-confirm-list__confirmed-schedule-text" title={text}>
              {text}
            </span>
          )
        },
      },
      ...UJAT_SCHEDULE_CONFIRM_GRADE_YEAR_LABELS.map(gradeLabel => ({
        title: gradeLabel,
        key: gradeLabel,
        width: COL.gradeYear,
        align: 'center' as const,
        ...cellClass(GRADE_COUNT_CELL_CLASS),
        render: (_: unknown, record: UjatScheduleConfirmRow) =>
          formatGradeCountCell(record.assignedGradeCounts[gradeLabel]),
      })),
      {
        title: '총 교육 학급',
        dataIndex: 'totalEducationClassCount',
        key: 'totalEducationClassCount',
        width: COL.total,
        align: 'center',
        ...cellClass(TOTAL_CELL_CLASS),
        render: (count: number) => (count > 0 ? `${count}개` : '-'),
      },
      {
        title: '담당 교사명',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: COL.teacher,
        align: 'center',
        ellipsis: true,
        ...cellClass(TEACHER_CELL_CLASS),
      },
    ],
    []
  )
}
