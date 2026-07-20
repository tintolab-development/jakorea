import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'
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

const APPLICANT_18_ATTENDANCE_ROWS: ParticipatingIndividualParticipantAttendanceRow[] = [
  {
    id: 'att-18-5',
    scheduleLabel: '26년 4월 3일 (금) | 오리엔테이션',
    attendanceStatus: 'present',
    educationProgress: 'completed',
  },
  {
    id: 'att-18-4',
    scheduleLabel: '26년 4월 10일 (금) | 1회차',
    attendanceStatus: 'late',
    lateTime: '9:05',
    educationProgress: 'completed',
  },
  {
    id: 'att-18-3',
    scheduleLabel: '26년 4월 17일 (금) | 2회차',
    attendanceStatus: 'excused_absence',
    educationProgress: 'completed',
    remark: '예비군으로 인한 불참',
  },
  {
    id: 'att-18-2',
    scheduleLabel: '26년 4월 24일 (금) | 3회차',
    attendanceStatus: 'pending',
    educationProgress: 'scheduled',
  },
  {
    id: 'att-18-1',
    scheduleLabel: '26년 5월 1일 (금) | 4회차',
    attendanceStatus: 'withdrawn',
    educationProgress: 'scheduled',
  },
]

const APPLICANT_18_ABSENCE_REASONS: ParticipatingIndividualParticipantAttendanceBundle['absenceReasons'] =
  [
    {
      id: 'abs-18-3',
      scheduleRowId: 'att-18-3',
      dateLabel: '4월 17일',
      reason: '예비군으로 인한 불참',
      fileName: '김범수_0417_예비군 불참.pdf',
    },
  ]

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
      id: `att-${participant.id}-${index}`,
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
  if (participant.id === 'general-individual-applicant-18') {
    const rows = APPLICANT_18_ATTENDANCE_ROWS.map(row => ({ ...row }))
    return {
      rows,
      summary: buildParticipatingIndividualParticipantAttendanceSummary(rows, participant, program),
      absenceReasons: APPLICANT_18_ABSENCE_REASONS.map(item => ({ ...item })),
    }
  }

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
