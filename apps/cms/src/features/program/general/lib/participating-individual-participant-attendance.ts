import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { Program } from '@/types/domain'
import { getProgramProgressDisplayStatus } from '@/shared/constants/status'
import { programEnrollmentDisplayConfig } from '@/shared/constants/status'
import {
  formatParticipatingIndividualParticipantAttendanceScheduleLabel,
  formatParticipatingIndividualParticipantAttendanceShortDateLabel,
} from '@/features/program/general/lib/participating-individual-participant-attendance-display'
import type {
  ParticipatingIndividualParticipantAttendanceBundle,
  ParticipatingIndividualParticipantAttendanceRow,
  ParticipatingIndividualParticipantAttendanceSummary,
} from '@/features/program/general/lib/participating-individual-participant-attendance-types'

function resolveCompletionStatusLabel(
  participant: ParticipatingIndividualParticipantRow,
  program: Program
): string {
  if (participant.activityWithdrawn) {
    return '수료 불가(활동 포기)'
  }

  const progressStatus = getProgramProgressDisplayStatus(program)
  const progressLabel = programEnrollmentDisplayConfig.labels[progressStatus]

  if (progressLabel === '프로그램 종료') {
    return '수료 완료'
  }
  if (progressLabel === '프로그램 진행 중') {
    return '교육 진행 중'
  }
  return '교육 진행 전'
}

export function buildParticipatingIndividualParticipantAttendanceSummary(
  rows: ParticipatingIndividualParticipantAttendanceRow[],
  participant: ParticipatingIndividualParticipantRow,
  program: Program
): ParticipatingIndividualParticipantAttendanceSummary {
  const lateCount = rows.filter(row => row.attendanceStatus === 'late').length
  const attendedCount = rows.filter(row => row.attendanceStatus === 'present').length
  const heldCount = rows.filter(
    row =>
      row.educationProgress === 'completed' &&
      row.attendanceStatus !== 'withdrawn' &&
      row.attendanceStatus !== 'pending'
  ).length

  return {
    completionStatusLabel: resolveCompletionStatusLabel(participant, program),
    lateCountLabel: `${lateCount}회`,
    attendanceRateCountLabel: `${attendedCount} / ${Math.max(heldCount, 1)}건`,
  }
}

function buildRowsFromParticipantSessions(
  participant: ParticipatingIndividualParticipantRow,
  program: Program
): ParticipatingIndividualParticipantAttendanceRow[] {
  const sessions = participant.sessions ?? []
  if (sessions.length === 0) return []

  return sessions.map((session, index) => {
    const sessionProgress =
      session.status === 'completed' ? ('completed' as const) : ('scheduled' as const)
    const isWithdrawn =
      participant.activityWithdrawn &&
      participant.activityWithdrawStopSessionKey != null &&
      session.round === index + 1

    return {
      id:
        session.resolvedScheduleId != null
          ? String(session.resolvedScheduleId)
          : `att-${participant.id}-${index}`,
      scheduleId:
        session.resolvedScheduleId != null ? String(session.resolvedScheduleId) : null,
      scheduleLabel: formatParticipatingIndividualParticipantAttendanceScheduleLabel(program, session),
      attendanceStatus: isWithdrawn
        ? 'withdrawn'
        : sessionProgress === 'completed'
          ? 'present'
          : 'pending',
      educationProgress: sessionProgress,
    }
  })
}

function buildAbsenceReasonsFromRows(
  rows: ParticipatingIndividualParticipantAttendanceRow[]
): ParticipatingIndividualParticipantAttendanceBundle['absenceReasons'] {
  return rows
    .filter(row => row.attendanceStatus === 'excused_absence' && row.remark?.trim())
    .map(row => ({
      id: `abs-${row.id}`,
      scheduleRowId: row.id,
      dateLabel: formatParticipatingIndividualParticipantAttendanceShortDateLabel(row.scheduleLabel),
      reason: row.remark!.trim(),
      fileName: null,
    }))
}

export function getParticipatingIndividualParticipantAttendanceBundle(
  participant: ParticipatingIndividualParticipantRow,
  program: Program
): ParticipatingIndividualParticipantAttendanceBundle {
  const rows = buildRowsFromParticipantSessions(participant, program)
  return {
    rows,
    summary: buildParticipatingIndividualParticipantAttendanceSummary(rows, participant, program),
    absenceReasons: buildAbsenceReasonsFromRows(rows),
  }
}

export function sortParticipatingIndividualParticipantAttendanceRows(
  rows: ParticipatingIndividualParticipantAttendanceRow[]
): ParticipatingIndividualParticipantAttendanceRow[] {
  const active = rows.filter(row => row.attendanceStatus !== 'withdrawn')
  const withdrawn = rows.filter(row => row.attendanceStatus === 'withdrawn')
  return [...active, ...withdrawn]
}
