import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import {
  getParticipatingIndividualParticipantsForProgram,
  type ParticipatingIndividualParticipantRow,
} from '@/data/mock/participating-individual-participants'
import type { Program } from '@/types/domain'
import {
  formatIndividualProgressAttendanceAffiliationGradeLabel,
  formatIndividualProgressAttendanceGenderBirthLabel,
} from '@/features/program/general/lib/participating-individual-progress-attendance-display'
import {
  buildAttendanceSessionFilterLabel,
  buildAttendanceSessionHeaderParts,
  resolveSchoolDetailAttendanceSessionLeadLabel,
} from '@/features/program/general/lib/school-detail-attendance-display'
import type {
  ParticipatingIndividualProgressAttendanceParticipantRow,
  ParticipatingIndividualProgressAttendanceSessionGroup,
  ParticipatingIndividualProgressAttendanceStatus,
} from '@/features/program/general/lib/participating-individual-progress-attendance-types'

const PROGRESS_ATTENDANCE_DEMO_SESSIONS: ParticipatingSchoolSession[] = [
  {
    round: 1,
    date: '2026.01.09',
    dayOfWeek: '금',
    duration: '2시간',
    format: '오프라인',
    classNum: '1교시',
    timeRange: '9:20~11:20',
    status: 'pending',
  },
  {
    round: 2,
    date: '2026.02.13',
    dayOfWeek: '금',
    duration: '2시간',
    format: '오프라인',
    classNum: '3교시',
    timeRange: '11:20~13:20',
    status: 'pending',
  },
]

const PROGRESS_ATTENDANCE_DEMO_PARTICIPANT_COUNT = 5

type AttendancePatch = {
  attendanceStatus: ParticipatingIndividualProgressAttendanceStatus
  lateTime?: string
  remark?: string
}

/** programId → sessionId → participantRowId → patch */
const attendancePatchStore: Record<string, Record<string, Record<string, AttendancePatch>>> = {}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return Math.abs(h)
}

function resolveDemoSessions(_program: Program): ParticipatingSchoolSession[] {
  return PROGRESS_ATTENDANCE_DEMO_SESSIONS
}

function initialAttendanceStatus(
  participantRowId: string,
  sessionId: string
): AttendancePatch {
  const h = hash(`${participantRowId}:${sessionId}`) % 16
  if (h === 0) return { attendanceStatus: 'absent' }
  if (h === 1) return { attendanceStatus: 'late', lateTime: '9:05' }
  if (h === 2) {
    return {
      attendanceStatus: 'excused_absence',
      remark: '예비군으로 인한 불참',
    }
  }
  return { attendanceStatus: 'present' }
}

function resolveApprovedParticipantTemplates(
  programId: string
): ParticipatingIndividualParticipantRow[] {
  return getParticipatingIndividualParticipantsForProgram(programId).filter(
    row => row.approvalStatus === 'approved'
  )
}

function resolveActivityWithdrawStopRound(
  participant: ParticipatingIndividualParticipantRow
): number | null {
  if (!participant.activityWithdrawn) return null
  const fromSession = participant.sessions?.find(
    session => session.status === 'completed' || session.round === 1
  )
  return fromSession?.round ?? 1
}

function shouldIncludeParticipantInSession(
  participant: ParticipatingIndividualParticipantRow,
  sessionRound: number,
  withdrawStopRound: number | null
): boolean {
  if (!participant.activityWithdrawn) return true
  if (withdrawStopRound == null) return false
  return sessionRound <= withdrawStopRound
}

function buildDemoParticipantMeta(
  template: ParticipatingIndividualParticipantRow,
  index: number
): Pick<
  ParticipatingIndividualProgressAttendanceParticipantRow,
  | 'name'
  | 'genderBirthLabel'
  | 'affiliationGradeLabel'
  | 'affiliation'
  | 'educationGrade'
  | 'contact'
  | 'email'
  | 'participantId'
> {
  const detail = template.detail
  const name =
    index === 0
      ? template.applicantName
      : index % 40 === 0
        ? '김학생'
        : `${template.applicantName}${index > 0 ? ` ${index + 1}` : ''}`.trim()

  return {
    participantId: template.id,
    name,
    genderBirthLabel: formatIndividualProgressAttendanceGenderBirthLabel(
      detail?.gender ?? (index % 2 === 0 ? '남성' : '여성'),
      detail?.birthDate ?? `2010. ${String((index % 12) + 1).padStart(2, '0')}. ${String((index % 28) + 1).padStart(2, '0')}`
    ),
    affiliationGradeLabel: formatIndividualProgressAttendanceAffiliationGradeLabel(
      template.affiliation,
      template.educationGrade
    ),
    affiliation: template.affiliation,
    educationGrade: template.educationGrade,
    contact: detail?.contact ?? `010-${String(1000 + (index % 9000)).padStart(4, '0')}-${String(1000 + (index % 9000)).padStart(4, '0')}`,
    email: detail?.email ?? `participant${index + 1}@example.com`,
  }
}

function buildSessionParticipants(
  programId: string,
  session: ParticipatingSchoolSession,
  sessionId: string,
  templates: ParticipatingIndividualParticipantRow[]
): ParticipatingIndividualProgressAttendanceParticipantRow[] {
  if (templates.length === 0) return []

  const rows: ParticipatingIndividualProgressAttendanceParticipantRow[] = []

  for (let index = 0; index < PROGRESS_ATTENDANCE_DEMO_PARTICIPANT_COUNT; index++) {
    const template = templates[index % templates.length]!
    const withdrawStopRound = resolveActivityWithdrawStopRound(template)
    if (!shouldIncludeParticipantInSession(template, session.round, withdrawStopRound)) {
      continue
    }

    const rowId = `${sessionId}-participant-${index + 1}`
    const meta = buildDemoParticipantMeta(template, index)
    const saved = attendancePatchStore[programId]?.[sessionId]?.[rowId]
    const initial = saved ?? initialAttendanceStatus(rowId, sessionId)

    rows.push({
      id: rowId,
      ...meta,
      attendanceStatus: initial.attendanceStatus,
      lateTime: initial.lateTime,
      remark: initial.remark,
    })
  }

  return rows
}

function toSessionGroup(
  programId: string,
  program: Program,
  session: ParticipatingSchoolSession,
  templates: ParticipatingIndividualParticipantRow[]
): ParticipatingIndividualProgressAttendanceSessionGroup {
  const id = `${programId}-progress-attendance-round-${session.round}`
  const sessionLeadLabel = resolveSchoolDetailAttendanceSessionLeadLabel(program, session.round)
  const header = buildAttendanceSessionHeaderParts(session, sessionLeadLabel)
  const participants = buildSessionParticipants(programId, session, id, templates)

  return {
    id,
    round: session.round,
    filterValue: id,
    filterLabel: buildAttendanceSessionFilterLabel(session, sessionLeadLabel),
    headerTitle: header.title,
    headerScheduleSummary: header.scheduleSummary,
    headerPeriodRangeLabel: header.periodRangeLabel,
    headerPrefix: header.headerPrefix,
    participants,
  }
}

export function getParticipatingIndividualProgressAttendanceSessions(
  program: Program
): ParticipatingIndividualProgressAttendanceSessionGroup[] {
  const programId = String(program.id)
  const templates = resolveApprovedParticipantTemplates(programId)

  const patchedTemplates = templates.map((row, index) => {
    if (index !== 2) return row
    return {
      ...row,
      activityWithdrawn: true,
      activityWithdrawStopSessionKey: `${programId}-progress-attendance-round-1`,
    }
  })

  return resolveDemoSessions(program).map(session =>
    toSessionGroup(programId, program, session, patchedTemplates)
  )
}

export function getParticipatingIndividualProgressAttendanceEducationScheduleOptions(
  program: Program
): Array<{ label: string; value: string }> {
  return getParticipatingIndividualProgressAttendanceSessions(program).map(session => ({
    label: session.filterLabel,
    value: session.filterValue,
  }))
}

export function patchParticipatingIndividualProgressAttendanceParticipant(
  programId: string,
  sessionId: string,
  participantRowId: string,
  patch: AttendancePatch
): void {
  if (!attendancePatchStore[programId]) {
    attendancePatchStore[programId] = {}
  }
  if (!attendancePatchStore[programId][sessionId]) {
    attendancePatchStore[programId][sessionId] = {}
  }
  attendancePatchStore[programId][sessionId]![participantRowId] = patch
}

export function getParticipatingIndividualProgressAttendanceSessionParticipants(
  program: Program,
  sessionId: string
): ParticipatingIndividualProgressAttendanceParticipantRow[] {
  const session = getParticipatingIndividualProgressAttendanceSessions(program).find(
    item => item.id === sessionId
  )
  if (!session) return []
  return session.participants.map(row => ({ ...row }))
}
