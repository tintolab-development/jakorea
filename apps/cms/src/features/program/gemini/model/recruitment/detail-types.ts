import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import type { GeminiRecruitmentRow } from './types'

export type GeminiRecruitmentDetail = GeminiRecruitmentRow & {
  createdAt: string
  createdByName: string
  updatedAt: string
  updatedByName: string
  announcementPublished: ParticipantRecruitmentAnnouncementPublishedValue
  minStudentCount: number
  trainingContent: string
}
