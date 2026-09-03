import type { ColumnsType } from 'antd/es/table'
import {
  UJAT_EDU_PROGRESS_INSTITUTION_GRADE_LABELS,
  type UjatEducationProgressInstitutionRow,
} from './types'

export const UJAT_EDU_PROGRESS_INSTITUTIONS_TABLE_MIN_SCROLL_X = 1240

function renderGradeCell(count: number) {
  if (count <= 0) return '-'
  return `${count}학급`
}

function renderEducationScheduleCell(value: string) {
  return (
    <div className="ujat-education-progress-institutions__schedule-cell">
      <span className="ujat-education-progress-institutions__schedule-text">{value || '-'}</span>
    </div>
  )
}

export function buildUjatEducationProgressInstitutionColumns(): ColumnsType<UjatEducationProgressInstitutionRow> {
  const gradeColumns: ColumnsType<UjatEducationProgressInstitutionRow> =
    UJAT_EDU_PROGRESS_INSTITUTION_GRADE_LABELS.map(label => ({
      title: label,
      key: `grade-${label}`,
      width: 88,
      align: 'center',
      className: 'ujat-education-progress-institutions__cell-grade-count',
      render: (_value, record) => renderGradeCell(record.gradeClassCounts[label] ?? 0),
    }))

  return [
    {
      title: 'No',
      dataIndex: 'no',
      key: 'no',
      width: 80,
      align: 'center',
    },
    {
      title: '참여 기관명',
      dataIndex: 'institutionName',
      key: 'institutionName',
      width: 160,
      ellipsis: true,
    },
    {
      title: '교육 지역',
      dataIndex: 'educationRegion',
      key: 'educationRegion',
      width: 100,
      align: 'center',
    },
    {
      title: '교육 진행 일정',
      dataIndex: 'educationScheduleDisplay',
      key: 'educationScheduleDisplay',
      width: 320,
      align: 'center',
      className: 'ujat-education-progress-institutions__cell-education-schedule',
      render: (value: string) => renderEducationScheduleCell(value),
    },
    ...gradeColumns,
    {
      title: '총 교육 학급',
      dataIndex: 'totalEducationClassCount',
      key: 'totalEducationClassCount',
      width: 120,
      align: 'center',
      render: (value: number) => (value > 0 ? `${value}개` : '-'),
    },
    {
      title: '담당 교사명',
      dataIndex: 'teacherName',
      key: 'teacherName',
      width: 120,
      ellipsis: true,
    },
  ]
}
