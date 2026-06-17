import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import {
  getParticipatingIndividualParticipantsForProgram,
  type ParticipatingIndividualParticipantRow,
} from '@/data/mock/participating-individual-participants'
import type { Program } from '@/types/domain'
import {
  formatIndividualProgressAssignmentAffiliationGradeLabel,
  formatIndividualProgressAssignmentGenderBirthLabel,
} from '@/features/program/general/lib/participating-individual-progress-assignment-display'
import {
  buildAttendanceSessionFilterLabel,
  buildAttendanceSessionHeaderParts,
  resolveSchoolDetailAttendanceSessionLeadLabel,
} from '@/features/program/general/lib/school-detail-attendance-display'
import type {
  ParticipatingIndividualProgressAssignmentParticipantRow,
  ParticipatingIndividualProgressAssignmentRemarkKind,
  ParticipatingIndividualProgressAssignmentSessionGroup,
  ParticipatingIndividualProgressAssignmentSubmission,
} from '@/features/program/general/lib/participating-individual-progress-assignment-types'

const PROGRESS_ASSIGNMENT_DEMO_SESSIONS: ParticipatingSchoolSession[] = [
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
    date: '2026.01.12',
    dayOfWeek: '월',
    duration: '2시간',
    format: '오프라인',
    classNum: '3교시',
    timeRange: '11:20~13:20',
    status: 'pending',
  },
]

const ASSIGNMENT_PERIOD_BY_ROUND: Record<number, string> = {
  1: '26. 01. 05(월) ~ 26. 01. 09(금)',
  2: '26. 01. 05(월) ~ 26. 01. 09(금)',
}

const REMARK_DATE_LABEL = '26. 01. 11'

const PROGRESS_ASSIGNMENT_DEMO_PARTICIPANT_COUNT = 5

type DemoAssignmentRowDef = {
  submission: ParticipatingIndividualProgressAssignmentSubmission
  remarkKind: ParticipatingIndividualProgressAssignmentRemarkKind
  remarkDateLabel?: string
}

const SESSION_1_ROW_DEFS: DemoAssignmentRowDef[] = [
  { submission: { kind: 'not_submitted' }, remarkKind: 'none' },
  { submission: { kind: 'not_submitted' }, remarkKind: 'none' },
  {
    submission: {
      kind: 'submitted',
      fileName: '1회차_과제_김학생.pdf',
      href: '#',
      secondaryFileName: '1회차_과제_김학생_추가.pdf',
      secondaryHref: '#',
    },
    remarkKind: 'revision_submitted',
    remarkDateLabel: REMARK_DATE_LABEL,
  },
  {
    submission: {
      kind: 'submitted',
      fileName: '1회차_과제_이학생.pdf',
      href: '#',
    },
    remarkKind: 'feedback_delivered',
    remarkDateLabel: REMARK_DATE_LABEL,
  },
  {
    submission: {
      kind: 'submitted',
      fileName: '1회차_과제_박학생.pdf',
      href: '#',
    },
    remarkKind: 'deadline_missed',
    remarkDateLabel: REMARK_DATE_LABEL,
  },
]

const SESSION_2_ROW_DEF: DemoAssignmentRowDef = {
  submission: { kind: 'scheduled' },
  remarkKind: 'none',
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
  const fromSession = participant.sessions?.find(session => session.round === 1)
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
) {
  const detail = template.detail
  const name =
    index === 0 ? '김학생' : index === 1 ? '김학생' : `${template.applicantName}${index > 0 ? ` ${index + 1}` : ''}`.trim()

  return {
    participantId: template.id,
    name,
    genderBirthLabel: formatIndividualProgressAssignmentGenderBirthLabel(
      detail?.gender ?? (index % 2 === 0 ? '남성' : '여성'),
      detail?.birthDate ?? `2010. ${String((index % 12) + 1).padStart(2, '0')}. ${String((index % 28) + 1).padStart(2, '0')}`
    ),
    affiliationGradeLabel: formatIndividualProgressAssignmentAffiliationGradeLabel(
      template.affiliation,
      template.educationGrade
    ),
    affiliation: template.affiliation,
    educationGrade: template.educationGrade,
  }
}

function resolveRowDef(sessionRound: number, index: number): DemoAssignmentRowDef {
  if (sessionRound >= 2) return SESSION_2_ROW_DEF
  return SESSION_1_ROW_DEFS[index] ?? SESSION_1_ROW_DEFS[0]!
}

function buildSessionParticipants(
  session: ParticipatingSchoolSession,
  sessionId: string,
  templates: ParticipatingIndividualParticipantRow[]
): ParticipatingIndividualProgressAssignmentParticipantRow[] {
  if (templates.length === 0) return []

  const rows: ParticipatingIndividualProgressAssignmentParticipantRow[] = []

  for (let index = 0; index < PROGRESS_ASSIGNMENT_DEMO_PARTICIPANT_COUNT; index++) {
    const template = templates[index % templates.length]!
    const withdrawStopRound = resolveActivityWithdrawStopRound(template)
    if (!shouldIncludeParticipantInSession(template, session.round, withdrawStopRound)) {
      continue
    }

    const rowDef = resolveRowDef(session.round, index)
    const meta = buildDemoParticipantMeta(template, index)

    rows.push({
      id: `${sessionId}-participant-${index + 1}`,
      ...meta,
      submission: rowDef.submission,
      remarkKind: rowDef.remarkKind,
      remarkDateLabel: rowDef.remarkDateLabel,
    })
  }

  return rows
}

function toSessionGroup(
  programId: string,
  program: Program,
  session: ParticipatingSchoolSession,
  templates: ParticipatingIndividualParticipantRow[]
): ParticipatingIndividualProgressAssignmentSessionGroup {
  const id = `${programId}-progress-assignment-round-${session.round}`
  const sessionLeadLabel = resolveSchoolDetailAttendanceSessionLeadLabel(program, session.round)
  const header = buildAttendanceSessionHeaderParts(session, sessionLeadLabel)
  const assignmentPeriodLabel = ASSIGNMENT_PERIOD_BY_ROUND[session.round] ?? '-'
  const participants = buildSessionParticipants(session, id, templates)

  return {
    id,
    round: session.round,
    filterValue: id,
    filterLabel: buildAttendanceSessionFilterLabel(session, sessionLeadLabel),
    headerTitle: header.title,
    headerScheduleSummary: header.scheduleSummary,
    headerPeriodRangeLabel: header.periodRangeLabel,
    assignmentPeriodLabel,
    headerPrefix: `${header.title} 과제 제출 기한 : ${assignmentPeriodLabel}`,
    participants,
  }
}

export function getParticipatingIndividualProgressAssignmentSessions(
  program: Program
): ParticipatingIndividualProgressAssignmentSessionGroup[] {
  const programId = String(program.id)
  const templates = resolveApprovedParticipantTemplates(programId)

  const patchedTemplates = templates.map((row, index) => {
    if (index !== 2) return row
    return {
      ...row,
      activityWithdrawn: true,
      activityWithdrawStopSessionKey: `${programId}-progress-assignment-round-1`,
    }
  })

  return PROGRESS_ASSIGNMENT_DEMO_SESSIONS.map(session =>
    toSessionGroup(programId, program, session, patchedTemplates)
  )
}

export function getParticipatingIndividualProgressAssignmentEducationScheduleOptions(
  program: Program
): Array<{ label: string; value: string }> {
  return getParticipatingIndividualProgressAssignmentSessions(program).map(session => ({
    label: session.filterLabel,
    value: session.filterValue,
  }))
}

export function getParticipatingIndividualProgressAssignmentSessionParticipants(
  program: Program,
  sessionId: string
): ParticipatingIndividualProgressAssignmentParticipantRow[] {
  const session = getParticipatingIndividualProgressAssignmentSessions(program).find(
    item => item.id === sessionId
  )
  if (!session) return []
  return session.participants.map(row => ({
    ...row,
    submission: { ...row.submission },
  }))
}
