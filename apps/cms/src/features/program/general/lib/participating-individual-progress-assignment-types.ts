export const PARTICIPATING_INDIVIDUAL_PROGRESS_ASSIGNMENT_FILTER_ALL = 'all'

export type ParticipatingIndividualProgressAssignmentSubmissionFilter = 'not_submitted' | 'submitted'

export type ParticipatingIndividualProgressAssignmentSubmissionFile = {
  fileName: string
  href: string
  fileObjectId?: number
  downloadable?: boolean
}

export type ParticipatingIndividualProgressAssignmentSubmissionItem =
  | (ParticipatingIndividualProgressAssignmentSubmissionFile & { kind: 'file' })
  | { kind: 'link'; fileName: string; href: string }

export type ParticipatingIndividualProgressAssignmentSubmission =
  | { kind: 'not_submitted' }
  | {
      kind: 'submitted'
      files?: ParticipatingIndividualProgressAssignmentSubmissionFile[]
      items?: ParticipatingIndividualProgressAssignmentSubmissionItem[]
      fileName: string
      href: string
      fileObjectId?: number
      downloadable?: boolean
      secondaryFileName?: string
      secondaryHref?: string
      secondaryFileObjectId?: number
      secondaryDownloadable?: boolean
    }
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
  surveyResponse?: { templateVersionId: number; formResponseId: number }
  satisfactionResponse?: { templateVersionId: number; formResponseId: number }
}

export type ParticipatingIndividualProgressAssignmentSessionGroup = {
  id: string
  round: number
  filterValue: string
  filterLabel: string
  headerTitle: string
  headerDateLabel: string
  headerScheduleSummary: string
  headerPeriodRangeLabel: string
  assignmentPeriodLabel: string
  headerPrefix: string
  participants: ParticipatingIndividualProgressAssignmentParticipantRow[]
}
