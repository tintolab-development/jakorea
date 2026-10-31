/**
 * 프로그램 상세 정보 탭 - 상수, 라벨 맵, 날짜 포맷 유틸
 */

import type { DateValue } from '@/types'
import type { Program, ProgramLifecycleStatus, TargetLevel } from '@/types/domain'
import {
  getProgramLifecycleLabel,
  PROGRAM_LIFECYCLE_STATUS_SELECT_ORDER,
} from '@/shared/constants/status'
import dayjs from 'dayjs'
import { dateRangeUsesClockTime } from '@/features/template/lib/date-range-clock'
import {
  formatDateDotWithWeekday,
  formatDateRangeDotWithWeekday,
  formatDateTimeDotWithWeekday,
} from '@/shared/utils/date'

// ─── 요일/날짜 포맷 ────────────────────────────────────────

/** "2026.04.20(월) 09:15" */
export function formatDate(d: DateValue | undefined): string {
  if (!d) return '-'
  return formatDateTimeDotWithWeekday(d)
}

/** "2026.04.03(금)" */
export function formatDateOnly(d: DateValue | undefined): string {
  if (!d) return '-'
  return formatDateDotWithWeekday(d)
}

const SEOUL_DATE_TIME_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function seoulClockParts(value: DateValue): { date: string; hour: number; minute: number } | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (/^\d{4}[.-]\d{1,2}[.-]\d{1,2}$/.test(trimmed)) return null
  }
  const date = value instanceof Date ? value : new Date(String(value))
  if (Number.isNaN(date.getTime())) return null
  const parts = SEOUL_DATE_TIME_PARTS.formatToParts(date)
  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value
  const hour = Number(parts.find(part => part.type === 'hour')?.value)
  const minute = Number(parts.find(part => part.type === 'minute')?.value)
  if (!year || !month || !day || !Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return { date: `${year}.${month}.${day}`, hour, minute }
}

/** KST 00:00이면 날짜만, 그 외 `YYYY.MM.DD HH:mm` */
export function formatDateWithOptionalTime(d: DateValue | undefined): string {
  if (!d) return '-'
  const clock = seoulClockParts(d)
  if (!clock || (clock.hour === 0 && clock.minute === 0)) return formatDateOnly(d)
  return `${clock.date} ${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`
}

export function formatDateRange(start: DateValue | undefined, end: DateValue | undefined): string {
  if (!start || !end) return '-'
  const startClock = seoulClockParts(start)
  const endClock = seoulClockParts(end)
  const startHasClock = Boolean(startClock && (startClock.hour !== 0 || startClock.minute !== 0))
  const endHasClock = Boolean(endClock && (endClock.hour !== 0 || endClock.minute !== 0))
  if (startHasClock || endHasClock) {
    if (startClock && endClock && startClock.date === endClock.date) {
      return `${startClock.date} ${String(startClock.hour).padStart(2, '0')}:${String(startClock.minute).padStart(2, '0')} ~ ${String(endClock.hour).padStart(2, '0')}:${String(endClock.minute).padStart(2, '0')}`
    }
    return `${formatDateWithOptionalTime(start)} ~ ${formatDateWithOptionalTime(end)}`
  }
  const startAt = dayjs(start)
  const endAt = dayjs(end)
  if (!startAt.isValid() || !endAt.isValid()) return '-'
  if (dateRangeUsesClockTime(startAt, endAt)) {
    return `${formatDateTimeDotWithWeekday(start)} ~ ${formatDateTimeDotWithWeekday(end)}`
  }
  return formatDateRangeDotWithWeekday(start, end)
}

// ─── 모집 상태 ─────────────────────────────────────────────

export type RecruitmentStatus = 'scheduled' | 'recruiting' | 'closed'

const KST_DATE_PARTS = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** ISO/date-only 값을 Asia/Seoul 기준 달력일로 정규화한다. */
function kstDateKey(value: DateValue | undefined): string | null {
  if (!value) return null

  if (value instanceof Date && Number.isNaN(value.getTime())) return null

  if (typeof value === 'string') {
    const trimmed = value.trim()
    const dateOnly = /^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/.exec(trimmed)
    if (dateOnly) {
      return `${dateOnly[1]}-${dateOnly[2].padStart(2, '0')}-${dateOnly[3].padStart(2, '0')}`
    }

    // timezone 없는 API/폼 값은 KST로 저장된 값으로 취급한다.
    const hasTimezone = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(trimmed)
    const parsed = new Date(hasTimezone ? trimmed : `${trimmed}+09:00`)
    if (Number.isNaN(parsed.getTime())) return null
    value = parsed
  }

  const parts = KST_DATE_PARTS.formatToParts(value)
  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value
  return year && month && day ? `${year}-${month}-${day}` : null
}

/** 모집 기간 기준 상태. 시작일·종료일은 양 끝을 포함하며, 날짜가 없으면 null이다. */
export function getRecruitmentStatusFromDates(
  start: DateValue | undefined,
  end: DateValue | undefined,
  now: DateValue = new Date()
): RecruitmentStatus | null {
  const startDate = kstDateKey(start)
  const endDate = kstDateKey(end)
  const today = kstDateKey(now)
  if (!startDate || !endDate || !today) return null
  if (today < startDate) return 'scheduled'
  if (today <= endDate) return 'recruiting'
  return 'closed'
}

/** 참여자 모집 기간 기준 상태 (날짜 없으면 null, 목록·상세 공통) */
export function getRecruitmentStatus(
  program: Program,
  now?: DateValue
): RecruitmentStatus | null {
  return getRecruitmentStatusFromDates(program.applicationStartDate, program.applicationEndDate, now)
}

/** 신청 기간 기준 참여자(수강자) 모집 현황 → lifecycle 키 (td 색상·라벨: 참여자 정보 탭·공통 정보 공통) */
export const PARTICIPANT_RECRUITMENT_STATUS_TO_LIFECYCLE: Record<
  'scheduled' | 'recruiting' | 'closed',
  ProgramLifecycleStatus
> = {
  scheduled: 'planned',
  recruiting: 'recruiting_students',
  closed: 'matching_completed',
}

/** `getRecruitmentStatus` 결과를 lifecycle로 변환 (날짜 오버라이드는 수정 모드 폼 연동용) */
export function getParticipantRecruitmentLifecycle(
  program: Program,
  overrides?: Pick<Program, 'applicationStartDate' | 'applicationEndDate'>
): ProgramLifecycleStatus | null {
  const s = getParticipantRecruitmentStatus(program, overrides)
  if (s == null) return null
  return PARTICIPANT_RECRUITMENT_STATUS_TO_LIFECYCLE[s]
}

export function getParticipantRecruitmentStatus(
  program: Program,
  overrides?: Pick<Program, 'applicationStartDate' | 'applicationEndDate'>
): RecruitmentStatus | null {
  const effective = overrides ? { ...program, ...overrides } : program
  return getRecruitmentStatus(effective)
}

/** @deprecated getRecruitmentStatus 사용 (null 처리 통일) */
export function getRecruitmentStatusValue(program: Program): 'scheduled' | 'recruiting' | 'closed' {
  const v = getRecruitmentStatus(program)
  return v ?? 'scheduled'
}

import { EDUCATION_TARGET_OPTIONS } from '@jakorea/domain/recruitment/education-target'
import type { EducationTarget } from '@jakorea/domain/recruitment/education-target'
import { RECRUITMENT_STATUS_OPTIONS } from '@jakorea/domain/recruitment/recruitment-status'

export const RECRUITMENT_RADIO_OPTIONS = RECRUITMENT_STATUS_OPTIONS

/** 강사 모집 대상 — 교육 대상 5종과 동일 (저장 value = 코드) */
export const INSTRUCTOR_TARGET_OPTIONS = EDUCATION_TARGET_OPTIONS

/** 2차 면접 심사 방법 옵션 */
export const INTERVIEW_METHOD_OPTIONS = [
  { value: '온라인', label: '온라인' },
  { value: '오프라인', label: '오프라인' },
  { value: '온/오프라인', label: '온/오프라인' },
]

export function getRecruitmentStatusLabel(program: Program): string {
  const v = getRecruitmentStatusValue(program)
  return getRecruitmentStatusLabelForStatus(v)
}

/** 모집 현황 상태를 모집 탭 전용 라벨로 변환한다. lifecycle 라벨과 섞지 않는다. */
export function getRecruitmentStatusLabelForStatus(
  status: RecruitmentStatus | null,
  audience?: 'participant' | 'instructor' | 'volunteer'
): string {
  if (!status) return '-'
  const label = RECRUITMENT_RADIO_OPTIONS.find(option => option.value === status)?.label
  if (!label) return '-'
  const prefix =
    audience === 'participant'
      ? '참여자'
      : audience === 'instructor'
        ? '강사'
        : audience === 'volunteer'
          ? '봉사자'
          : undefined
  return prefix ? `${prefix} ${label}` : label
}

/** 강사 모집 기간 기준 상태 */
export function getInstructorRecruitmentStatus(
  program: Program
): RecruitmentStatus | null {
  return getRecruitmentStatusFromDates(
    program.instructorApplicationStartDate,
    program.instructorApplicationEndDate
  )
}

/** 봉사자 모집 현황 → lifecycle 키 (봉사자 모집 정보 탭) */
export const VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE: Record<
  'scheduled' | 'recruiting' | 'closed',
  ProgramLifecycleStatus
> = {
  scheduled: 'volunteer_recruitment_planned',
  recruiting: 'recruiting_volunteers',
  closed: 'document_processing_completed',
}

/** 봉사자 모집 기간 기준 lifecycle (수정 모드 폼 날짜 연동) */
export function getVolunteerRecruitmentLifecycle(
  program: Program,
  overrides?: Pick<Program, 'volunteerApplicationStartDate' | 'volunteerApplicationEndDate'>
): ProgramLifecycleStatus | null {
  const effective = overrides ? { ...program, ...overrides } : program
  const s = getVolunteerRecruitmentStatus(effective)
  if (s == null) return null
  return VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE[s]
}

/** 봉사자 모집 기간 기준 상태 */
export function getVolunteerRecruitmentStatus(
  program: Program
): RecruitmentStatus | null {
  return getRecruitmentStatusFromDates(
    program.volunteerApplicationStartDate,
    program.volunteerApplicationEndDate
  )
}

// ─── 라벨 맵 ──────────────────────────────────────────────

export const CATEGORY_LABEL: Record<string, string> = {
  school: '학교/기관',
  individual: '개인',
}

export const CATEGORY_OPTIONS = [
  { value: 'school', label: '학교/기관' },
  { value: 'individual', label: '개인' },
]

/** BE `textbook_business_area.name` 정확 일치 — `경제`/`진로`/`기타` 는 마스터에 없어 400 */
export const BUSINESS_AREA_OPTIONS = [
  { value: '경제금융', label: '경제금융' },
  { value: '진로취업', label: '진로취업' },
  { value: '기업가정신', label: '기업가정신' },
  { value: '디지털리터러시', label: '디지털리터러시' },
]

/** 등록 폼 코드·띄어쓰기·레거시 약칭 → BE 마스터명 */
const BUSINESS_AREA_VALUE_ALIASES: Record<string, string> = {
  economy_finance: '경제금융',
  career_employment: '진로취업',
  entrepreneurship: '기업가정신',
  digital_literacy: '디지털리터러시',
  '디지털 리터러시': '디지털리터러시',
  // 등록 폼·시드 약칭 (PATCH 거절용 `경제`/`진로` 와 구분 — 조회 정규화만)
  economy: '경제금융',
  career: '진로취업',
  // textbook / BE enum 스타일
  ECONOMY: '경제금융',
  ECONOMY_FINANCE: '경제금융',
  CAREER: '진로취업',
  CAREER_EMPLOYMENT: '진로취업',
  ENTREPRENEURSHIP: '기업가정신',
  DIGITAL_LITERACY: '디지털리터러시',
}

/** 폼·API 혼용값을 BE `textbook_business_area.name`으로 정규화 */
export function normalizeProgramBusinessAreaValue(value: string | undefined | null): string {
  const trimmed = value?.trim() ?? ''
  if (!trimmed) return ''
  const aliased =
    BUSINESS_AREA_VALUE_ALIASES[trimmed] ?? BUSINESS_AREA_VALUE_ALIASES[trimmed.toLowerCase()]
  if (aliased) return aliased
  const matched = BUSINESS_AREA_OPTIONS.find(o => o.value === trimmed || o.label === trimmed)
  return matched?.value ?? trimmed
}

/** 셀렉트·PATCH에 실을 수 있는 마스터명. 목록에 없으면 빈 문자열 */
export function resolveStoredBusinessArea(value: string | undefined | null): string {
  const normalized = normalizeProgramBusinessAreaValue(value)
  if (!normalized) return ''
  return BUSINESS_AREA_OPTIONS.some(option => option.value === normalized) ? normalized : ''
}

export const TYPE_LABEL: Record<string, string> = {
  online: '온라인',
  offline: '오프라인',
  hybrid: '온/오프라인',
}

/** 봉사자 모집 대상. 저장 값은 교육 대상 코드와 같다. */
export const VOLUNTEER_TARGET_OPTIONS = EDUCATION_TARGET_OPTIONS

export type VolunteerTargetCode = EducationTarget

const VOLUNTEER_TARGET_VALUES = new Set<string>(
  VOLUNTEER_TARGET_OPTIONS.map(option => option.value)
)

const VOLUNTEER_TARGET_LABEL_BY_CODE = new Map<string, string>(
  VOLUNTEER_TARGET_OPTIONS.map(option => [option.value, option.label])
)

/** 조회·구 저장값 → 코드. `기타`는 선택지에서 빠졌으므로 원문을 유지한다. */
const VOLUNTEER_TARGET_CODE_BY_TOKEN: Record<string, VolunteerTargetCode> = {
  elementary: 'elementary',
  초등학생: 'elementary',
  middle: 'middle',
  중학생: 'middle',
  high: 'high',
  고등학생: 'high',
  university: 'university',
  '대학(원)생': 'university',
  대학생: 'university',
  adult: 'adult',
  성인: 'adult',
  일반인: 'adult',
}

export function normalizeVolunteerTargetToken(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  return VOLUNTEER_TARGET_CODE_BY_TOKEN[trimmed] ?? trimmed
}

export function normalizeVolunteerTargetList(raw: readonly string[]): string[] {
  const targets: string[] = []
  for (const item of raw) {
    const token = normalizeVolunteerTargetToken(item)
    if (!token || targets.includes(token)) continue
    targets.push(token)
  }
  return targets
}

function splitVolunteerTargetText(raw: string): string[] {
  return raw
    .split(/[,，·]/)
    .map(part => part.trim())
    .filter(Boolean)
}

export function resolveProgramVolunteerTargets(program: {
  volunteerTargets?: string[]
  volunteerTarget?: string
}): string[] {
  if (program.volunteerTargets?.length) return normalizeVolunteerTargetList(program.volunteerTargets)
  const raw = program.volunteerTarget?.trim()
  if (!raw || raw === '-') return []
  return normalizeVolunteerTargetList(splitVolunteerTargetText(raw))
}

export function formatVolunteerTargetLabel(target: string): string {
  const token = normalizeVolunteerTargetToken(target)
  return VOLUNTEER_TARGET_LABEL_BY_CODE.get(token) ?? target.trim()
}

export function formatVolunteerTargetsLabel(targets: string[]): string {
  if (targets.length === 0) return '-'
  return targets.map(formatVolunteerTargetLabel).join(', ')
}

export function parseVolunteerTargetsSelectValue(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const targets = normalizeVolunteerTargetList(value.map(String)).filter(
    item => VOLUNTEER_TARGET_VALUES.has(item) || item === '기타'
  )
  return targets.length > 0 ? targets : undefined
}

const INSTRUCTOR_TARGET_VALUES = new Set<string>(
  INSTRUCTOR_TARGET_OPTIONS.map(option => option.value)
)

export function normalizeInstructorTargetList(raw: readonly string[]): string[] {
  return normalizeVolunteerTargetList(raw).filter(item => INSTRUCTOR_TARGET_VALUES.has(item))
}

export function resolveProgramInstructorTargets(program: {
  instructorTargets?: string[]
  instructorTarget?: string
}): string[] {
  if (program.instructorTargets?.length) {
    return normalizeInstructorTargetList(program.instructorTargets)
  }
  const raw = program.instructorTarget?.trim()
  if (!raw) return []
  return normalizeInstructorTargetList(
    raw
      .split(/[,，·]/)
      .map(part => part.trim())
      .filter(Boolean)
  )
}

export function formatInstructorTargetsLabel(targets: string[]): string {
  if (targets.length === 0) return '-'
  return targets.map(formatVolunteerTargetLabel).join(', ')
}

export function parseInstructorTargetsSelectValue(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const targets = normalizeInstructorTargetList(value.map(String))
  return targets.length > 0 ? targets : undefined
}

export const TARGET_LEVEL_LABEL: Record<string, string> = {
  elementary: '초등학교',
  middle: '중학교',
  high: '고등학교',
  university: '대학(원)생',
  adult: '성인',
}

const TARGET_LEVEL_VALUES = new Set<string>([
  'elementary',
  'middle',
  'high',
  'university',
  'adult',
])

/** API·serviceDetailJson 한글 라벨 → 도메인 enum */
const TARGET_LEVEL_ALIASES: Record<string, TargetLevel> = {
  elementary: 'elementary',
  elementary_school: 'elementary',
  초: 'elementary',
  초등: 'elementary',
  초등학생: 'elementary',
  초등학교: 'elementary',
  middle: 'middle',
  middle_school: 'middle',
  중: 'middle',
  중등: 'middle',
  중학생: 'middle',
  중학교: 'middle',
  high: 'high',
  high_school: 'high',
  고: 'high',
  고등: 'high',
  고등학생: 'high',
  고등학교: 'high',
  university: 'university',
  college: 'university',
  대학: 'university',
  대학생: 'university',
  대학생원: 'university',
  '대학(원)생': 'university',
  adult: 'adult',
  adults: 'adult',
  성인: 'adult',
}

/** 단일 교육 대상 값을 도메인 enum으로 정규화. 알 수 없으면 undefined */
export function normalizeTargetLevelValue(raw: unknown): TargetLevel | undefined {
  if (raw == null) return undefined
  const trimmed = String(raw).trim()
  if (!trimmed) return undefined
  if (TARGET_LEVEL_VALUES.has(trimmed)) return trimmed as TargetLevel
  const key = trimmed.toLowerCase().replace(/[\s-]+/g, '_')
  if (TARGET_LEVEL_VALUES.has(key)) return key as TargetLevel
  return TARGET_LEVEL_ALIASES[trimmed] ?? TARGET_LEVEL_ALIASES[key]
}

function normalizeTargetLevelList(
  raw: Array<TargetLevel | string | null | undefined>
): TargetLevel[] {
  const levels = raw
    .map(normalizeTargetLevelValue)
    .filter((level): level is TargetLevel => level != null)
  return [...new Set(levels)]
}

/**
 * 목록·상세 표시용 교육 대상.
 * `targetLevels` 키가 배열이면(빈 배열 포함) 그 배열이 SSOT. 키가 없을 때만 `targetLevel`.
 */
export function resolveProgramTargetLevels(program: {
  targetLevels?: Array<TargetLevel | string | null | undefined> | null
  targetLevel?: TargetLevel | string | null
}): TargetLevel[] {
  if (Array.isArray(program.targetLevels)) {
    return normalizeTargetLevelList(program.targetLevels)
  }
  if (program.targetLevel) {
    return normalizeTargetLevelList([program.targetLevel])
  }
  return []
}

function parseTargetLevelFromDisplayPart(part: string): TargetLevel | undefined {
  const trimmed = part.trim()
  if (!trimmed) return undefined
  const direct = normalizeTargetLevelValue(trimmed)
  if (direct) return direct
  for (const [code, display] of Object.entries(TARGET_LEVEL_LABEL)) {
    if (trimmed.includes(display)) return code as TargetLevel
  }
  if (/대학/.test(trimmed)) return 'university'
  if (/고등|고등학교/.test(trimmed)) return 'high'
  if (/중등|중학교|중학/.test(trimmed)) return 'middle'
  if (/초등|초등학교/.test(trimmed)) return 'elementary'
  if (/성인/.test(trimmed)) return 'adult'
  return normalizeTargetLevelValue(trimmed.split(/\s+/)[0])
}

/** 조회 라벨(초등, 중학교, 대학(원)생) → 컬럼용 enum 배열 */
export function parseTargetLevelsFromDisplayLabel(label: string | undefined): TargetLevel[] {
  if (!label?.trim() || label.trim() === '-') return []
  const fromParts = label
    .split(/[,，]/)
    .map(part => parseTargetLevelFromDisplayPart(part))
    .filter((level): level is TargetLevel => level != null)
  if (fromParts.length > 0) return [...new Set(fromParts)]

  const fromFullLabel: TargetLevel[] = []
  for (const [code, display] of Object.entries(TARGET_LEVEL_LABEL)) {
    if (label.includes(display)) {
      fromFullLabel.push(code as TargetLevel)
    }
  }
  if (/대학/.test(label) && !fromFullLabel.includes('university')) {
    fromFullLabel.push('university')
  }
  return [...new Set(fromFullLabel)]
}

const RECRUIT_TARGET_LEVELS_OVERLAY_KEYS = [
  'recruit.targetLevels',
  'recruit.individual.targetLevels',
  'ujat.recruit.institution.targetLevels',
] as const

function parseTargetLevelsFromRegistrationOverlay(
  overlay?: Record<string, unknown> | null
): TargetLevel[] {
  if (!overlay) return []
  for (const key of RECRUIT_TARGET_LEVELS_OVERLAY_KEYS) {
    const raw = overlay[key]
    if (!Array.isArray(raw)) continue
    const levels = raw
      .map(normalizeTargetLevelValue)
      .filter((level): level is TargetLevel => level != null)
    if (levels.length > 0) return [...new Set(levels)]
  }
  return []
}

function pickRichestTargetLevels(...lists: TargetLevel[][]): TargetLevel[] {
  return lists.reduce((best, next) => (next.length > best.length ? next : best), [])
}

/**
 * 저장·hydrate용 교육 대상.
 * 컬럼 `targetLevels`가 배열이면(빈 배열 포함) 컬럼만 쓴다.
 * 키가 없을 때만 overlay / 모집 라벨 / `targetLevel`로 legacy hydrate.
 */
export function resolvePersistedProgramTargetLevels(program: {
  targetLevels?: Array<TargetLevel | string | null | undefined> | null
  targetLevel?: TargetLevel | string | null
  registrationOverlay?: Record<string, unknown> | null
  generalCommonInfo?: {
    participantRecruitmentInfo?: {
      educationTarget?: string
      recruitmentTarget?: string
    } | null
  } | null
}): TargetLevel[] {
  if (Array.isArray(program.targetLevels)) {
    return normalizeTargetLevelList(program.targetLevels)
  }
  const info = program.generalCommonInfo?.participantRecruitmentInfo
  return pickRichestTargetLevels(
    parseTargetLevelsFromRegistrationOverlay(program.registrationOverlay),
    parseTargetLevelsFromDisplayLabel(info?.educationTarget ?? info?.recruitmentTarget),
    resolveProgramTargetLevels(program)
  )
}

export function formatTargetLevelsLabel(
  levels: TargetLevel[],
  labels: Record<string, string> = TARGET_LEVEL_LABEL
): string {
  if (levels.length === 0) return '-'
  return levels.map(level => labels[level] ?? level).join(', ')
}

export function parseTargetLevelsSelectValue(value: unknown): TargetLevel[] | undefined {
  if (!Array.isArray(value)) return undefined
  const levels = value
    .map(normalizeTargetLevelValue)
    .filter((item): item is TargetLevel => item != null)
  return levels.length > 0 ? [...new Set(levels)] : undefined
}

export const LIFECYCLE_OPTIONS = PROGRAM_LIFECYCLE_STATUS_SELECT_ORDER.map(status => ({
  value: status,
  label: getProgramLifecycleLabel(status),
}))

// ─── 공통 정보 탭 전용 옵션 ─────────────────────────────────────

export const TEAM_DIVISION_OPTIONS = [
  { value: 'C&D', label: 'C&D' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: '기타', label: '기타' },
]

export const EDUCATION_PROCESS_OPTIONS = [
  { value: 'Traditional (Paper)', label: 'Traditional (Paper)' },
  { value: 'Digital', label: 'Digital' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: '기타', label: '기타' },
]

export const IP_OWNED_OPTIONS = [
  { value: 'JA', label: 'JA' },
  { value: 'Partner', label: 'Partner' },
  { value: 'Joint', label: 'Joint' },
]

export const COURSE_DELIVERED_BY_OPTIONS = [
  { value: 'JA', label: 'JA' },
  { value: 'Jointly', label: 'Jointly' },
  { value: 'Partner', label: 'Partner' },
]

export const PARTNER_INVOLVEMENT_OPTIONS = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
]

export const IPS_OPTIONS = [
  { value: 'Inspire', label: 'Inspire' },
  { value: 'Prepare', label: 'Prepare' },
  { value: 'Succeed', label: 'Succeed' },
]

export const PROGRAM_CATEGORY_OPTIONS = [
  { value: '자격증 수여 (Credential)', label: '자격증 수여 (Credential)' },
  { value: '수료증', label: '수료증' },
  { value: '기타', label: '기타' },
]

export const PROGRAM_CHANNEL_OPTIONS = [
  { value: '다운받을 자료 (Downloaded resource)', label: '다운받을 자료 (Downloaded resource)' },
  { value: '온라인 플랫폼', label: '온라인 플랫폼' },
  { value: '대면', label: '대면' },
  { value: '기타', label: '기타' },
]

// ─── 기본 콘텐츠 (시안 placeholder) ────────────────────────

export const DEFAULT_PROGRAM_DESCRIPTION = `제이에이코리아(JA Korea)는 매년 지역별 대학생 봉사단과 함께 초등학생 대상 경제교육을 무료로 진행하고 있습니다. 대학생 봉사단원이 학교를 방문하여 재미있는 경제교육 수업을 진행하며, 교재·교구 등 학습에 필요한 자료를 무료로 제공합니다.

많은 관심과 신청 부탁드립니다.`

export const DEFAULT_RECRUITMENT_GUIDE = `1. 금요일 오전 1~4교시 중 4회 수업 진행
2. 2026학년도 1학기(4~6월) 또는 2학기(9~11월) 중 운영
3. 학교당 최소 4학급 이상 신청
4. 학급당 대학생 2명 배치, 대면 교육 진행
5. 1교당 여러 학년 신청 가능 (1회 신청으로 처리)`

export const DEFAULT_LEARNING_SUPPORT = `선정된 학교에 한하여 다음과 같이 지원 예정

· 초등학생 대상 학급별 대면 교육
· 경제교육 교재·교구 제공
· 대학생경제교육봉사단 파견`

export const DEFAULT_ADDITIONAL_HTML = `<p><strong>프로그램 운영 협조사항</strong></p>
<ol>
<li>프로그램 일정확인 및 소통안내<br>대표 담당교사와 소통이 진행 되오니 꼭 지정하여 신청해주시기 바랍니다.</li>
<li>JA Korea 대학생경제교육봉사단 운영관련
<ul>
<li>공문 필요 시 사전 요청 필요</li>
<li>봉사단 개인정보동의서 및 성범죄경력조회 수신 확인</li>
<li>교육 진행 시 학급정보(학생 수, 대기실 위치 등) 사전 공지</li>
<li>특이사항 사전 공지</li>
</ul>
</li>
</ol>`

// ─── 썸네일 유틸 ──────────────────────────────────────────

export function getThumbnailFilename(url: string | undefined): string {
  if (!url) return '파일명.jpg'
  try {
    const path = new URL(url).pathname
    const name = path.split('/').pop() || ''
    const decoded = decodeURIComponent(name)
    if (decoded && decoded.includes('.')) return decoded
    return decoded ? `${decoded}.jpg` : '썸네일.jpg'
  } catch {
    return '파일명.jpg'
  }
}
