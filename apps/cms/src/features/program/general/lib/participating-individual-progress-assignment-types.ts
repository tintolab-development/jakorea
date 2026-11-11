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
  /** 과제 응답 id — 피드백 작성·보기 키. 응답에 없으면 undefined(피드백 버튼 비활성) */
  assignmentFormResponseId?: number
  /**
   * 과제 응답 행에 BE N7 필드(`formResponseId` 키)가 있었는지. true면 응답 id null = 미제출 → 버튼 숨김,
   * 없으면(구버전) 기존처럼 비활성 버튼.
   */
  assignmentFeedbackFieldsProvided?: boolean
  /** BE N7 `hasFeedback` — true 「피드백 보기」, false 「피드백 작성」. 구버전 응답엔 없음 */
  assignmentHasFeedback?: boolean
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
  /** 교육 일정(startAt/endAt) 기준 진행 현황 — 과제 제출 상태와 별개 */
  scheduleEducationProgress: 'completed' | 'scheduled'
  participants: ParticipatingIndividualProgressAssignmentParticipantRow[]
}
