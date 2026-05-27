import dayjs, { type Dayjs } from 'dayjs'
import type { GeminiRecruitmentRow } from './types'

/**
 * 모집 공고 목록 mock — 신청 기간만 저장, 상태는 `resolveRecruitmentStatus`로 파생.
 * 기준일 대비 예정·진행 중·종료 각 1건이 되도록 기간을 잡는다.
 */
export function createRecruitmentMockRows(referenceDate: Dayjs | string = dayjs()): GeminiRecruitmentRow[] {
  const today = (typeof referenceDate === 'string' ? dayjs(referenceDate) : referenceDate).startOf(
    'day'
  )

  return [
    {
      id: 'gvt-recruitment-scheduled',
      displayNo: 215,
      title: '(Google for Education & JA Korea)Gemini Academy Coding Bootcamp',
      applicationPeriodStart: today.add(7, 'day').format('YYYY-MM-DD'),
      applicationPeriodEnd: today.add(21, 'day').format('YYYY-MM-DD'),
      trainingRequestPeriodStart: today.add(90, 'day').format('YYYY-MM-DD'),
      trainingRequestPeriodEnd: today.add(105, 'day').format('YYYY-MM-DD'),
    },
    {
      id: 'gvt-recruitment-in-progress',
      displayNo: 213,
      title: '(Google for Education & JA Korea)Gemini Academy STEAM Education Workshop',
      applicationPeriodStart: today.subtract(3, 'day').format('YYYY-MM-DD'),
      applicationPeriodEnd: today.add(10, 'day').format('YYYY-MM-DD'),
      trainingRequestPeriodStart: today.add(60, 'day').format('YYYY-MM-DD'),
      trainingRequestPeriodEnd: today.add(75, 'day').format('YYYY-MM-DD'),
    },
    {
      id: 'gvt-recruitment-ended',
      displayNo: 207,
      title: '(Google for Education & JA Korea)Gemini Academy AI for Education Workshop',
      applicationPeriodStart: today.subtract(30, 'day').format('YYYY-MM-DD'),
      applicationPeriodEnd: today.subtract(7, 'day').format('YYYY-MM-DD'),
      trainingRequestPeriodStart: today.add(30, 'day').format('YYYY-MM-DD'),
      trainingRequestPeriodEnd: today.add(45, 'day').format('YYYY-MM-DD'),
    },
  ]
}
