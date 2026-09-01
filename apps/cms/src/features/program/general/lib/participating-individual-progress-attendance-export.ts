import type { ColumnsType } from 'antd/es/table'
import {
  resolveProgressAttendanceRemark,
  resolveProgressAttendanceStatusLabel,
} from '@/features/program/general/lib/participating-individual-progress-attendance-display'
import type { ParticipatingIndividualProgressAttendanceParticipantRow } from '@/features/program/general/lib/participating-individual-progress-attendance-types'

export const PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_EXCEL_COLUMNS: ColumnsType<
  ParticipatingIndividualProgressAttendanceParticipantRow & { no: number }
> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '참여자명', dataIndex: 'name', key: 'name' },
  { title: '성별 및 생년월일', dataIndex: 'genderBirthLabel', key: 'genderBirthLabel' },
  {
    title: '소속 및 학년',
    dataIndex: 'affiliationGradeLabel',
    key: 'affiliationGradeLabel',
  },
  { title: '연락처', dataIndex: 'contact', key: 'contact' },
  { title: '이메일', dataIndex: 'email', key: 'email' },
  {
    title: '출결 현황',
    key: 'attendanceStatus',
    render: (_value, record) => resolveProgressAttendanceStatusLabel(record),
  },
  {
    title: '비고',
    key: 'remark',
    render: (_value, record) => resolveProgressAttendanceRemark(record),
  },
]

export function buildProgressAttendanceSessionExcelRows(
  headerPrefix: string,
  rows: Array<ParticipatingIndividualProgressAttendanceParticipantRow & { no: number }>
) {
  return rows.map(row => ({
    ...row,
    scheduleHeader: headerPrefix,
  }))
}

export function resolveProgressAttendanceSessionExcelFilename(sessionTitle: string): string {
  const sanitized = sessionTitle.replace(/[\\/:*?"<>|]/g, '_').trim()
  return `출석관리_${sanitized}`
}
