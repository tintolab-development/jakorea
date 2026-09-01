export type ParticipatingIndividualInstructorLectureProgress =
  | 'completed'
  | 'scheduled'
  | 'activity_withdrawn'

export type ParticipatingIndividualInstructorSubmissionStatus =
  | 'submitted'
  | 'not_submitted'
  | 'scheduled'

export type ParticipatingIndividualInstructorLectureReportRow = {
  id: string
  /** 교육 진행 일정 — 날짜·시간·회차/일정명(없을 수 있음) */
  scheduleLabel: string
  /** 강의보고서 제출 기한 — 익월 5일까지 */
  submissionPeriodLabel: string
  lectureProgress: ParticipatingIndividualInstructorLectureProgress
  submissionStatus: ParticipatingIndividualInstructorSubmissionStatus
  canViewReport: boolean
}
