import type { ColumnsType } from 'antd/es/table'
import {
  attendanceStatusLabel,
  formatAttendanceRemarks,
  maskAttendanceContact,
  maskAttendanceEmail,
} from './attendance-display'
import type { UjatAttendanceSessionGroup, UjatAttendanceVolunteerRow } from './types'
import { formatUjatGradeClassDisplayLabel } from '@/features/program/ujat/lib/ujat-grade-class-display'

export type UjatAttendanceSessionExcelRow = {
  no: number
  name: string
  assignedClass: string
  contact: string
  email: string
  statusLabel: string
  remarks: string
}

export const UJAT_ATTENDANCE_SESSION_EXCEL_COLUMNS: ColumnsType<UjatAttendanceSessionExcelRow> = [
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '봉사자명', dataIndex: 'name', key: 'name' },
  { title: '배정 학급', dataIndex: 'assignedClass', key: 'assignedClass' },
  { title: '연락처', dataIndex: 'contact', key: 'contact' },
  { title: '이메일', dataIndex: 'email', key: 'email' },
  { title: '교육 출결 현황', dataIndex: 'statusLabel', key: 'statusLabel' },
  { title: '비고', dataIndex: 'remarks', key: 'remarks' },
]

export function buildUjatAttendanceSessionExcelRows(
  volunteers: UjatAttendanceVolunteerRow[]
): UjatAttendanceSessionExcelRow[] {
  const total = volunteers.length
  return volunteers.map((volunteer, index) => ({
    no: total - index,
    name: volunteer.name,
    assignedClass: formatUjatGradeClassDisplayLabel(volunteer.assignedClass),
    contact: maskAttendanceContact(volunteer.contact),
    email: maskAttendanceEmail(volunteer.email),
    statusLabel: attendanceStatusLabel(volunteer.status),
    remarks: formatAttendanceRemarks(volunteer),
  }))
}

export function resolveUjatAttendanceSessionExcelFilename(
  session: Pick<UjatAttendanceSessionGroup, 'dateLabel' | 'institutionName'>
): string {
  const label = `${session.dateLabel}_${session.institutionName}`
    .replace(/[\\/:*?"<>|]/g, '')
    .trim()
  return label ? `출석관리_${label}` : '출석관리'
}
