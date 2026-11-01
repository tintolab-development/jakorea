import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import { getProgramProgressDisplayStatus } from '@/shared/constants/status'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import {
  formatParticipatingIndividualParticipantAttendanceScheduleLabel,
  formatParticipatingIndividualParticipantAttendanceShortDateLabel,
} from '@/features/program/general/lib/participating-individual-participant-attendance-display'
import type {
  ParticipatingIndividualParticipantAbsenceReason,
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
import type { AttendanceItemResponse } from '@/shared/api/generated/dashboard/schemas/attendanceItemResponse'
import { mapApiAttendanceStatusToUi } from '@/features/program/general/api/adapters/progress-attendance-adapters'
import { formatArrivalTimeForDisplay } from '@/shared/lib/attendance-arrival-time'

function isRecordedAttendanceCountedAsPresent(
  row: ParticipatingIndividualParticipantAttendanceRow
): boolean {
  return (
    row.attendanceRecorded &&
    (row.attendanceStatus === 'present' || row.attendanceStatus === 'late')
  )
}

function resolveLastAssignedRow(
  rows: ParticipatingIndividualParticipantAttendanceRow[]
): ParticipatingIndividualParticipantAttendanceRow | undefined {
  return rows.reduce<ParticipatingIndividualParticipantAttendanceRow | undefined>((last, row) => {
    if (last == null) return row
    return row.assignedIndex >= last.assignedIndex ? row : last
  }, undefined)
}

function resolveCompletionStatusLabel(
  rows: ParticipatingIndividualParticipantAttendanceRow[],
  participant: ParticipatingIndividualParticipantRow,
  program: Program
): string {
  if (participant.activityWithdrawn) {
    return '수료 불가(활동 포기)'
  }

  const progressStatus = getProgramProgressDisplayStatus(program)
  const educationStarted = rows.some(row => row.educationProgress === 'completed')

  if (progressStatus !== 'PROGRAM_ENDED') {
    return educationStarted ? '교육 진행 중' : '교육 진행 전'
  }

  const lastRow = resolveLastAssignedRow(rows)
  const lastSessionCompleted = lastRow != null && isRecordedAttendanceCountedAsPresent(lastRow)
  const hasRegularAbsence = rows.some(
    row => row.attendanceRecorded && row.attendanceStatus === 'absent'
  )
  const satisfactionRequired = normalizeGeneralSurveyMenuKeys(
    program.generalSurveyMenuKeys ?? []
  ).includes('satisfaction')
  const surveyCompleted = !satisfactionRequired || participant.satisfactionSurveyCompleted

  if (lastSessionCompleted && !hasRegularAbsence && surveyCompleted) {
    return '수료 완료'
  }
  return '수료 불가'
}

export function buildParticipatingIndividualParticipantAttendanceSummary(
  rows: ParticipatingIndividualParticipantAttendanceRow[],
  participant: ParticipatingIndividualParticipantRow,
  program: Program
): ParticipatingIndividualParticipantAttendanceSummary {
  const lateCount = rows.filter(
    row => row.attendanceRecorded && row.attendanceStatus === 'late'
  ).length
  const attendedCount = rows.filter(isRecordedAttendanceCountedAsPresent).length
  const totalCount = rows.length

  return {
    completionStatusLabel: resolveCompletionStatusLabel(rows, participant, program),
    lateCountLabel: `${lateCount}회`,
    attendanceRateCountLabel: `${attendedCount} / ${totalCount}건`,
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
 * 프로그램 전체 출석 bundle에 없는 배정 일정도 출석(기본값) 행으로 남긴다.
 */
function attendanceItemMatchesParticipant(
  item: AttendanceItemResponse,
  participant: ParticipatingIndividualParticipantRow
): boolean {
  if (item.participantId == null) return false
  return String(item.participantId) === String(participant.id)
}

export function buildParticipatingIndividualParticipantAttendanceRowsFromAssigned(input: {
  assignedSessions: readonly ParticipatingSchoolSession[]
  attendanceSessions?: readonly ParticipatingIndividualProgressAttendanceSessionGroup[] | null
  attendancesByScheduleId?: Record<string, AttendanceItemResponse[]> | null
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
    const attendanceItem = (input.attendancesByScheduleId?.[scheduleId] ?? []).find(item =>
      attendanceItemMatchesParticipant(item, input.participant)
    )
    const itemStatus = mapApiAttendanceStatusToUi(attendanceItem?.status)
    const persistedStatus =
      itemStatus ?? self?.persistedAttendanceStatus ?? self?.attendanceStatus
    const attendanceRecorded = persistedStatus != null
    const recordedStatus = attendanceRecorded
      ? mapProgressStatusToDetailStatus(persistedStatus)
      : 'present'
    const educationProgress =
      attendanceSession?.scheduleEducationProgress ??
      mapDashboardScheduleDeliveryToEducationProgress(
        session.deliveryScheduleStatus ??
          (session.status === 'completed' ? 'COMPLETED' : 'SCHEDULED')
      )
    const withdrawn = isAssignedSessionWithdrawn(input.participant, session, index)

    return [
      {
        id: scheduleId,
        scheduleId,
        assignedIndex: index,
        scheduleLabel: formatParticipatingIndividualParticipantAttendanceScheduleLabel(
          input.program,
          session
        ),
        attendanceStatus: withdrawn ? 'withdrawn' : recordedStatus,
        attendanceRecorded: withdrawn ? false : attendanceRecorded,
        lateTime:
          itemStatus === 'late'
            ? formatArrivalTimeForDisplay(attendanceItem?.arrivalTime)
            : self?.lateTime,
        remark: attendanceItem?.absenceReason ?? self?.remark,
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
      assignedIndex: index,
      scheduleLabel: formatParticipatingIndividualParticipantAttendanceScheduleLabel(program, session),
      attendanceStatus: isWithdrawn ? 'withdrawn' : 'present',
      attendanceRecorded: false,
      educationProgress: sessionProgress,
    }
  })
}

export function buildAbsenceReasonsFromRows(
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

export function mergeParticipatingIndividualAbsenceReasons(
  remote: ParticipatingIndividualParticipantAbsenceReason[] | null,
  fromRows: ParticipatingIndividualParticipantAbsenceReason[]
): ParticipatingIndividualParticipantAbsenceReason[] {
  if (remote == null) return fromRows
  const bySchedule = new Map(
    remote.map(item => [item.scheduleRowId, item] as const)
  )
  for (const local of fromRows) {
    if (!bySchedule.has(local.scheduleRowId)) {
      bySchedule.set(local.scheduleRowId, local)
    }
  }
  return [...bySchedule.values()]
}

export function sortParticipatingIndividualParticipantAttendanceRows(
  rows: ParticipatingIndividualParticipantAttendanceRow[]
): ParticipatingIndividualParticipantAttendanceRow[] {
  const active = rows.filter(row => row.attendanceStatus !== 'withdrawn')
  const withdrawn = rows.filter(row => row.attendanceStatus === 'withdrawn')
  return [...active, ...withdrawn]
}
