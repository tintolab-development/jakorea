/**
 * 생년월일 전용 입력 범위 (QA-0220·QA-0503).
 *
 * - 오늘(KST) 이후 날짜는 막는다.
 * - 최대 만 120세까지 받는다(만 121세가 되는 날부터 막는다).
 * - Platform 공통 날짜 입력 범위(`DATE_INPUT_MIN_YEAR`~당일+10년)는 다른 날짜 입력이 함께 쓰므로 바꾸지 않는다.
 * - 서버 검증(BE-06)과 별개로 화면 입력 단계에서만 쓴다.
 */

export const BIRTH_DATE_MAX_AGE = 120

export const BIRTH_DATE_FUTURE_MESSAGE = '오늘 이후 날짜는 입력할 수 없습니다.'
export const BIRTH_DATE_TOO_OLD_MESSAGE = '생년월일을 다시 확인해 주세요.'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

/** 기기 시간대와 상관없이 KST 기준 오늘(로컬 자정 Date — 입력값 파싱과 같은 축) */
export function getKstToday(now: Date = new Date()): Date {
  const kst = new Date(now.getTime() + KST_OFFSET_MS)
  return new Date(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate())
}

/** `year`년 뒤(앞)의 같은 날. 2/29 → 윤년이 아니면 2/28 */
function shiftYearsKeepingDay(date: Date, years: number): Date {
  const year = date.getFullYear() + years
  const month = date.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(date.getDate(), lastDay))
}

/**
 * 생년월일 허용 범위(양끝 포함, 로컬 자정).
 * - max: KST 오늘
 * - min: 오늘 만 120세인 사람의 생일 중 가장 이른 날 = (오늘 - 121년) + 1일
 */
export function getBirthDateBounds(now: Date = new Date()): { min: Date; max: Date } {
  const today = getKstToday(now)
  const oldestExcluded = shiftYearsKeepingDay(today, -(BIRTH_DATE_MAX_AGE + 1))
  const min = new Date(
    oldestExcluded.getFullYear(),
    oldestExcluded.getMonth(),
    oldestExcluded.getDate() + 1
  )
  return { min, max: today }
}

export type BirthDateRangeStatus = 'valid' | 'future' | 'too-old'

/** 실제로 존재하는 날짜(로컬 자정)가 생년월일 범위 안인지 */
export function checkBirthDateRange(date: Date, now: Date = new Date()): BirthDateRangeStatus {
  const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const { min, max } = getBirthDateBounds(now)
  if (normalized.getTime() > max.getTime()) return 'future'
  if (normalized.getTime() < min.getTime()) return 'too-old'
  return 'valid'
}

export function birthDateRangeMessage(status: BirthDateRangeStatus): string | null {
  if (status === 'future') return BIRTH_DATE_FUTURE_MESSAGE
  if (status === 'too-old') return BIRTH_DATE_TOO_OLD_MESSAGE
  return null
}
