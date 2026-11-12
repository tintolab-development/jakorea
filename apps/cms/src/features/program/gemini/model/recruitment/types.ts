/** Gemini 찾아가는 연수 — 모집 공고 신청기간 기준 상태(오늘 날짜로 파생) */
export type GeminiRecruitmentPeriodStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'ENDED'

/** 목록·필터 표시 상태 (DRAFT = 미게시 공고) */
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
  /** 서버 draftStatus=DRAFT — 게시 여부 '미게시'로 등록한 공고. 신청기간과 무관하게 [미게시] 표시 (QA-0101) */
  isDraft?: boolean
  /** 신청 기관 수. 1 이상이면 공고 삭제 불가 */
  organizationApplicationCount?: number
  /** 승인된 기관 수. 교육 진행으로 이어진 이력으로 본다 */
  approvedOrganizationApplicationCount?: number
}

export type GeminiVisitingTrainingTabKey = 'recruitment' | 'approved'
