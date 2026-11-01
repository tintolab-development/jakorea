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
  /**
   * 서버 원본 지급 제외 사유.
   * `GEMINI_INSTRUCTOR_IDENTITY_BLANK` = 강사 미기재로 실적만 등록(지급·회원 매칭 없음).
   * `GEMINI_INSTRUCTOR_NOT_MATCHED` = 이름·연락처는 있으나 회원 미매칭(실적만, 지급·정산 없음).
   */
  paymentExclusionReason?: string | null
}

export type GeminiPerformanceImportDuplicateStrategy = 'overwrite' | 'append'
