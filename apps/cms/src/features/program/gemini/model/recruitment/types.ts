/** Gemini 찾아가는 연수 — 모집 공고 상태(신청 기간 대비 오늘 날짜로 파생) */
export type GeminiRecruitmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'ENDED'

export type GeminiRecruitmentRow = {
  id: string
  /** 목록 No. 열 표시값 */
  displayNo: number
  title: string
  applicationPeriodStart: string
  applicationPeriodEnd: string
  trainingRequestPeriodStart: string
  trainingRequestPeriodEnd: string
}

export type GeminiVisitingTrainingTabKey = 'recruitment' | 'approved'
