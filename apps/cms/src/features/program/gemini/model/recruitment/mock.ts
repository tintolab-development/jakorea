import dayjs, { type Dayjs } from 'dayjs'
import type { GeminiRecruitmentRow } from './types'

const SCREENSHOT_IN_PROGRESS_TITLE =
  '(Google for Education & JA Korea) Gemini Academy 2025 찾아가는 연수 신청'

const MOCK_TITLE_TEMPLATES = [
  '(Google for Education & JA Korea)Gemini Academy Coding Bootcamp',
  '(Google for Education & JA Korea) Gemini Academy AI for Education Workshop',
  '(Google for Education & JA Korea) Gemini Academy Digital Literacy Program',
  '(Google for Education & JA Korea) Gemini Academy Teacher Training',
] as const

const TARGET_MOCK_COUNT = 206

function createFeaturedRows(today: Dayjs): GeminiRecruitmentRow[] {
  return [
    {
      id: 'gvt-recruitment-scheduled',
      displayNo: 0,
      title: '(Google for Education & JA Korea)Gemini Academy Coding Bootcamp',
      // 모집 예정: D+60 ~ D+240
      applicationPeriodStart: today.add(60, 'day').format('YYYY-MM-DD'),
      applicationPeriodEnd: today.add(240, 'day').format('YYYY-MM-DD'),
      trainingRequestPeriodStart: today.add(90, 'day').format('YYYY-MM-DD'),
      trainingRequestPeriodEnd: today.add(300, 'day').format('YYYY-MM-DD'),
    },
    {
      id: 'gvt-recruitment-in-progress',
      displayNo: 0,
      title: SCREENSHOT_IN_PROGRESS_TITLE,
      // 모집 중: D-120 ~ D+120
      applicationPeriodStart: today.subtract(120, 'day').format('YYYY-MM-DD'),
      applicationPeriodEnd: today.add(120, 'day').format('YYYY-MM-DD'),
      trainingRequestPeriodStart: today.add(30, 'day').format('YYYY-MM-DD'),
      trainingRequestPeriodEnd: today.add(210, 'day').format('YYYY-MM-DD'),
    },
    {
      id: 'gvt-recruitment-ended',
      displayNo: 0,
      title: '(Google for Education & JA Korea) Gemini Academy AI for Education Workshop',
      // 모집 마감: D-300 ~ D-45
      applicationPeriodStart: today.subtract(300, 'day').format('YYYY-MM-DD'),
      applicationPeriodEnd: today.subtract(45, 'day').format('YYYY-MM-DD'),
      trainingRequestPeriodStart: today.subtract(200, 'day').format('YYYY-MM-DD'),
      trainingRequestPeriodEnd: today.subtract(60, 'day').format('YYYY-MM-DD'),
    },
  ]
}

function createGeneratedRows(today: Dayjs, count: number): GeminiRecruitmentRow[] {
  const rows: GeminiRecruitmentRow[] = []

  for (let i = 0; i < count; i += 1) {
    const statusBucket = i % 3
    let applicationPeriodStart: Dayjs
    let applicationPeriodEnd: Dayjs

    if (statusBucket === 0) {
      applicationPeriodStart = today.add(5 + (i % 30), 'day')
      applicationPeriodEnd = applicationPeriodStart.add(14, 'day')
    } else if (statusBucket === 1) {
      applicationPeriodEnd = today.add(i % 10, 'day')
      applicationPeriodStart = applicationPeriodEnd.subtract(20, 'day')
    } else {
      applicationPeriodEnd = today.subtract(1 + (i % 60), 'day')
      applicationPeriodStart = applicationPeriodEnd.subtract(14, 'day')
    }

    const trainingRequestPeriodStart = today
      .startOf('year')
      .add(i % 6, 'month')
      .add(i % 20, 'day')
    const trainingRequestPeriodEnd = trainingRequestPeriodStart.add(14, 'day')

    rows.push({
      id: `gvt-recruitment-gen-${String(i).padStart(4, '0')}`,
      displayNo: 0,
      title: `${MOCK_TITLE_TEMPLATES[i % MOCK_TITLE_TEMPLATES.length]} ${i + 1}`,
      applicationPeriodStart: applicationPeriodStart.format('YYYY-MM-DD'),
      applicationPeriodEnd: applicationPeriodEnd.format('YYYY-MM-DD'),
      trainingRequestPeriodStart: trainingRequestPeriodStart.format('YYYY-MM-DD'),
      trainingRequestPeriodEnd: trainingRequestPeriodEnd.format('YYYY-MM-DD'),
    })
  }

  return rows
}

/** displayNo를 최신순(내림차순)으로 재부여한다. 임시저장 행은 항상 최상단. */
export function assignRecruitmentDisplayNumbers(
  rows: GeminiRecruitmentRow[]
): GeminiRecruitmentRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (a.isDraft && !b.isDraft) return -1
    if (!a.isDraft && b.isDraft) return 1
    return b.id.localeCompare(a.id)
  })

  const total = sorted.length
  return sorted.map((row, index) => ({
    ...row,
    displayNo: total - index,
  }))
}

/**
 * 모집 공고 목록 mock — 신청 기간만 저장, 상태는 `resolveRecruitmentStatus`로 파생.
 * 진행 중(`gvt-recruitment-in-progress`) 행은 스크린샷 시안 제목 고정.
 */
export function createRecruitmentMockRows(
  referenceDate: Dayjs | string = dayjs()
): GeminiRecruitmentRow[] {
  const today = (typeof referenceDate === 'string' ? dayjs(referenceDate) : referenceDate).startOf(
    'day'
  )

  const featured = createFeaturedRows(today)
  const generated = createGeneratedRows(today, TARGET_MOCK_COUNT - featured.length)

  return assignRecruitmentDisplayNumbers([...featured, ...generated])
}
