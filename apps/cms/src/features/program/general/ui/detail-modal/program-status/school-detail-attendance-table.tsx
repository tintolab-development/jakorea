import { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { MASKING_POLICY } from '@/shared/constants/download-policy'
import {
  STUDENT_GENDER_LABELS,
  type SchoolDetailAttendanceStudentRow,
  type SchoolSessionAttendanceStatusKey,
} from '../../../model/school-detail-types'

export const SCHOOL_DETAIL_ATTENDANCE_TABLE_SCROLL_X = 1074

function maskContact(contact?: string): string {
  if (!contact) return '-'
  return MASKING_POLICY.phone(contact) || contact
}

function maskEmail(email?: string): string {
  if (!email) return '-'
  return MASKING_POLICY.email(email) || email
}

function AttendanceStatusRadios({
  value,
  onChange,
}: {
  value: SchoolSessionAttendanceStatusKey
  onChange: (next: SchoolSessionAttendanceStatusKey) => void
}) {
  return (
    <CmsRadioGroup
      className="school-detail-attendance-table__status-radios"
      size="large"
      value={value}
      onChange={event => onChange(event.target.value as SchoolSessionAttendanceStatusKey)}
    >
      <CmsRadio value="present" size="large">
        출석
      </CmsRadio>
      <CmsRadio value="absent" size="large">
        결석
      </CmsRadio>
      <CmsRadio value="late" size="large">
        지각
      </CmsRadio>
    </CmsRadioGroup>
  )
}

export function SchoolDetailAttendanceTable({
  rows,
  onStatusChange,
}: {
  rows: SchoolDetailAttendanceStudentRow[]
  onStatusChange: (studentId: string, status: SchoolSessionAttendanceStatusKey) => void
}) {
  const tableData = useMemo(() => {
    const total = rows.length
    return rows.map((row, index) => ({
      ...row,
      no: total - index,
    }))
  }, [rows])

  const columns: ColumnsType<SchoolDetailAttendanceStudentRow & { no: number }> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 64,
        align: 'center',
      },
      {
        title: '학생명',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        align: 'center',
      },
      {
        title: '성별',
        dataIndex: 'gender',
        key: 'gender',
        width: 80,
        align: 'center',
        render: (value: SchoolDetailAttendanceStudentRow['gender']) =>
          value ? (STUDENT_GENDER_LABELS[value] ?? '-') : '-',
      },
      {
        title: '생년월일',
        dataIndex: 'birthDate',
        key: 'birthDate',
        width: 130,
        align: 'center',
        render: (value: string | undefined) => value ?? '-',
      },
      {
        title: '학급',
        dataIndex: 'gradeClass',
        key: 'gradeClass',
        width: 100,
        align: 'center',
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 140,
        align: 'center',
        render: (value: string | undefined) => maskContact(value),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 180,
        align: 'center',
        ellipsis: true,
        render: (value: string | undefined) => maskEmail(value),
      },
      {
        title: '출결 현황',
        dataIndex: 'status',
        key: 'status',
        width: 260,
        align: 'center',
        onCell: () => ({ className: 'school-detail-attendance-table__status-cell' }),
        render: (status: SchoolSessionAttendanceStatusKey, record) => (
          <AttendanceStatusRadios
            value={status}
            onChange={next => onStatusChange(record.id, next)}
          />
        ),
      },
    ],
    [onStatusChange]
  )

  return (
    <Table<SchoolDetailAttendanceStudentRow & { no: number }>
      rowKey="id"
      className="cms-data-table school-detail-attendance-table"
      columns={columns}
      dataSource={tableData}
      pagination={false}
      tableLayout="fixed"
      scroll={{ x: SCHOOL_DETAIL_ATTENDANCE_TABLE_SCROLL_X }}
    />
  )
}
