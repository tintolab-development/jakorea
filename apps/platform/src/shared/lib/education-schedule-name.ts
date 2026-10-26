/**
 * 백엔드가 이름 없는 교육 진행 일정에 자동으로 붙이는 기본명(`공통 교육 예정 N`)은 화면에 노출하지 않는다.
 * 관리자가 직접 입력한 일정명·세부 일정명은 그대로 노출한다 (정확히 기본명 패턴일 때만 숨김).
 * CMS `apps/cms/src/shared/lib/education-schedule-name.ts`와 동일 규칙.
 */
const DEFAULT_EDUCATION_SLOT_NAME_RE = /^공통\s*교육\s*예정(?:\s*\d+)?$/u
/**
 * 일시 뒤에 공백으로 붙은 기본명 (`… 19:38  공통 교육 예정 3`).
 * 사용자 일정명(`가을 공통 교육 예정`)을 자르지 않도록 시각·날짜 바로 뒤일 때만 제거한다.
 */
const TRAILING_DEFAULT_EDUCATION_SLOT_NAME_RE =
  /(?<=\d{1,2}:\d{2}|\)|일)\s+공통\s*교육\s*예정(?:\s*\d+)?\s*$/u

export function isDefaultEducationSlotName(value: string | null | undefined): boolean {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed.length > 0 && DEFAULT_EDUCATION_SLOT_NAME_RE.test(trimmed)
}

/** 표시용 일정명. 비어 있거나 자동 기본명이면 undefined. */
export function toDisplayEducationScheduleName(
  value: string | null | undefined,
): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed || DEFAULT_EDUCATION_SLOT_NAME_RE.test(trimmed)) return undefined
  return trimmed
}

/**
 * 서버가 조합한 일정 라벨(`일시 | 일정명`)에서 자동 기본명 구간만 제거한다.
 * 라벨 전체가 기본명이면 빈 문자열.
 */
export function stripDefaultEducationSlotNameFromLabel(label: string | null | undefined): string {
  const trimmed = typeof label === 'string' ? label.trim() : ''
  if (!trimmed) return ''
  if (DEFAULT_EDUCATION_SLOT_NAME_RE.test(trimmed)) return ''
  const segments = trimmed.split(/\s*\|\s*/u)
  const kept =
    segments.length > 1
      ? segments.filter(segment => !DEFAULT_EDUCATION_SLOT_NAME_RE.test(segment.trim()))
      : segments
  const joined = kept.join(' | ')
  return joined.replace(TRAILING_DEFAULT_EDUCATION_SLOT_NAME_RE, '').trim()
}

/** 교육 진행 예정일 줄 slot key (`general-common-line:N`, N = 입력 순서 1-base). */
const EDUCATION_LINE_SLOT_KEY_RE = /^general-common-line:(\d+)$/u
const DEFAULT_EDUCATION_SLOT_NAME_NUMBER_RE = /^공통\s*교육\s*예정\s*(\d+)$/u
const TRAILING_DEFAULT_EDUCATION_SLOT_NAME_NUMBER_RE =
  /(?<=\d{1,2}:\d{2}|\)|일)\s+공통\s*교육\s*예정\s*(\d+)\s*$/u
const ROUND_SUFFIX_RE = /(?:^|\|)\s*\d+\s*회차(?:\s*\(\s*\d+\s*차시\s*\))?\s*$/u

function positiveInt(raw: string | undefined): number | null {
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : null
}

/**
 * 교육 진행 예정일 줄 slot key에서 회차 번호(입력 순서 1-base)를 읽는다.
 * 줄 slot이 아니면(기간 일정·차시 파생 일정·타 유형 회차 등) null.
 */
export function parseEducationLineRoundNumber(slotKey: string | null | undefined): number | null {
  const trimmed = typeof slotKey === 'string' ? slotKey.trim() : ''
  const match = EDUCATION_LINE_SLOT_KEY_RE.exec(trimmed)
  return match ? positiveInt(match[1]) : null
}

/** 자동 기본명(`공통 교육 예정 N`)의 N. 기본명이 아니거나 번호가 없으면 null. */
export function readDefaultEducationSlotNameNumber(value: string | null | undefined): number | null {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  const match = DEFAULT_EDUCATION_SLOT_NAME_NUMBER_RE.exec(trimmed)
  return match ? positiveInt(match[1]) : null
}

/** `일시 | N회차` (+ ` (k차시)`). 이미 회차 접미가 있거나 회차를 모르면 label 그대로. */
export function appendEducationRoundSuffix(
  label: string,
  roundNumber: number | null | undefined,
  curriculumSessionNo?: number | null,
): string {
  const trimmed = label.trim()
  if (roundNumber == null || !(roundNumber > 0)) return trimmed
  if (ROUND_SUFFIX_RE.test(trimmed)) return trimmed
  const sessionPart =
    curriculumSessionNo != null && curriculumSessionNo > 0 ? ` (${curriculumSessionNo}차시)` : ''
  const roundPart = `${roundNumber}회차${sessionPart}`
  return trimmed ? `${trimmed} | ${roundPart}` : roundPart
}

/**
 * 서버 라벨의 자동 기본명(`공통 교육 예정 N`, N = 교육 진행 예정일 입력 순서)을 `N회차`로 바꾼다.
 * 번호 없는 기본명은 제거만 한다. 사용자 일정명은 그대로 둔다.
 */
export function replaceDefaultEducationSlotNameWithRound(label: string | null | undefined): string {
  const trimmed = typeof label === 'string' ? label.trim() : ''
  if (!trimmed) return ''
  const whole = readDefaultEducationSlotNameNumber(trimmed)
  if (whole != null) return `${whole}회차`
  const segments = trimmed.split(/\s*\|\s*/u)
  let round: number | null = null
  let kept = segments
  if (segments.length > 1) {
    kept = segments.filter(segment => {
      const n = readDefaultEducationSlotNameNumber(segment)
      if (n != null) {
        round = round ?? n
        return false
      }
      return !DEFAULT_EDUCATION_SLOT_NAME_RE.test(segment.trim())
    })
  }
  let joined = kept.join(' | ')
  if (round == null) {
    const trailing = TRAILING_DEFAULT_EDUCATION_SLOT_NAME_NUMBER_RE.exec(joined)
    if (trailing) {
      round = positiveInt(trailing[1])
      joined = joined.slice(0, trailing.index).trim()
    }
  }
  joined = joined.replace(TRAILING_DEFAULT_EDUCATION_SLOT_NAME_RE, '').trim()
  return appendEducationRoundSuffix(joined, round)
}
