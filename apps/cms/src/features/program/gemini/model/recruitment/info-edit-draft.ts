import dayjs, { type Dayjs } from 'dayjs'
import type { GeminiRecruitmentDetail } from './detail-types'

export type GeminiRecruitmentInfoEditDraft = {
  title: string
  applicationPeriodStart: string
  applicationPeriodEnd: string
  trainingRequestPeriodStart: string
  trainingRequestPeriodEnd: string
  minStudentCount: number
}

export function detailToInfoEditDraft(detail: GeminiRecruitmentDetail): GeminiRecruitmentInfoEditDraft {
  return {
    title: detail.title,
    applicationPeriodStart: detail.applicationPeriodStart,
    applicationPeriodEnd: detail.applicationPeriodEnd,
    trainingRequestPeriodStart: detail.trainingRequestPeriodStart,
    trainingRequestPeriodEnd: detail.trainingRequestPeriodEnd,
    minStudentCount: detail.minStudentCount,
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
