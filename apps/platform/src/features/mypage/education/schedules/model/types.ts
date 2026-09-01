/** 일정 진행 태그 — 교육일 지나면 예정→완료 */
export type EducationScheduleProgressStatus = 'completed' | 'scheduled'

/** 출석 현황 — 미진행(예정) 건은 null */
export type EducationScheduleAttendanceStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'excused'

/**
 * 과제 제출·피드백 상태 (안내 문구·버튼 분기 SSOT)
 * - not_submitted: 미제출
 * - submitted: 제출 완료 (마감 전 수정 가능)
 * - feedback: 담당자 피드백 있음 → 수정 제출
 * - revision_submitted: 피드백 후 수정 제출 완료
 */
export type EducationAssignmentSubmitStatus =
  | 'not_submitted'
  | 'submitted'
  | 'feedback'
  | 'revision_submitted'

export type EducationScheduleAssignmentSubmissionKind = 'file' | 'url'

export type EducationScheduleAssignmentFile = {
  id: string
  /** 표시 라벨 (파일명 또는 URL) */
  fileName: string
  /** 제출 형식 — 칩 스타일 분기 */
  kind: EducationScheduleAssignmentSubmissionKind
}

export type EducationScheduleAssignment = {
  /** 과제 제출 시작일 (ISO). 이 시각 이전·진행 예정이면 과제 영역 비노출 */
  submitStartAt: string
  /** 제출 마감 (ISO) */
  submitEndAt: string
  /** 화면용 기한 라벨 (예: 2026년 04월 03일(금) 15:00 ~ 2026년 04월 10일(금) 18:00) */
  periodLabel: string
  status: EducationAssignmentSubmitStatus
  files?: EducationScheduleAssignmentFile[]
  feedback?: string
}

export type EducationScheduleItem = {
  id: string
  /** 회차 번호(1-based) — 활동 포기 시 `lastParticipatedSession` 필터 */
  sessionNumber: number
  /** 교육 진행일 (ISO date or datetime) */
  heldAt: string
  /** 커리큘럼형 회차명 / 일정형 일정명 */
  title: string
  attendanceStatus: EducationScheduleAttendanceStatus | null
  /** 사유 불참 시 사유 */
  absenceReason?: string
  assignment?: EducationScheduleAssignment
}

export const EDUCATION_SCHEDULE_PAGE_SIZE = 7
