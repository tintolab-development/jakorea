export type GeminiApprovedTrainingStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'NOT_CONDUCTED'

export type GeminiApprovedTrainingDateCandidate = {
  /** 1 = 1지망 */
  preferenceRank: number
  /** YYYY-MM-DD */
  trainingDate: string
  /** 예: `10:00~12:00(1차시)`. 없으면 빈 문자열 */
  trainingTimeText: string
}

export type GeminiApprovedTrainingRow = {
  id: string
  no: number
  recruitmentTitle?: string
  institutionName: string
  institutionSido: string
  institutionSigungu: string
  officialDocumentRequired: boolean
  /** 3지망 중 마지막 날짜 */
  lastPreferredDate: string
  /** 강사 매칭 여부 */
  instructorAssigned: boolean
  /** 강사 매칭 시에만 유효 */
  trainingDate: string
  trainingTimeText: string
  /** 기관 신청 희망 일정(1~3지망). 확정 일정이 없을 때 표시용 */
  trainingDateCandidates: GeminiApprovedTrainingDateCandidate[]
  studentCount: number
  instructorName: string
  managerName: string
}
