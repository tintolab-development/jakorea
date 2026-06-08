import type { ColumnsType } from 'antd/es/table'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import {
  SCHOOL_SESSION_ATTENDANCE_STATUS_LABELS,
  STUDENT_GENDER_LABELS,
  type SchoolDetailAttendanceSessionGroup,
  type SchoolSessionAttendanceStatusKey,
} from '../model/school-detail-types'

export type SchoolDetailAttendanceExcelRow = {
  sessionLabel: string
  no: number
  name: string
  genderLabel: string
  birthDate: string
  gradeClass: string
  contact: string
  email: string
  statusLabel: string
}

export const SCHOOL_DETAIL_ATTENDANCE_EXCEL_COLUMNS: ColumnsType<SchoolDetailAttendanceExcelRow> = [
  { title: '교육 일정', dataIndex: 'sessionLabel', key: 'sessionLabel' },
  { title: 'No.', dataIndex: 'no', key: 'no' },
  { title: '학생명', dataIndex: 'name', key: 'name' },
  { title: '성별', dataIndex: 'genderLabel', key: 'genderLabel' },
  { title: '생년월일', dataIndex: 'birthDate', key: 'birthDate' },
  { title: '학급', dataIndex: 'gradeClass', key: 'gradeClass' },
  { title: '연락처', dataIndex: 'contact', key: 'contact' },
  { title: '이메일', dataIndex: 'email', key: 'email' },
  { title: '출결 현황', dataIndex: 'statusLabel', key: 'statusLabel' },
]

function maskContact(contact?: string): string {
  if (!contact) return ''
  return MASKING_POLICY.phone(contact) || contact
}

function maskEmail(email?: string): string {
  if (!email) return ''
  return MASKING_POLICY.email(email) || email
}

export function buildSchoolDetailAttendanceExcelRows(
  sessionGroups: SchoolDetailAttendanceSessionGroup[]
): SchoolDetailAttendanceExcelRow[] {
  const rows: SchoolDetailAttendanceExcelRow[] = []

  for (const session of sessionGroups) {
    const total = session.students.length
    session.students.forEach((student, index) => {
      rows.push({
        sessionLabel: session.headerPrefix,
        no: total - index,
        name: student.name,
        genderLabel: student.gender ? (STUDENT_GENDER_LABELS[student.gender] ?? '') : '',
        birthDate: student.birthDate ?? '',
        gradeClass: student.gradeClass,
        contact: maskContact(student.contact),
        email: maskEmail(student.email),
        statusLabel:
          SCHOOL_SESSION_ATTENDANCE_STATUS_LABELS[
            student.status as SchoolSessionAttendanceStatusKey
          ] ?? '',
      })
    })
  }

  return rows
}
