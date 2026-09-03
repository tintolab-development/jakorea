import { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  formatAttendanceRemarks,
  maskAttendanceContact,
  maskAttendanceEmail,
} from './attendance-display'
import { ProgramAttendanceStatusText } from '@/features/program/shared/ui/program-attendance-status-text'
import {
  UJAT_ATTENDANCE_STATUS_LABEL,
  type UjatAttendanceStatus,
  type UjatAttendanceVolunteerRow,
} from './types'
import './section.css'

function AttendanceStatusBadge({ status }: { status: UjatAttendanceStatus }) {
  const label = UJAT_ATTENDANCE_STATUS_LABEL[status]
  if (status === 'late' || status === 'absent') {
    return <ProgramAttendanceStatusText kind={status} label={label} />
  }
  if (status === 'excused_absence') {
    return <ProgramAttendanceStatusText kind="excused_absence" label={label} />
  }
  return <span>{label}</span>
}

export const UJAT_ATTENDANCE_TABLE_MIN_SCROLL_X = 980

export function UjatAttendanceTable({
  rows,
}: {
  rows: UjatAttendanceVolunteerRow[]
}) {
  const tableData = useMemo(() => {
    const total = rows.length
    return rows.map((row, index) => ({
      ...row,
      no: total - index,
    }))
  }, [rows])

  const columns: ColumnsType<UjatAttendanceVolunteerRow & { no: number }> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 80,
        align: 'center',
      },
      {
        title: '봉사자명',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        align: 'center',
      },
      {
        title: '배정 학급',
        dataIndex: 'assignedClass',
        key: 'assignedClass',
        width: 120,
        align: 'center',
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 140,
        align: 'center',
        render: (contact: string) => maskAttendanceContact(contact),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 180,
        align: 'center',
        ellipsis: true,
        render: (email: string) => maskAttendanceEmail(email),
      },
      {
        title: '교육 출결 현황',
        dataIndex: 'status',
        key: 'status',
        width: 140,
        align: 'center',
        render: (status: UjatAttendanceStatus) => <AttendanceStatusBadge status={status} />,
      },
      {
        title: '비고',
        key: 'remarks',
        width: 200,
        align: 'center',
        ellipsis: true,
        render: (_: unknown, record: UjatAttendanceVolunteerRow) => formatAttendanceRemarks(record),
      },
    ],
    []
  )

  return (
    <Table<UjatAttendanceVolunteerRow & { no: number }>
      rowKey="id"
      className="cms-data-table ujat-attendance-table"
      columns={columns}
      dataSource={tableData}
      pagination={false}
      tableLayout="fixed"
      scroll={{ x: UJAT_ATTENDANCE_TABLE_MIN_SCROLL_X }}
      onRow={record => ({
        className: record.isDropout ? 'ujat-attendance-table__row--dropout' : undefined,
      })}
    />
  )
}
