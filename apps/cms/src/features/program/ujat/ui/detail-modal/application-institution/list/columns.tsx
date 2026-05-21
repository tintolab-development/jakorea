import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { UjatInstitutionApplicationStatusBadge } from './status-badge'
import {
  UJAT_INSTITUTION_SCHEDULE_COLUMNS,
  type UjatInstitutionApplicationRow,
} from './types'

const COL = {
  no: 64,
  institution: 180,
  status: 140,
  grade: 420,
  /** 헤더 「총 신청 학급 수」 16px bold + 좌우 패딩 16px */
  total: 152,
  schedule: 92,
  teacher: 120,
  selection: 68,
} as const

const GRADE_CELL_CLASS = 'ujat-institution-application-list__cell-grade'
const TOTAL_CELL_CLASS = 'ujat-institution-application-list__cell-total'

function formatGradeClassCounts(row: UjatInstitutionApplicationRow): string {
  return row.gradeClassCounts
    .map(g => `${g.gradeLabel} ${g.classCount}학급`)
    .join(' | ')
}

/** 선택 열 + 본문 열 너비 합(가로 스크롤 최소값) */
export const UJAT_INSTITUTION_APPLICATION_TABLE_MIN_SCROLL_X =
  COL.selection +
  COL.no +
  COL.institution +
  COL.status +
  COL.grade +
  COL.total +
  COL.schedule * UJAT_INSTITUTION_SCHEDULE_COLUMNS.length +
  COL.teacher

export function useUjatInstitutionApplicationColumns(): ColumnsType<UjatInstitutionApplicationRow> {
  return useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: COL.no,
        align: 'center',
        fixed: 'left',
      },
      {
        title: '신청 기관명',
        dataIndex: 'institutionName',
        key: 'institutionName',
        width: COL.institution,
        align: 'center',
        fixed: 'left',
      },
      {
        title: '임시 배정 현황',
        dataIndex: 'tempAssignmentStatus',
        key: 'tempAssignmentStatus',
        width: COL.status,
        align: 'center',
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
        render: (_: unknown, record) => formatGradeClassCounts(record),
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
      ...UJAT_INSTITUTION_SCHEDULE_COLUMNS.map(col => ({
        title: col.title,
        key: col.key,
        width: COL.schedule,
        align: 'center' as const,
        render: (_: unknown, record: UjatInstitutionApplicationRow) =>
          record.scheduleSlots[col.key],
      })),
      {
        title: '신청 교사명',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: COL.teacher,
        align: 'center',
      },
    ],
    []
  )
}
