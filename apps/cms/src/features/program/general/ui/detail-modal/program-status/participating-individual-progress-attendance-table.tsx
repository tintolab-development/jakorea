import { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  maskProgressAttendanceContact,
  maskProgressAttendanceEmail,
  resolveProgressAttendanceRemark,
  resolveProgressAttendanceStatusLabel,
  toProgressAttendanceStatusTextKind,
} from '@/features/program/general/lib/participating-individual-progress-attendance-display'
import type { ParticipatingIndividualProgressAttendanceParticipantRow } from '@/features/program/general/lib/participating-individual-progress-attendance-types'
import { ProgramAttendanceStatusText } from '@/features/program/shared/ui/program-attendance-status-text'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import '@/features/program/shared/ui/program-attendance-detail.css'

export const PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_TABLE_SCROLL_X = 1280

export function ParticipatingIndividualProgressAttendanceTable({
  rows,
}: {
  rows: ParticipatingIndividualProgressAttendanceParticipantRow[]
}) {
  const tableData = useMemo(() => {
    const total = rows.length
    return rows.map((row, index) => ({
      ...row,
      no: total - index,
    }))
  }, [rows])

  const columns: ColumnsType<
    ParticipatingIndividualProgressAttendanceParticipantRow & { no: number }
  > = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 80,
        align: 'center',
      },
      {
        title: '참여자명',
        dataIndex: 'name',
        key: 'name',
        width: 120,
        align: 'center',
      },
      {
        title: '성별 및 생년월일',
        dataIndex: 'genderBirthLabel',
        key: 'genderBirthLabel',
        width: 180,
        align: 'center',
        render: (value: string | undefined) => renderProgramDetailPipeSeparated(value),
      },
      {
        title: '소속 및 학년',
        dataIndex: 'affiliationGradeLabel',
        key: 'affiliationGradeLabel',
        width: 200,
        align: 'center',
        render: (value: string | undefined) => renderProgramDetailPipeSeparated(value),
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 140,
        align: 'center',
        render: (value: string | undefined) => maskProgressAttendanceContact(value),
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 200,
        align: 'center',
        ellipsis: true,
        render: (value: string | undefined) => maskProgressAttendanceEmail(value),
      },
      {
        title: '출결 현황',
        key: 'attendanceStatus',
        width: 120,
        align: 'center',
        render: (_value, record) => (
          <ProgramAttendanceStatusText
            kind={toProgressAttendanceStatusTextKind(record.attendanceStatus)}
            label={resolveProgressAttendanceStatusLabel(record)}
            lateTime={record.lateTime}
          />
        ),
      },
      {
        title: '비고',
        key: 'remark',
        width: 200,
        align: 'center',
        ellipsis: true,
        render: (_value, record) => resolveProgressAttendanceRemark(record),
      },
    ],
    []
  )

  return (
    <Table<ParticipatingIndividualProgressAttendanceParticipantRow & { no: number }>
      rowKey="id"
      className="cms-data-table participating-individual-progress-attendance-table"
      columns={columns}
      dataSource={tableData}
      pagination={false}
      tableLayout="fixed"
      scroll={{ x: PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_TABLE_SCROLL_X }}
    />
  )
}
