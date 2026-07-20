import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'
import type { Program } from '@/types/domain'
import type {
  ParticipatingIndividualParticipantAssignmentBundle,
  ParticipatingIndividualParticipantAssignmentRow,
  ParticipatingIndividualParticipantAssignmentSummary,
  ParticipatingIndividualParticipantAssignmentSubmission,
} from '@/features/program/general/lib/participating-individual-participant-assignment-types'

const APPLICANT_18_ASSIGNMENT_ROWS: ParticipatingIndividualParticipantAssignmentRow[] = [
  {
    id: 'asg-18-1',
    sessionOrder: 1,
    teamRole: 'individual',
    teamName: '-',
    scheduleLabel: '26년 4월 3일 (금) | 오리엔테이션',
    assignmentPeriodLabel: null,
    submission: { kind: 'none' },
    educationProgress: 'completed',
    countsTowardAssignmentDenominator: false,
    isTeamSchedule: false,
    countsTowardSurveyDenominator: false,
  },
  {
    id: 'asg-18-2',
    sessionOrder: 2,
    teamRole: 'leader',
    teamName: '우리가 최고',
    scheduleLabel: '26년 4월 10일 (금) | 1회차',
    assignmentPeriodLabel: '26.01.05 (월) ~ 26.01.09 (금)',
    submission: {
      kind: 'file',
      fileName: '김범수_1회차_과제.pdf',
    },
    educationProgress: 'completed',
    countsTowardAssignmentDenominator: true,
    isTeamSchedule: true,
    countsTowardSurveyDenominator: false,
  },
  {
    id: 'asg-18-3',
    sessionOrder: 3,
    teamRole: 'member',
    teamName: '우리가 최고',
    scheduleLabel: '26년 4월 17일 (금) | 2회차',
    assignmentPeriodLabel: '26.01.12 (월) ~ 26.01.16 (금)',
    submission: {
      kind: 'file',
      fileName: '김범수_2회차_과제.pdf',
    },
    educationProgress: 'completed',
    countsTowardAssignmentDenominator: true,
    isTeamSchedule: true,
    countsTowardSurveyDenominator: false,
  },
  {
    id: 'asg-18-4',
    sessionOrder: 4,
    teamRole: 'member',
    teamName: '우리가 최고',
    scheduleLabel: '26년 4월 24일 (금) | 3회차',
    assignmentPeriodLabel: '26.01.19 (월) ~ 26.01.23 (금)',
    submission: {
      kind: 'link',
      label: 'https://docs.google.com/example',
      href: 'https://docs.google.com/example',
    },
    educationProgress: 'completed',
    countsTowardAssignmentDenominator: true,
    isTeamSchedule: true,
    countsTowardSurveyDenominator: false,
  },
  {
    id: 'asg-18-5',
    sessionOrder: 5,
    teamRole: 'individual',
    teamName: '-',
    scheduleLabel: '26년 5월 1일 (금) | 4회차',
    assignmentPeriodLabel: '26.01.26 (월) ~ 26.01.30 (금)',
    submission: { kind: 'not_submitted' },
    educationProgress: 'completed',
    countsTowardAssignmentDenominator: true,
    isTeamSchedule: false,
    countsTowardSurveyDenominator: false,
  },
  {
    id: 'asg-18-6',
    sessionOrder: 6,
    teamRole: 'individual',
    teamName: '-',
    scheduleLabel: '26년 5월 8일 (금) | 설문',
    assignmentPeriodLabel: null,
    submission: { kind: 'survey_view', submitted: true },
    educationProgress: 'completed',
    countsTowardAssignmentDenominator: false,
    isTeamSchedule: false,
    countsTowardSurveyDenominator: true,
  },
  {
    id: 'asg-18-7',
    sessionOrder: 7,
    teamRole: 'individual',
    teamName: '-',
    scheduleLabel: '26년 5월 15일 (금) | 만족도조사',
    assignmentPeriodLabel: null,
    submission: { kind: 'satisfaction_survey_view', submitted: false },
    educationProgress: 'scheduled',
    countsTowardAssignmentDenominator: false,
    isTeamSchedule: false,
    countsTowardSurveyDenominator: true,
  },
]

function isSubmissionCountedAsSubmitted(
  submission: ParticipatingIndividualParticipantAssignmentSubmission
): boolean {
  if (submission.kind === 'file' || submission.kind === 'link') return true
  if (submission.kind === 'survey_view' || submission.kind === 'satisfaction_survey_view') {
    return submission.submitted
  }
  return false
}

export function buildParticipatingIndividualParticipantAssignmentSummary(
  rows: ParticipatingIndividualParticipantAssignmentRow[]
): ParticipatingIndividualParticipantAssignmentSummary {
  const assignmentRows = rows.filter(row => row.countsTowardAssignmentDenominator)
  const surveyRows = rows.filter(row => row.countsTowardSurveyDenominator)

  return {
    assignmentSubmittedCount: assignmentRows.filter(row =>
      isSubmissionCountedAsSubmitted(row.submission)
    ).length,
    assignmentTotalCount: assignmentRows.length,
    surveySubmittedCount: surveyRows.filter(row => isSubmissionCountedAsSubmitted(row.submission))
      .length,
    surveyTotalCount: surveyRows.length,
  }
}

function buildRowsFromParticipant(
  participant: ParticipatingIndividualParticipantRow
): ParticipatingIndividualParticipantAssignmentRow[] {
  const teamName = participant.detail?.teamName?.trim() || '우리가 최고'
  const teamRole =
    participant.detail?.teamRole === 'leader'
      ? ('leader' as const)
      : participant.detail?.teamRole === 'member'
        ? ('member' as const)
        : ('individual' as const)

  return (participant.sessions ?? []).map((session, index) => ({
    id: `asg-${participant.id}-${index}`,
    sessionOrder: index + 1,
    teamRole: index % 2 === 0 ? teamRole : 'individual',
    teamName: index % 2 === 0 && teamRole !== 'individual' ? teamName : '-',
    scheduleLabel: `${session.date} (${session.dayOfWeek}) | ${session.classNum}`,
    assignmentPeriodLabel: index % 3 === 0 ? null : '26.01.05 (월) ~ 26.01.09 (금)',
    submission: { kind: 'none' as const },
    educationProgress: session.status === 'completed' ? ('completed' as const) : ('scheduled' as const),
    countsTowardAssignmentDenominator:
      session.status === 'completed' && index % 3 !== 0,
    isTeamSchedule: index % 2 === 0 && teamRole !== 'individual',
    countsTowardSurveyDenominator: false,
  }))
}

export function getParticipatingIndividualParticipantAssignmentBundle(
  participant: ParticipatingIndividualParticipantRow,
  _program: Program
): ParticipatingIndividualParticipantAssignmentBundle {
  const rows =
    participant.id === 'general-individual-applicant-18'
      ? APPLICANT_18_ASSIGNMENT_ROWS.map(row => ({ ...row }))
      : buildRowsFromParticipant(participant)

  return {
    rows,
    summary: buildParticipatingIndividualParticipantAssignmentSummary(rows),
  }
}

export function sortParticipatingIndividualParticipantAssignmentRows(
  rows: ParticipatingIndividualParticipantAssignmentRow[]
): ParticipatingIndividualParticipantAssignmentRow[] {
  return [...rows].sort((a, b) => b.sessionOrder - a.sessionOrder)
}

export function applyTeamNameFromSessionOrder(
  rows: ParticipatingIndividualParticipantAssignmentRow[],
  fromSessionOrder: number,
  teamName: string
): ParticipatingIndividualParticipantAssignmentRow[] {
  return rows.map(row => {
    if (!row.isTeamSchedule || row.sessionOrder < fromSessionOrder) return row
    return { ...row, teamName }
  })
}
