import dayjs, { type Dayjs } from 'dayjs'
import type { GeminiRecruitmentRow } from './types'

const SCREENSHOT_IN_PROGRESS_TITLE =
  '(Google for Education & JA Korea) Gemini Academy 2025 찾아가는 연수 신청'

/**
 * 모집 공고 목록 mock — 신청 기간만 저장, 상태는 `resolveRecruitmentStatus`로 파생.
 * 진행 중(`gvt-recruitment-in-progress`) 행은 스크린샷 시안 고정값.
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
      title: SCREENSHOT_IN_PROGRESS_TITLE,
      applicationPeriodStart: '2026-06-10',
      applicationPeriodEnd: '2026-06-25',
      trainingRequestPeriodStart: '2026-09-10',
      trainingRequestPeriodEnd: '2026-09-25',
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
