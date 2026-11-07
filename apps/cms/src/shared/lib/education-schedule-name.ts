/**
 * 백엔드가 이름 없는 교육 진행 일정에 자동으로 붙이는 기본명(`공통 교육 예정 N`)은 화면에 노출하지 않는다.
 * 관리자가 직접 입력한 일정명·세부 일정명은 그대로 노출한다 (정확히 기본명 패턴일 때만 숨김).
 * Platform `apps/platform/src/shared/lib/education-schedule-name.ts`와 동일 규칙.
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

/** 사전교육 일정의 일정명은 화면에서 항상 「사전교육」(붙여쓰기). 저장값은 바꾸지 않는다. */
const PRE_EDUCATION_SCHEDULE_DISPLAY_NAME = '사전교육'

/** 표시용 일정명. 비어 있거나 자동 기본명이면 undefined. 「사전 교육」 등은 「사전교육」으로 표시. */
export function toDisplayEducationScheduleName(
  value: string | null | undefined,
): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed || DEFAULT_EDUCATION_SLOT_NAME_RE.test(trimmed)) return undefined
  if (trimmed.replace(/\s+/gu, '') === PRE_EDUCATION_SCHEDULE_DISPLAY_NAME) {
    return PRE_EDUCATION_SCHEDULE_DISPLAY_NAME
  }
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

export function positiveEducationNumber(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

/** 확인된 차시 수만. round/sessionNo를 차시로 쓰지 않는다. */
export function parseConfirmedCurriculumSessionCount(
  value: string | null | undefined
): number | null {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed) return null
  const match = /(?:^|[^\d])(\d+)\s*차시(?:\s|$)/u.exec(` ${trimmed} `)
  return match ? positiveEducationNumber(Number(match[1])) : null
}

/**
 * 배정·진행 일정 접미. 회차와 차시는 다른 값이다.
 * - 둘 다 있으면 `1회차 (2차시)`
 * - 회차만 있으면 `1회차`
 * - 차시만 있으면 `2차시`
 * - 없으면 빈 문자열. 없는 값을 만들지 않는다.
 */
export function formatEducationRoundSessionLabel(input: {
  roundNumber?: number | null
  curriculumSessionCount?: number | null
}): string {
  const roundNumber = positiveEducationNumber(input.roundNumber)
  const curriculumSessionCount = positiveEducationNumber(input.curriculumSessionCount)
  if (roundNumber != null) {
    return appendEducationRoundSuffix('', roundNumber, curriculumSessionCount)
  }
  if (curriculumSessionCount != null) return `${curriculumSessionCount}차시`
  return ''
}

const PROGRAM_SCHEDULE_ROLE_PRE_EDUCATION = 'PRE_EDUCATION'
const GENERAL_PRE_EDUCATION_SLOT_KEY_PREFIX = 'general-pre-education:'

/** 사전교육은 canonical 역할·슬롯만으로 판별한다. sessionNo=null만으로는 추정하지 않는다. */
export function isEducationSchedulePreEducation(input: {
  scheduleRole?: string | null
  educationSlotKey?: string | null
}): boolean {
  if (String(input.scheduleRole ?? '').trim().toUpperCase() === PROGRAM_SCHEDULE_ROLE_PRE_EDUCATION) {
    return true
  }
  return String(input.educationSlotKey ?? '')
    .trim()
    .toLowerCase()
    .startsWith(GENERAL_PRE_EDUCATION_SLOT_KEY_PREFIX)
}

export type EducationScheduleLabelInput = {
  sessionNo?: number | null
  curriculumSessionCount?: number | null
  scheduleRole?: string | null
  educationSlotKey?: string | null
}

/**
 * 강의보고서·BE dateRoundTimeLabel과 같은 토큰.
 * 사전교육 → `사전교육`
 * 본교육 회차+차시 → `N회차`, `K차시` (괄호로 합치지 않음)
 * 회차만 → `N회차`
 * sessionNo 없이 차시만 있으면 만들지 않음 (강의보고서 폴백으로 넘긴다)
 * sessionNo를 차시로 쓰지 않는다.
 */
export function formatEducationScheduleLabelTokens(
  input: EducationScheduleLabelInput
): string[] {
  if (isEducationSchedulePreEducation(input)) return [PRE_EDUCATION_SCHEDULE_DISPLAY_NAME]
  const sessionNo = positiveEducationNumber(input.sessionNo)
  const curriculumSessionCount = positiveEducationNumber(input.curriculumSessionCount)
  const tokens: string[] = []
  if (sessionNo != null) tokens.push(`${sessionNo}회차`)
  if (sessionNo != null && curriculumSessionCount != null) {
    tokens.push(`${curriculumSessionCount}차시`)
  }
  return tokens
}

/**
 * 교육 일정 단위 라벨.
 * 사전교육 → `사전교육`
 * 회차+차시 → `N회차 (K차시)` (배정·진행 셀 접미)
 * 회차만 → `N회차`
 * 확인된 차시만 → `K차시`
 * 없으면 빈 문자열. sessionNo를 차시로 쓰지 않는다.
 */
export function formatEducationScheduleUnitLabel(input: EducationScheduleLabelInput): string {
  if (isEducationSchedulePreEducation(input)) return PRE_EDUCATION_SCHEDULE_DISPLAY_NAME
  return formatEducationRoundSessionLabel({
    roundNumber: input.sessionNo,
    curriculumSessionCount: input.curriculumSessionCount,
  })
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

const SATISFACTION_DOT_DATE_RE = /(\d{4})\.(\d{1,2})\.(\d{1,2})\(([일월화수목금토])\)/u
const SATISFACTION_KO_DATE_RE = /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\(([일월화수목금토])\)/u

function pad2(value: string): string {
  return value.padStart(2, '0')
}

/** 교육 진행 예정일 문구에서 `2026.11.12(목)`만 뽑는다. */
export function formatSatisfactionCalendarDateFromScheduleLine(
  line: string | null | undefined
): string | undefined {
  const trimmed = typeof line === 'string' ? line.trim() : ''
  if (!trimmed) return undefined
  const dot = SATISFACTION_DOT_DATE_RE.exec(trimmed)
  if (dot) return `${dot[1]}.${pad2(dot[2] ?? '')}.${pad2(dot[3] ?? '')}(${dot[4]})`
  const ko = SATISFACTION_KO_DATE_RE.exec(trimmed)
  if (ko) return `${ko[1]}.${pad2(ko[2] ?? '')}.${pad2(ko[3] ?? '')}(${ko[4]})`
  return undefined
}

/** ISO instant → 서울 달력 `2026.11.12(목)`. UTC 날짜 슬라이스 금지. */
export function formatSatisfactionScheduleCalendarDate(
  value: string | null | undefined
): string | undefined {
  if (value == null) return undefined
  const trimmed = String(value).trim()
  if (!trimmed) return undefined
  const fromLine = formatSatisfactionCalendarDateFromScheduleLine(trimmed)
  if (fromLine) return fromLine
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)
  const stamp = dateOnly ? new Date(`${trimmed}T12:00:00+09:00`) : new Date(trimmed)
  if (Number.isNaN(stamp.getTime())) return undefined
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(stamp)
  const weekday = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    weekday: 'short',
  })
    .format(stamp)
    .replace('요일', '')
  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value
  if (!year || !month || !day || !weekday) return undefined
  return `${year}.${month}.${day}(${weekday})`
}

/**
 * 일정별 만족도조사 표시명 — CMS 결과 셀렉트·Platform 목록 동일.
 * 예: `1회차 · 2026.11.12(목)` / `오리엔테이션 · 2026.11.12(목)`
 */
export function formatSatisfactionPerScheduleDisplayName(input: {
  scheduleName?: string | null
  sessionNo?: number | null
  startAt?: string | null
  scheduleLine?: string | null
}): string {
  const custom = toDisplayEducationScheduleName(input.scheduleName)
  const sessionNo =
    typeof input.sessionNo === 'number' && Number.isInteger(input.sessionNo) && input.sessionNo > 0
      ? input.sessionNo
      : readDefaultEducationSlotNameNumber(input.scheduleName)
  const replaced = replaceDefaultEducationSlotNameWithRound(input.scheduleName).trim()
  const name = custom ?? (sessionNo != null ? `${sessionNo}회차` : null) ?? (replaced || null) ?? '일정'
  const date =
    formatSatisfactionScheduleCalendarDate(input.startAt) ??
    formatSatisfactionCalendarDateFromScheduleLine(input.scheduleLine)
  return date ? `${name} · ${date}` : name
}

export function hasSatisfactionScheduleDisplayParts(input: {
  scheduleName?: string | null
  sessionNo?: number | null
  startAt?: string | null
  scheduleLine?: string | null
}): boolean {
  if (input.startAt?.trim() || input.scheduleLine?.trim()) return true
  if (typeof input.sessionNo === 'number' && Number.isInteger(input.sessionNo) && input.sessionNo > 0) {
    return true
  }
  return (
    toDisplayEducationScheduleName(input.scheduleName) != null ||
    readDefaultEducationSlotNameNumber(input.scheduleName) != null
  )
}

export function isSatisfactionPerScheduleBinding(input: {
  runMode?: string | null
  targetScope?: string | null
}): boolean {
  const mode = input.runMode?.trim().toUpperCase()
  if (mode === 'PER_SCHEDULE') return true
  if (mode === 'ONCE_AT_END') return false
  return input.targetScope?.trim().toUpperCase() === 'SCHEDULE'
}

/** 일정별: `1회차 · 2026.11.12(목) 만족도조사 (학생용)` / 아니면 양식이름만 */
export function composeSatisfactionSurveyDisplayTitle(input: {
  formName?: string | null
  perSchedule?: boolean
  scheduleDisplayName?: string | null
}): string {
  const formName = input.formName?.trim() ?? ''
  const schedule = input.scheduleDisplayName?.trim() ?? ''
  if (input.perSchedule === true && schedule !== '' && schedule !== '일정') {
    if (formName === '') return schedule
    if (formName === schedule || formName.startsWith(`${schedule} `)) return formName
    return `${schedule} ${formName}`
  }
  return formName
}
