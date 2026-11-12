import { describe, expect, it } from 'vitest'
import {
  BIRTH_DATE_FUTURE_MESSAGE,
  BIRTH_DATE_TOO_OLD_MESSAGE,
  checkBirthDateRange,
  getBirthDateBounds,
  getKstToday,
} from '../src/features/auth/sign-up/lib/birth-date-bounds'
import { checkBirthDateInput, parseBirthDate } from '../src/features/auth/sign-up/lib/utils'
import { validateBirthStep } from '../src/features/auth/sign-up/lib/identity/identity.logic'

/** KST 시각을 UTC Date로 만든다 (기기 시간대와 무관하게 같은 순간) */
function kst(iso: string): Date {
  return new Date(`${iso}+09:00`)
}

function ymd(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

describe('getKstToday (QA-0220)', () => {
  it('자정 경계: KST 날짜 기준으로 오늘을 잡는다', () => {
    expect(ymd(getKstToday(kst('2026-11-12T23:59:59')))).toBe('2026-11-12')
    expect(ymd(getKstToday(kst('2026-11-13T00:00:00')))).toBe('2026-11-13')
    // UTC 2026-11-12 15:00 = KST 11-13 00:00
    expect(ymd(getKstToday(new Date('2026-11-12T15:00:00Z')))).toBe('2026-11-13')
  })
})

describe('생년월일 범위 — 오늘(KST)까지 · 최대 만 120세', () => {
  const now = kst('2026-11-12T10:00:00')

  it('오늘은 통과, 내일은 future', () => {
    expect(parseBirthDate('2026.11.12', now)).not.toBeNull()
    expect(checkBirthDateInput('2026.11.13', now)).toEqual({ status: 'future' })
  })

  it('당일+10년처럼 먼 미래도 막는다(공통 날짜 범위와 분리)', () => {
    expect(checkBirthDateInput('2036.11.12', now)).toEqual({ status: 'future' })
  })

  it('1950년 이전 출생자도 받는다', () => {
    expect(parseBirthDate('1949.05.01', now)).not.toBeNull()
    expect(parseBirthDate('1910.01.01', now)).not.toBeNull()
  })

  it('만 120세 경계: 오늘 만 120세는 통과, 만 121세가 되는 날은 too-old', () => {
    const { min, max } = getBirthDateBounds(now)
    expect(ymd(max)).toBe('2026-11-12')
    expect(ymd(min)).toBe('1905-11-13')
    // 1906-11-12생 → 오늘 만 120세
    expect(parseBirthDate('1906.11.12', now)).not.toBeNull()
    // 1905-11-13생 → 내일 만 121세, 오늘은 만 120세
    expect(parseBirthDate('1905.11.13', now)).not.toBeNull()
    // 1905-11-12생 → 오늘 만 121세
    expect(checkBirthDateInput('1905.11.12', now)).toEqual({ status: 'too-old' })
  })

  it('윤년 2/29: 실재하는 날짜만 받고, 범위 계산도 2/29 기준일에서 깨지지 않는다', () => {
    expect(parseBirthDate('2024.02.29', now)).not.toBeNull()
    expect(checkBirthDateInput('2023.02.29', now)).toEqual({ status: 'invalid-format' })

    const leapToday = kst('2028-02-29T09:00:00')
    const { min } = getBirthDateBounds(leapToday)
    // 1907-02-29는 없으므로 2/28 다음 날(3/1)부터
    expect(ymd(min)).toBe('1907-03-01')
    expect(checkBirthDateRange(new Date(1907, 1, 28), leapToday)).toBe('too-old')
    expect(checkBirthDateRange(new Date(1907, 2, 1), leapToday)).toBe('valid')
  })

  it('형식이 틀리면 invalid-format', () => {
    expect(checkBirthDateInput('2026-11-12', now)).toEqual({ status: 'invalid-format' })
    expect(checkBirthDateInput('2026.13.01', now)).toEqual({ status: 'invalid-format' })
  })
})

describe('validateBirthStep (회원가입 step 2)', () => {
  it('범위 오류는 입력란 아래 안내용 reason·문구를 돌려준다', () => {
    const future = validateBirthStep('2999.01.01')
    expect(future).toEqual({
      status: 'invalid-format',
      message: BIRTH_DATE_FUTURE_MESSAGE,
      reason: 'future',
    })
    const tooOld = validateBirthStep('1800.01.01')
    expect(tooOld).toEqual({
      status: 'invalid-format',
      message: BIRTH_DATE_TOO_OLD_MESSAGE,
      reason: 'too-old',
    })
  })

  it('형식 오류는 기존 문구를 유지한다', () => {
    expect(validateBirthStep('1990-01-01')).toMatchObject({
      status: 'invalid-format',
      reason: 'format',
      message: '생년월일을 YYYY.MM.DD 형식으로 입력해 주세요.',
    })
  })
})
