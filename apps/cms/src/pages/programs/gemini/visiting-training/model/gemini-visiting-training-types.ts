/** Gemini 찾아가는 연수 — 모집 공고 상태 */
export type GeminiVisitingTrainingRecruitmentStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'ENDED'

export type GeminiVisitingTrainingRecruitmentRow = {
  id: string
  /** 목록 No. 열 표시값 */
  displayNo: number
  title: string
  applicationPeriodStart: string
  applicationPeriodEnd: string
  trainingRequestPeriodStart: string
  trainingRequestPeriodEnd: string
  status: GeminiVisitingTrainingRecruitmentStatus
}

export type GeminiVisitingTrainingTabKey = 'recruitment' | 'approved'
