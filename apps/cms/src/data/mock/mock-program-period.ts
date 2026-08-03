/**
 * CMS 프로그램 mock — 모집·운영 기간 상대 오프셋 (기준: 런타임 오늘).
 *
 * `getRecruitmentStatus` 규칙:
 * - 모집 예정(scheduled): today < applicationStart
 * - 모집 중(recruiting): start ≤ today ≤ end
 * - 모집 마감(closed): today > applicationEnd
 *
 * 윈도우는 몇 주가 아니라 분기·반년 규모로 두어 목록/상세에서 기간을 넉넉히 확인한다.
 */

/** daysAgo > 0 = 과거, daysAgo < 0 = 미래 */
export function mockRelativeIso(daysAgo: number, endOfDay = false): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  if (endOfDay) {
    date.setHours(23, 59, 59, 999)
  } else {
    date.setHours(0, 0, 0, 0)
  }
  return date.toISOString()
}

/**
 * 모집 기간 offsets (daysAgo).
 * - scheduled: D+60 ~ D+240 (약 6개월 창, 전부 미래)
 * - recruiting: D-120 ~ D+120 (약 8개월 창, 오늘 포함)
 * - closed: D-300 ~ D-45 (약 8.5개월 창, 마감 후 약 1.5개월)
 */
export const MOCK_APP_PERIOD_OFFSETS = {
  scheduled: { startDaysAgo: -60, endDaysAgo: -240 },
  recruiting: { startDaysAgo: 120, endDaysAgo: -120 },
  closed: { startDaysAgo: 300, endDaysAgo: 45 },
} as const

export type MockRecruitmentPeriodCase = keyof typeof MOCK_APP_PERIOD_OFFSETS

/**
 * 운영(교육) 기간 offsets — 모집 창 이후·진행 정렬.
 * - scheduled: 모집 후반 이후 장기 운영 예정
 * - recruiting: 모집 중후반에 시작, 장기 진행
 * - closed: 모집은 끝났고 교육은 진행/완료 쪽 (케이스별 closed 변형은 호출측)
 */
export const MOCK_OP_PERIOD_OFFSETS = {
  scheduled: { startDaysAgo: -90, endDaysAgo: -300 },
  recruiting: { startDaysAgo: -30, endDaysAgo: -210 },
  closed: { startDaysAgo: 60, endDaysAgo: -90 },
  closedCompleted: { startDaysAgo: 200, endDaysAgo: 60 },
} as const

export type MockOperationPeriodCase = keyof typeof MOCK_OP_PERIOD_OFFSETS

export function mockApplicationPeriod(
  caseKind: MockRecruitmentPeriodCase,
  /** 동일 케이스 내 미세 분산(일) — start/end 동일 방향으로 밀기 */
  spreadDays = 0
): { applicationStartDate: string; applicationEndDate: string } {
  const base = MOCK_APP_PERIOD_OFFSETS[caseKind]
  return {
    applicationStartDate: mockRelativeIso(base.startDaysAgo - spreadDays),
    applicationEndDate: mockRelativeIso(base.endDaysAgo - spreadDays, true),
  }
}

export function mockOperationPeriod(
  caseKind: MockOperationPeriodCase,
  spreadDays = 0
): { startDate: string; endDate: string } {
  const base = MOCK_OP_PERIOD_OFFSETS[caseKind]
  return {
    startDate: mockRelativeIso(base.startDaysAgo - spreadDays),
    endDate: mockRelativeIso(base.endDaysAgo - spreadDays, true),
  }
}

/** lifecycle → 모집 기간 배지 케이스 */
export function mockRecruitmentCaseFromLifecycle(
  lifecycle: string | undefined
): MockRecruitmentPeriodCase {
  if (
    lifecycle === 'planned' ||
    lifecycle === 'instructor_recruitment_planned' ||
    lifecycle === 'volunteer_recruitment_planned' ||
    lifecycle === 'participant_instructor_recruitment_planned'
  ) {
    return 'scheduled'
  }
  if (
    lifecycle === 'recruiting_students' ||
    lifecycle === 'recruiting_instructors' ||
    lifecycle === 'recruiting_volunteers' ||
    lifecycle === 'participant_instructor_recruiting'
  ) {
    return 'recruiting'
  }
  return 'closed'
}

export function mockOperationCaseFromLifecycle(
  lifecycle: string | undefined
): MockOperationPeriodCase {
  const recruit = mockRecruitmentCaseFromLifecycle(lifecycle)
  if (recruit === 'scheduled') return 'scheduled'
  if (recruit === 'recruiting') return 'recruiting'
  if (
    lifecycle === 'education_completed' ||
    lifecycle === 'document_processing_completed' ||
    lifecycle === 'matching_completed'
  ) {
    return 'closedCompleted'
  }
  return 'closed'
}
