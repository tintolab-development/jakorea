/** Gemini 찾아가는 연수 — 모집 공고 신청기간 기준 상태(오늘 날짜로 파생) */
export type GeminiRecruitmentPeriodStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'ENDED'

/** 목록·필터 표시 상태 (임시저장 포함) */
export type GeminiRecruitmentDisplayStatus = GeminiRecruitmentPeriodStatus | 'DRAFT'

/** @deprecated `GeminiRecruitmentPeriodStatus` 사용 권장 */
export type GeminiRecruitmentStatus = GeminiRecruitmentPeriodStatus

export const GEMINI_RECRUITMENT_DRAFT_ROW_ID = 'gvt-recruitment-draft'

export type GeminiRecruitmentRow = {
  id: string
  /** 목록 No. 열 표시값 */
  displayNo: number
  title: string
  applicationPeriodStart: string
  applicationPeriodEnd: string
  trainingRequestPeriodStart: string
  trainingRequestPeriodEnd: string
  /** 임시저장 공고 — 신청기간과 무관하게 [임시저장] 표시 */
  isDraft?: boolean
}

export type GeminiVisitingTrainingTabKey = 'recruitment' | 'approved'
