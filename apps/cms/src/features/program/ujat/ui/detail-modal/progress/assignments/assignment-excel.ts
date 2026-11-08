import type { ColumnsType } from 'antd/es/table'
import { formatUjatGradeClassDisplayLabel } from '@/features/program/ujat/lib/ujat-grade-class-display'
import {
  assignmentSubmissionStatusLabel,
  formatAssignmentRemarks,
  resolveAssignmentSubmissionStatus,
} from './assignment-display'
import type { UjatAssignmentSessionGroup, UjatAssignmentVolunteerRow } from './types'

export type UjatAssignmentSessionExcelRow = {
  no: number
  name: string
  institutionName: string
  assignedClass: string
  submissionStatusLabel: string
  remarks: string
}

export const UJAT_ASSIGNMENT_SESSION_EXCEL_COLUMNS: ColumnsType<UjatAssignmentSessionExcelRow> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '봉사자명', dataIndex: 'name', key: 'name' },
  { title: '배정 기관', dataIndex: 'institutionName', key: 'institutionName' },
  { title: '배정 학급', dataIndex: 'assignedClass', key: 'assignedClass' },
  { title: '제출 현황', dataIndex: 'submissionStatusLabel', key: 'submissionStatusLabel' },
  { title: '비고', dataIndex: 'remarks', key: 'remarks' },
]

export function buildUjatAssignmentSessionExcelRows(
  volunteers: UjatAssignmentVolunteerRow[]
): UjatAssignmentSessionExcelRow[] {
  return volunteers.map((volunteer, index) => ({
    no: index + 1,
    name: volunteer.name,
    institutionName: volunteer.institutionName,
    assignedClass: formatUjatGradeClassDisplayLabel(volunteer.assignedClass),
    submissionStatusLabel: assignmentSubmissionStatusLabel(
      resolveAssignmentSubmissionStatus(volunteer)
    ),
    remarks: formatAssignmentRemarks(volunteer),
  }))
}

/** 예: 과제관리_서울_2026.04.03(금) */
export function resolveUjatAssignmentSessionExcelFilename(
  session: Pick<UjatAssignmentSessionGroup, 'dateLabel'>,
  regionLabel: string
): string {
  const label = [regionLabel, session.dateLabel]
    .map(part => part.trim())
    .filter(Boolean)
    .join('_')
    .replace(/[\\/:*?"<>|]/g, '')
  return label ? `과제관리_${label}` : '과제관리'
}
