import type { ColumnsType } from 'antd/es/table'
import type { ParticipatingIndividualParticipantAttendanceRow } from '@/features/program/general/lib/participating-individual-participant-attendance-types'
import {
  PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_STATUS_LABELS,
  PARTICIPATING_INDIVIDUAL_PARTICIPANT_SESSION_PROGRESS_LABELS,
} from '@/features/program/general/lib/participating-individual-participant-attendance-types'

function resolveAttendanceStatusLabel(row: ParticipatingIndividualParticipantAttendanceRow): string {
  if (row.attendanceStatus === 'late' && row.lateTime) {
    return `지각 (${row.lateTime})`
  }
  return PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_STATUS_LABELS[row.attendanceStatus]
}

export const PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_EXCEL_COLUMNS: ColumnsType<ParticipatingIndividualParticipantAttendanceRow> =
  [
    { title: 'No.', dataIndex: 'no', key: 'no' },
    { title: '교육 진행 일정', dataIndex: 'scheduleLabel', key: 'scheduleLabel' },
    {
      title: '출결 현황',
      key: 'attendanceStatus',
      render: (_value, record) => resolveAttendanceStatusLabel(record),
    },
    {
      title: '교육 진행 현황',
      key: 'educationProgress',
      render: (_value, record) =>
        PARTICIPATING_INDIVIDUAL_PARTICIPANT_SESSION_PROGRESS_LABELS[record.educationProgress],
    },
    {
      title: '비고',
      key: 'remark',
      render: (_value, record) => record.remark?.trim() || '-',
    },
  ]
