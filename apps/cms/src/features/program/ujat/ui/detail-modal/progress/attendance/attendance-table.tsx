import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { CMS_TABLE_NO_COL_CLASS } from '@/shared/constants/table'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
  formatAttendanceRemarks,
  maskAttendanceContact,
  maskAttendanceEmail,
} from './attendance-display'
import { ProgramAttendanceStatusText } from '@/features/program/shared/ui/program-attendance-status-text'
import { formatUjatGradeClassDisplayLabel } from '@/features/program/ujat/lib/ujat-grade-class-display'
import {
  UJAT_ATTENDANCE_STATUS_LABEL,
  type UjatAttendanceStatus,
  type UjatAttendanceVolunteerRow,
} from './types'
import './section.css'

/** Figma 4082:112548 Table / Horizontal */
const UJAT_ATTENDANCE_COL_WIDTH = {
  no: 80,
  name: 140,
  assignedClass: 140,
  contact: 220,
  email: 220,
  status: 220,
  remarksMin: 526,
} as const

const COL_CLASS = {
  name: 'ujat-attendance-table__col-name',
  assignedClass: 'ujat-attendance-table__col-assigned-class',
  contact: 'ujat-attendance-table__col-contact',
  email: 'ujat-attendance-table__col-email',
  status: 'ujat-attendance-table__col-status',
  remarks: 'ujat-attendance-table__col-remarks',
} as const

function columnCellClass(className: string) {
  return {
    onHeaderCell: () => ({ className }),
    onCell: () => ({ className }),
  }
}

/** Figma 프레임 너비 1546 = 고정 열 1020 + 비고 526 */
export const UJAT_ATTENDANCE_TABLE_MIN_SCROLL_X =
  UJAT_ATTENDANCE_COL_WIDTH.no +
  UJAT_ATTENDANCE_COL_WIDTH.name +
  UJAT_ATTENDANCE_COL_WIDTH.assignedClass +
  UJAT_ATTENDANCE_COL_WIDTH.contact +
  UJAT_ATTENDANCE_COL_WIDTH.email +
  UJAT_ATTENDANCE_COL_WIDTH.status +
  UJAT_ATTENDANCE_COL_WIDTH.remarksMin

function AttendanceStatusBadge({ status }: { status: UjatAttendanceStatus }) {
  const label = UJAT_ATTENDANCE_STATUS_LABEL[status]
  if (status === 'late' || status === 'absent') {
    return <ProgramAttendanceStatusText kind={status} label={label} />
  }
  if (status === 'excused_absence') {
    return <ProgramAttendanceStatusText kind="excused_absence" label={label} />
  }
  if (status === 'present') {
    return <ProgramAttendanceStatusText kind="present" label={label} />
  }
  return <span>{label}</span>
}

export function UjatAttendanceTable({
  rows,
}: {
  rows: UjatAttendanceVolunteerRow[]
}) {
  const tableData = useMemo(() => {
    return rows.map((row, index) => ({
      ...row,
      no: index + 1,
    }))
  }, [rows])

  const columns: ColumnsType<UjatAttendanceVolunteerRow & { no: number }> = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: UJAT_ATTENDANCE_COL_WIDTH.no,
        align: 'center',
        className: CMS_TABLE_NO_COL_CLASS,
        ...columnCellClass(CMS_TABLE_NO_COL_CLASS),
      },
      {
        title: '봉사자명',
        dataIndex: 'name',
        key: 'name',
        width: UJAT_ATTENDANCE_COL_WIDTH.name,
        align: 'center',
        ellipsis: true,
        ...columnCellClass(COL_CLASS.name),
      },
      {
        title: '배정 학급',
        dataIndex: 'assignedClass',
        key: 'assignedClass',
        width: UJAT_ATTENDANCE_COL_WIDTH.assignedClass,
        align: 'center',
        ellipsis: true,
        ...columnCellClass(COL_CLASS.assignedClass),
        render: (assignedClass: string) => formatUjatGradeClassDisplayLabel(assignedClass),
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: UJAT_ATTENDANCE_COL_WIDTH.contact,
        align: 'center',
        ellipsis: true,
        ...columnCellClass(COL_CLASS.contact),
        render: (contact: string) => maskAttendanceContact(contact),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: UJAT_ATTENDANCE_COL_WIDTH.email,
        align: 'center',
        ellipsis: true,
        ...columnCellClass(COL_CLASS.email),
        render: (email: string) => maskAttendanceEmail(email),
      },
      {
        title: '교육 출결 현황',
        dataIndex: 'status',
        key: 'status',
        width: UJAT_ATTENDANCE_COL_WIDTH.status,
        align: 'center',
        ...columnCellClass(COL_CLASS.status),
        render: (status: UjatAttendanceStatus) => <AttendanceStatusBadge status={status} />,
      },
      {
        title: '비고',
        key: 'remarks',
        width: UJAT_ATTENDANCE_COL_WIDTH.remarksMin,
        align: 'center',
        ...columnCellClass(COL_CLASS.remarks),
        render: (_: unknown, record: UjatAttendanceVolunteerRow) => (
          <span className="ujat-attendance-table__remarks">{formatAttendanceRemarks(record)}</span>
        ),
      },
    ],
    []
  )

  return (
    <CmsDataTable<UjatAttendanceVolunteerRow & { no: number }>
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
