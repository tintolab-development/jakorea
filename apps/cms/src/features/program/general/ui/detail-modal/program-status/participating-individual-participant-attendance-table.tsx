import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import { CMS_DATA_TABLE_ROW_DISABLED_CLASS } from '@/shared/constants/table'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { ParticipatingIndividualParticipantAttendanceRow } from '@/features/program/general/lib/participating-individual-participant-attendance-types'
import {
  isParticipatingIndividualParticipantAttendanceRowWithdrawn,
  PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_STATUS_LABELS,
  PARTICIPATING_INDIVIDUAL_PARTICIPANT_SESSION_PROGRESS_LABELS,
} from '@/features/program/general/lib/participating-individual-participant-attendance-types'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import {
  ProgramAttendanceStatusText,
  type ProgramAttendanceStatusTextKind,
} from '@/features/program/shared/ui/program-attendance-status-text'

export const PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_TABLE_SCROLL_X = 960

function toAttendanceStatusTextKind(
  status: ParticipatingIndividualParticipantAttendanceRow['attendanceStatus']
): ProgramAttendanceStatusTextKind {
  if (status === 'pending') return 'pending'
  if (status === 'withdrawn') return 'withdrawn'
  return status
}

function renderAttendanceStatus(row: ParticipatingIndividualParticipantAttendanceRow) {
  return (
    <ProgramAttendanceStatusText
      kind={toAttendanceStatusTextKind(row.attendanceStatus)}
      label={PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_STATUS_LABELS[row.attendanceStatus]}
      lateTime={row.lateTime}
    />
  )
}

export function ParticipatingIndividualParticipantAttendanceTable({
  rows,
}: {
  rows: ParticipatingIndividualParticipantAttendanceRow[]
}) {
  const tableData = useMemo(
    () =>
      rows.map((row, index) => ({
        ...row,
        no: rows.length - index,
      })),
    [rows]
  )

  const columns: ColumnsType<
    ParticipatingIndividualParticipantAttendanceRow & { no: number }
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
        title: '교육 진행 일정',
        dataIndex: 'scheduleLabel',
        key: 'scheduleLabel',
        align: 'center',
        render: (value: string | undefined) =>
          renderProgramDetailPipeSeparated(value ? formatCmsScheduleDisplayLabel(value) : value),
      },
      {
        title: '출결 현황',
        key: 'attendanceStatus',
        width: 140,
        align: 'center',
        render: (_value, record) => renderAttendanceStatus(record),
      },
      {
        title: '교육 진행 현황',
        dataIndex: 'educationProgress',
        key: 'educationProgress',
        width: 120,
        align: 'center',
        render: (value: ParticipatingIndividualParticipantAttendanceRow['educationProgress']) =>
          PARTICIPATING_INDIVIDUAL_PARTICIPANT_SESSION_PROGRESS_LABELS[value],
      },
      {
        title: '비고',
        key: 'remark',
        width: 220,
        align: 'center',
        render: (_value, record) => record.remark?.trim() || '-',
      },
    ],
    []
  )

  return (
    <CmsDataTable<ParticipatingIndividualParticipantAttendanceRow & { no: number }>
      rowKey="id"
      className="cms-data-table cms-data-table--fluid participating-individual-participant-attendance-table"
      columns={columns}
      dataSource={tableData}
      pagination={false}
      tableLayout="fixed"
      scroll={{ x: PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_TABLE_SCROLL_X }}
      onRow={record => ({
        className: isParticipatingIndividualParticipantAttendanceRowWithdrawn(record)
          ? CMS_DATA_TABLE_ROW_DISABLED_CLASS
          : undefined,
      })}
    />
  )
}
