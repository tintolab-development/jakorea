import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
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
  ParticipatingIndividualParticipantAttendanceStatus,
  ParticipatingIndividualParticipantAttendanceSummary,
} from '@/features/program/general/lib/participating-individual-participant-attendance-types'
import { mapDashboardScheduleDeliveryToEducationProgress } from '@/features/program/general/lib/dashboard-schedule-delivery-status'
import { buildParticipatingSchoolSessionKey } from '@/features/program/general/lib/participating-institution-activity-withdraw'
import type {
  ParticipatingIndividualProgressAttendanceSessionGroup,
  ParticipatingIndividualProgressAttendanceStatus,
} from '@/features/program/general/lib/participating-individual-progress-attendance-types'

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

function mapProgressStatusToDetailStatus(
  status: ParticipatingIndividualProgressAttendanceStatus
): ParticipatingIndividualParticipantAttendanceStatus {
  if (status === 'late') return 'late'
  if (status === 'excused_absence') return 'excused_absence'
  if (status === 'present') return 'present'
  return 'absent'
}

function isAssignedSessionWithdrawn(
  participant: ParticipatingIndividualParticipantRow,
  session: ParticipatingSchoolSession,
  index: number
): boolean {
  if (!participant.activityWithdrawn) return false
  const stopKey = participant.activityWithdrawStopSessionKey?.trim()
  if (!stopKey) return false
  return buildParticipatingSchoolSessionKey(session, index) === stopKey
}

/**
 * 참여자 상세 출석 관리 — education-scope 배정 일정만 행으로 만든다.
 * 프로그램 전체 출석 bundle에 없는 배정 일정도 pending 행으로 남긴다.
 */
export function buildParticipatingIndividualParticipantAttendanceRowsFromAssigned(input: {
  assignedSessions: readonly ParticipatingSchoolSession[]
  attendanceSessions?: readonly ParticipatingIndividualProgressAttendanceSessionGroup[] | null
  participant: ParticipatingIndividualParticipantRow
  program: Program
}): ParticipatingIndividualParticipantAttendanceRow[] {
  const attendanceByScheduleId = new Map(
    (input.attendanceSessions ?? []).map(session => [session.id, session] as const)
  )

  const rows = input.assignedSessions.flatMap((session, index) => {
    const scheduleId =
      typeof session.resolvedScheduleId === 'number' &&
      Number.isFinite(session.resolvedScheduleId) &&
      session.resolvedScheduleId > 0
        ? String(session.resolvedScheduleId)
        : null
    if (scheduleId == null) return []

    const attendanceSession = attendanceByScheduleId.get(scheduleId)
    const self = attendanceSession?.participants.find(
      row => row.participantId === input.participant.id
    )
    const recordedStatus =
      self?.attendanceRecorded && self.attendanceStatus != null
        ? mapProgressStatusToDetailStatus(self.attendanceStatus)
        : 'pending'
    const educationProgress =
      attendanceSession?.scheduleEducationProgress ??
      mapDashboardScheduleDeliveryToEducationProgress(
        session.deliveryScheduleStatus ??
          (session.status === 'completed' ? 'COMPLETED' : 'SCHEDULED')
      )

    return [
      {
        id: scheduleId,
        scheduleId,
        scheduleLabel: formatParticipatingIndividualParticipantAttendanceScheduleLabel(
          input.program,
          session
        ),
        attendanceStatus: isAssignedSessionWithdrawn(input.participant, session, index)
          ? 'withdrawn'
          : recordedStatus,
        lateTime: self?.lateTime,
        remark: self?.remark,
        educationProgress,
      } satisfies ParticipatingIndividualParticipantAttendanceRow,
    ]
  })

  return sortParticipatingIndividualParticipantAttendanceRows(rows)
}

function buildRowsFromParticipantSessions(
  participant: ParticipatingIndividualParticipantRow,
  program: Program
): ParticipatingIndividualParticipantAttendanceRow[] {
  const sessions = participant.sessions ?? []
  if (sessions.length === 0) return []

  return sessions.map((session, index) => {
    const sessionProgress = mapDashboardScheduleDeliveryToEducationProgress(
      session.deliveryScheduleStatus ??
        (session.status === 'completed' ? 'COMPLETED' : 'SCHEDULED')
    )
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
      attendanceStatus: isWithdrawn ? 'withdrawn' : 'pending',
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
