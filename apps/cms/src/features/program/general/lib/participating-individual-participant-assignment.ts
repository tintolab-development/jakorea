import type { ParticipatingIndividualParticipantRow } from '@/features/program/general/model/participating-individual-participants'
import type { Program } from '@/types/domain'
import type {
  ParticipatingIndividualParticipantAssignmentBundle,
  ParticipatingIndividualParticipantAssignmentRow,
  ParticipatingIndividualParticipantAssignmentSummary,
  ParticipatingIndividualParticipantAssignmentSubmission,
} from '@/features/program/general/lib/participating-individual-participant-assignment-types'

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
  const teamName = participant.detail?.teamName?.trim() || '-'
  const teamRole =
    participant.detail?.teamRole === 'leader'
      ? ('leader' as const)
      : participant.detail?.teamRole === 'member'
        ? ('member' as const)
        : ('individual' as const)

  return (participant.sessions ?? []).map((session, index) => ({
    id: `asg-${participant.id}-${index}`,
    sessionOrder: index + 1,
    teamRole,
    teamName: teamRole !== 'individual' ? teamName : '-',
    scheduleLabel: `${session.date} (${session.dayOfWeek}) | ${session.classNum}`,
    assignmentPeriodLabel: null,
    submission: { kind: 'none' as const },
    educationProgress: session.status === 'completed' ? ('completed' as const) : ('scheduled' as const),
    countsTowardAssignmentDenominator: session.status === 'completed',
    isTeamSchedule: teamRole !== 'individual',
    countsTowardSurveyDenominator: false,
  }))
}

export function getParticipatingIndividualParticipantAssignmentBundle(
  participant: ParticipatingIndividualParticipantRow,
  _program: Program
): ParticipatingIndividualParticipantAssignmentBundle {
  const rows = buildRowsFromParticipant(participant)

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
