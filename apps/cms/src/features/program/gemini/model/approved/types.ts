export type GeminiApprovedTrainingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'ENDED'

export type GeminiApprovedTrainingRow = {
  id: string
  no: number
  institutionName: string
  institutionSido: string
  institutionSigungu: string
  status: GeminiApprovedTrainingStatus
  officialDocumentRequired: boolean
  trainingDate: string
  trainingTimeText: string
  studentCount: number
  instructorName: string
  managerName: string
}

