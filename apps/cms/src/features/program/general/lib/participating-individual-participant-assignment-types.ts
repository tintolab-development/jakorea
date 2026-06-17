export type ParticipatingIndividualParticipantAssignmentTeamRole = 'leader' | 'member' | 'individual'

export type ParticipatingIndividualParticipantAssignmentSubmission =
  | { kind: 'none' }
  | { kind: 'not_submitted' }
  | { kind: 'file'; fileName: string }
  | { kind: 'link'; label: string; href: string }
  | { kind: 'survey_view'; submitted: boolean }
  | { kind: 'satisfaction_survey_view'; submitted: boolean }

export type ParticipatingIndividualParticipantAssignmentRow = {
  id: string
  /** 교육 일정 순서(1=가장 이른 일정) */
  sessionOrder: number
  teamRole: ParticipatingIndividualParticipantAssignmentTeamRole
  teamName: string
  scheduleLabel: string
  assignmentPeriodLabel: string | null
  submission: ParticipatingIndividualParticipantAssignmentSubmission
  educationProgress: 'completed' | 'scheduled'
  /** 과제 제출률 분모 — 진행 완료된 강의 중 과제가 있는 회차 */
  countsTowardAssignmentDenominator: boolean
  /** 팀 일정(팀 변경 셀렉트 노출) */
  isTeamSchedule: boolean
  /** 설문 제출률 분모 */
  countsTowardSurveyDenominator: boolean
}

export type ParticipatingIndividualParticipantAssignmentSummary = {
  assignmentSubmittedCount: number
  assignmentTotalCount: number
  surveySubmittedCount: number
  surveyTotalCount: number
}

export type ParticipatingIndividualParticipantAssignmentBundle = {
  rows: ParticipatingIndividualParticipantAssignmentRow[]
  summary: ParticipatingIndividualParticipantAssignmentSummary
}
