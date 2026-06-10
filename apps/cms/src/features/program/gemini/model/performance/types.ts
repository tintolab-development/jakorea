export type GeminiPerformanceTrainingMethod = 'OFFLINE' | 'ONLINE' | 'HYBRID'

export type GeminiPerformanceRow = {
  id: string
  no: number
  trainingLocation: string
  trainingDate: string
  participantCount: number
  detailTimeText: string
  trainingHours: number
  trainingTopic: string
  instructorName: string
  assistantInstructorNames: string
  instructorCount: number
  trainingFormat: string
  trainingMethod: GeminiPerformanceTrainingMethod
}
