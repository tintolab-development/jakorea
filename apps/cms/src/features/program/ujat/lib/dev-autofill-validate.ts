import dayjs from 'dayjs'
import type { UjatHalfSemesterKey } from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import {
  listAvailableEducationFridays,
  type UjatDevAutofillFixture,
  type UjatDevDateRange,
} from '@/features/program/ujat/lib/dev-autofill-fixture'

export type UjatDevAutofillValidationCode =
  | 'BUSINESS_YEAR_MISMATCH'
  | 'BUSINESS_RANGE_INVERTED'
  | 'INTERVIEW_REQUIRED'
  | 'INTERVIEW_RANGE_INVERTED'
  | 'HALF_INTERVIEW_DUPLICATED'
  | 'HALF_RECRUIT_DUPLICATED'
  | 'EVENT_OUTSIDE_BUSINESS'
  | 'EVENT_NOT_FRIDAY'
  | 'NO_AVAILABLE_FRIDAY'
  | 'EXCLUSION_CONFLICT'

export type UjatDevAutofillValidationIssue = {
  code: UjatDevAutofillValidationCode
  half?: UjatHalfSemesterKey
  message: string
}

const HALVES: readonly UjatHalfSemesterKey[] = ['h1', 'h2']

function isCompleteRange(range: Partial<UjatDevDateRange> | null | undefined): range is UjatDevDateRange {
  return Boolean(range?.start?.trim() && range?.end?.trim())
}

function isInverted(range: UjatDevDateRange): boolean {
  return dayjs(range.start).isAfter(dayjs(range.end), 'day')
}

function sameRange(a: UjatDevDateRange, b: UjatDevDateRange): boolean {
  return a.start === b.start && a.end === b.end
}

function isFriday(key: string): boolean {
  return dayjs(key).day() === 5
}

/**
 * 자동입력 전 Fixture 검증. 오류가 하나라도 있으면 store에 쓰지 않는다.
 * 제품 필수값 검증(`listIncompleteUjat…`)과 별개로, UJAT 확정 기획 불변식을 본다.
 */
export function validateUjatDevAutofillFixture(
  fixture: Pick<UjatDevAutofillFixture, 'plan'>,
  holidayDateKeys: ReadonlySet<string> = new Set()
): UjatDevAutofillValidationIssue[] {
  const issues: UjatDevAutofillValidationIssue[] = []
  const { business, halves } = fixture.plan

  if (dayjs(business.start).year() !== dayjs(business.end).year()) {
    issues.push({
      code: 'BUSINESS_YEAR_MISMATCH',
      message: '사업 운영 기간의 시작·종료 연도가 다릅니다.',
    })
  }
  if (isInverted(business)) {
    issues.push({ code: 'BUSINESS_RANGE_INVERTED', message: '사업 운영 기간 시작일이 종료일보다 늦습니다.' })
  }

  for (const half of HALVES) {
    const plan = halves[half]
    if (!isCompleteRange(plan.interview)) {
      issues.push({ code: 'INTERVIEW_REQUIRED', half, message: `${half} 면접 시작·종료일이 없습니다.` })
    } else if (isInverted(plan.interview)) {
      issues.push({
        code: 'INTERVIEW_RANGE_INVERTED',
        half,
        message: `${half} 면접 시작일이 종료일보다 늦습니다.`,
      })
    }

    const event = plan.event
    if (
      dayjs(event.start).isBefore(dayjs(business.start), 'day') ||
      dayjs(event.end).isAfter(dayjs(business.end), 'day')
    ) {
      issues.push({ code: 'EVENT_OUTSIDE_BUSINESS', half, message: `${half} 본교육 기간이 사업 기간을 벗어납니다.` })
    }
    if (!isFriday(event.start) || !isFriday(event.end)) {
      issues.push({ code: 'EVENT_NOT_FRIDAY', half, message: `${half} 본교육 시작·종료일이 금요일이 아닙니다.` })
    }

    const { exclusion, unavailableDates } = plan
    if (
      exclusion.excludeNone &&
      (exclusion.excludeHoliday ||
        exclusion.excludeSaturday ||
        exclusion.excludeSunday ||
        unavailableDates.length > 0)
    ) {
      issues.push({
        code: 'EXCLUSION_CONFLICT',
        half,
        message: `${half} 「진행 불가일 없음」과 다른 불가일 옵션이 함께 선택되었습니다.`,
      })
    }
    if (listAvailableEducationFridays(plan, holidayDateKeys).length === 0) {
      issues.push({
        code: 'NO_AVAILABLE_FRIDAY',
        half,
        message: `${half} 불가일을 빼면 신청 가능한 본교육 금요일이 없습니다.`,
      })
    }
  }

  if (isCompleteRange(halves.h1.interview) && isCompleteRange(halves.h2.interview)) {
    if (sameRange(halves.h1.interview, halves.h2.interview)) {
      issues.push({
        code: 'HALF_INTERVIEW_DUPLICATED',
        message: '상반기·하반기 면접 기간이 같습니다. 반기별로 따로 설정해야 합니다.',
      })
    }
  }
  if (sameRange(halves.h1.recruit, halves.h2.recruit)) {
    issues.push({
      code: 'HALF_RECRUIT_DUPLICATED',
      message: '상반기·하반기 봉사자 모집 기간이 같습니다.',
    })
  }

  return issues
}
