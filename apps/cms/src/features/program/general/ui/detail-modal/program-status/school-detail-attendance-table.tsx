import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { displayServerPiiAsIs } from '@/features/program/shared/lib/program-pii-display'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { formatSchoolDetailAttendanceClassLabel } from '@/features/program/general/lib/school-detail-attendance-display'
import { SCHOOL_DETAIL_ATTENDANCE_EMPTY_MESSAGES } from '@/features/program/general/lib/school-detail-attendance'
import {
  formatStudentGenderLabel,
  SCHOOL_SESSION_ATTENDANCE_STATUS_LABELS,
  type SchoolDetailAttendanceStudentRow,
  type SchoolSessionAttendanceEditableStatusKey,
  type SchoolSessionAttendanceStatusKey,
} from '../../../model/school-detail-types'

export const SCHOOL_DETAIL_ATTENDANCE_TABLE_SCROLL_X = 1110

function maskContact(contact?: string): string {
  return displayServerPiiAsIs(contact)
}

function maskEmail(email?: string): string {
  return displayServerPiiAsIs(email)
}

function AttendanceStatusRadios({
  value,
  onChange,
}: {
  value: SchoolSessionAttendanceStatusKey
  onChange: (next: SchoolSessionAttendanceEditableStatusKey) => void
}) {
  const selected = value === 'absent' ? value : 'present'
  return (
    <div className="school-detail-attendance-table__status-control">
      <CmsRadioGroup
        className="school-detail-attendance-table__status-radios"
        size="small"
        value={selected}
        onChange={event =>
          onChange(event.target.value as SchoolSessionAttendanceEditableStatusKey)
        }
      >
        <CmsRadio value="present">
          출석
        </CmsRadio>
        <CmsRadio value="absent">
          결석
        </CmsRadio>
      </CmsRadioGroup>
    </div>
  )
}

export function SchoolDetailAttendanceTable({
  rows,
  emptyTitle,
  onStatusChange,
}: {
  rows: SchoolDetailAttendanceStudentRow[]
  emptyTitle?: string
  onStatusChange: (
    studentId: string,
    status: SchoolSessionAttendanceEditableStatusKey
  ) => void
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
        width: 80,
        align: 'center',
      },
      {
        title: '학생명',
        dataIndex: 'name',
        key: 'name',
        width: 88,
        align: 'center',
        className: 'school-detail-attendance-table__col-name',
      },
      {
        title: '성별',
        dataIndex: 'gender',
        key: 'gender',
        width: 72,
        align: 'center',
        className: 'school-detail-attendance-table__col-gender',
        render: (_value: SchoolDetailAttendanceStudentRow['gender'], record) =>
          formatStudentGenderLabel(record.gender, record.genderMask),
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
        render: (value: string | undefined) => formatSchoolDetailAttendanceClassLabel(value),
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
        width: 320,
        minWidth: 320,
        align: 'center',
        ellipsis: false,
        onHeaderCell: () => ({
          className: 'school-detail-attendance-table__status-header',
        }),
        onCell: () => ({ className: 'school-detail-attendance-table__status-cell' }),
        render: (status: SchoolSessionAttendanceStatusKey, record) => {
          if (status === 'excused' || status === 'late') {
            return (
              <span className="school-detail-attendance-table__recorded-status">
                {SCHOOL_SESSION_ATTENDANCE_STATUS_LABELS[status]}
              </span>
            )
          }
          return (
            <AttendanceStatusRadios
              value={status}
              onChange={next => onStatusChange(record.id, next)}
            />
          )
        },
      },
    ],
    [onStatusChange]
  )

  return (
    <CmsDataTable<SchoolDetailAttendanceStudentRow & { no: number }>
      rowKey="id"
      className="cms-data-table school-detail-attendance-table"
      columns={columns}
      dataSource={tableData}
      pagination={false}
      tableLayout="fixed"
      scroll={{ x: SCHOOL_DETAIL_ATTENDANCE_TABLE_SCROLL_X }}
      emptyTitle={emptyTitle ?? SCHOOL_DETAIL_ATTENDANCE_EMPTY_MESSAGES.noStudents}
      emptyDescription={null}
    />
  )
}
