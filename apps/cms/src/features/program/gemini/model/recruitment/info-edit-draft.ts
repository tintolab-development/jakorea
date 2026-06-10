import dayjs, { type Dayjs } from 'dayjs'
import type { ParticipantRecruitmentAnnouncementPublishedValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import type { GeminiRecruitmentDetail } from './detail-types'

export type GeminiRecruitmentInfoEditDraft = {
  title: string
  announcementPublished: ParticipantRecruitmentAnnouncementPublishedValue
  applicationPeriodStart: string
  applicationPeriodEnd: string
  trainingRequestPeriodStart: string
  trainingRequestPeriodEnd: string
  minStudentCount: number
  trainingContent: string
}

export function detailToInfoEditDraft(detail: GeminiRecruitmentDetail): GeminiRecruitmentInfoEditDraft {
  return {
    title: detail.title,
    announcementPublished: detail.announcementPublished,
    applicationPeriodStart: detail.applicationPeriodStart,
    applicationPeriodEnd: detail.applicationPeriodEnd,
    trainingRequestPeriodStart: detail.trainingRequestPeriodStart,
    trainingRequestPeriodEnd: detail.trainingRequestPeriodEnd,
    minStudentCount: detail.minStudentCount,
    trainingContent: detail.trainingContent,
  }
}

export function applyInfoEditDraft(
  detail: GeminiRecruitmentDetail,
  draft: GeminiRecruitmentInfoEditDraft
): GeminiRecruitmentDetail {
  return {
    ...detail,
    ...draft,
    updatedAt: dayjs().toISOString(),
  }
}

export function toDateRangeValue(
  start: string,
  end: string
): [Dayjs, Dayjs] | null {
  const a = dayjs(start)
  const b = dayjs(end)
  if (!a.isValid() || !b.isValid()) return null
  return [a, b]
}
