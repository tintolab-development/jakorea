import type { GeminiRecruitmentRow } from './types'

export type GeminiRecruitmentDetail = GeminiRecruitmentRow & {
  createdAt: string
  createdByName: string
  updatedAt: string
  updatedByName: string
  minStudentCount: number
  trainingContent: string
}
