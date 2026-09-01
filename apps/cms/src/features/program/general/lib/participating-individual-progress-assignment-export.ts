import type { ColumnsType } from 'antd/es/table'
import {
  resolveProgressAssignmentRemark,
  resolveProgressAssignmentSubmissionExportLabel,
} from '@/features/program/general/lib/participating-individual-progress-assignment-display'
import type { ParticipatingIndividualProgressAssignmentParticipantRow } from '@/features/program/general/lib/participating-individual-progress-assignment-types'

export const PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_EXCEL_COLUMNS: ColumnsType<
  ParticipatingIndividualProgressAssignmentParticipantRow & { no: number }
> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '참여자명', dataIndex: 'name', key: 'name' },
  { title: '성별 및 생년월일', dataIndex: 'genderBirthLabel', key: 'genderBirthLabel' },
  {
    title: '소속 및 학년',
    dataIndex: 'affiliationGradeLabel',
    key: 'affiliationGradeLabel',
  },
  {
    title: '제출 파일',
    key: 'submission',
    render: (_value, record) => resolveProgressAssignmentSubmissionExportLabel(record.submission),
  },
  {
    title: '비고',
    key: 'remark',
    render: (_value, record) => resolveProgressAssignmentRemark(record),
  },
]

export function buildProgressAssignmentSessionExcelRows(
  headerPrefix: string,
  rows: Array<ParticipatingIndividualProgressAssignmentParticipantRow & { no: number }>
) {
  return rows.map(row => ({
    ...row,
    scheduleHeader: headerPrefix,
  }))
}

export function resolveProgressAssignmentSessionExcelFilename(sessionTitle: string): string {
  const sanitized = sessionTitle.replace(/[\\/:*?"<>|]/g, '_').trim()
  return `과제관리_${sanitized}`
}
