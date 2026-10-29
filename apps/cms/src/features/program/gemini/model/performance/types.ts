export type GeminiPerformanceTrainingMethod = 'OFFLINE' | 'ONLINE'

export type GeminiPerformanceUploadRow = {
  timestamp: string
  instructorName: string
  assistantInstructorNames: string
  trainingFormat: string
  contact: string
  email: string
  school: string
  paymentDestination: string
  trainingLocation: string
  trainingDate: string
  trainingStartTime: string
  trainingEndTime: string
  classCount: number | null
  participantCount: number | null
  trainingPhoto?: string
  trainingMaterials?: string
  lectureEvaluation?: string
  trainerSupportNote?: string
}

export type GeminiPerformanceRow = {
  id: string
  no: number
  createdAt: string
  duplicateKey: string
  trainingLocation: string
  trainingDate: string
  participantCount: number | null
  detailTimeText: string
  trainingHours: number | null
  trainingTopic: string
  instructorName: string
  assistantInstructorNames: string
  instructorCount: number | null
  trainingFormat: string
  trainingMethod: GeminiPerformanceTrainingMethod
  contact: string
  instructorMemberId?: string
  calculatedAmount?: number | null
  classCount?: number | null
  /** 서버 원본. 값이 있으면 계좌 지급 완료 */
  accountPaymentId?: number
}

export type GeminiPerformanceImportDuplicateStrategy = 'overwrite' | 'append'
