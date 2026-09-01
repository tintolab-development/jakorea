export const PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL = 'all'

export type ParticipatingIndividualProgressAssignmentSubmissionFilter = 'not_submitted' | 'submitted'

export type ParticipatingIndividualProgressAssignmentSubmission =
  | { kind: 'not_submitted' }
  | { kind: 'submitted'; fileName: string; href: string; secondaryFileName?: string; secondaryHref?: string }
  | { kind: 'scheduled' }

export type ParticipatingIndividualProgressAssignmentRemarkKind =
  | 'none'
  | 'deadline_missed'
  | 'revision_submitted'
  | 'feedback_delivered'

export type ParticipatingIndividualProgressAssignmentFilters = {
  educationSchedule: string
  participantName: string
  affiliation: string
  educationGrade: string
  submissionStatus: string
}

export type ParticipatingIndividualProgressAssignmentParticipantRow = {
  id: string
  participantId: string
  name: string
  genderBirthLabel: string
  affiliationGradeLabel: string
  affiliation: string
  educationGrade: string
  submission: ParticipatingIndividualProgressAssignmentSubmission
  remarkKind: ParticipatingIndividualProgressAssignmentRemarkKind
  remarkDateLabel?: string
}

export type ParticipatingIndividualProgressAssignmentSessionGroup = {
  id: string
  round: number
  filterValue: string
  filterLabel: string
  headerTitle: string
  headerScheduleSummary: string
  headerPeriodRangeLabel: string
  assignmentPeriodLabel: string
  headerPrefix: string
  participants: ParticipatingIndividualProgressAssignmentParticipantRow[]
}
