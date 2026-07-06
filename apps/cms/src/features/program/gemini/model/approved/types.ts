export type GeminiApprovedTrainingStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'NOT_CONDUCTED'

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
  studentCount: number
  instructorName: string
  managerName: string
}
