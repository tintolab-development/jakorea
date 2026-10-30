import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { isDefaultEducationSlotName } from '@/shared/lib/education-schedule-name'
import { resolveGeneralProgramCommonInfo } from '@/features/program/general/lib/detail-common-info-display'
import type { Program } from '@/types/domain'

/** Notion 일정형 표기 `일시 ㅣ 일정명` 구분자 (한글 모음 ㅣ) */
const SCHEDULE_DIRECT_NAME_SEPARATOR = ' ㅣ '
const SYNTHETIC_CLASS_NUM = /^(\d+)\s*교시$/u
const EDUCATION_FORMAT_HINT =
  /온라인|오프라인|대면|비대면|혼합|블렌디드|온\s*\/\s*오프|화상/u

function isGenericProgressScheduleName(value: string, round: number): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  if (trimmed === `${round}회차` || trimmed === `${round}차시`) return true
  if (isDefaultEducationSlotName(trimmed)) return true
  if (/^세부 일정\s*\d+$/u.test(trimmed)) return true
  return false
}

function padClockToken(value: string): string {
  return value.replace(/(\d{1,2}):(\d{2})/gu, (_, hour: string, minute: string) => {
    return `${hour.padStart(2, '0')}:${minute}`
  })
}

function isMidnightIso(iso: string): boolean {
  return seoulClock(iso) === '00:00'
}

export type GeneralProgressSessionTableHeaderInput = {
  round: number
  scheduleName?: string | null
  educationScheduleLabel?: string | null
  leadLabel?: string | null
  startAt?: string | null
  endAt?: string | null
  allDay?: boolean | null
  dateLabel?: string | null
  sessionDuration?: string | null
  sessionFormat?: string | null
  sessionClassNum?: string | null
  sessionTimeRange?: string | null
  program?: Program | null
  /**
   * 일정형 · 단일 · 날짜 지정(⑤) — 일정 ID 직접 연결, 회차/차시 없음.
   * 회차 번호로 공통 정보(세부 일정·커리큘럼)를 찾지 않는다.
   * 제목·필터는 `일시 ㅣ 일정명`, 이름이 없으면 일시만.
   */
  scheduleDirect?: boolean
}

export type GeneralProgressSessionTableHeader = {
  round: number
  headerTitle: string
  headerScheduleSummary: string
  headerPeriodRangeLabel: string
  headerPrefix: string
  filterLabel: string
  dateLabel: string
}

function seoulDateKey(iso: string): string | null {
  const stamp = new Date(iso)
  if (Number.isNaN(stamp.getTime())) return null
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(stamp)
  return /^\d{4}-\d{2}-\d{2}$/.test(formatted) ? formatted : null
}

function seoulClock(iso: string): string | null {
  const stamp = new Date(iso)
  if (Number.isNaN(stamp.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(stamp)
  const hour = parts.find(part => part.type === 'hour')?.value
  const minute = parts.find(part => part.type === 'minute')?.value
  if (hour == null || minute == null) return null
  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
}

function formatDateTitle(input: GeneralProgressSessionTableHeaderInput): string {
  if (input.dateLabel?.trim()) {
    return formatCmsScheduleDisplayLabel(input.dateLabel.trim())
  }
  if (!input.startAt?.trim()) return ''
  const key = seoulDateKey(input.startAt)
  return key ? formatCmsScheduleDisplayLabel(key) : formatCmsScheduleDisplayLabel(input.startAt)
}

function isNamedScheduleLead(value: string, round: number): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  if (trimmed === `${round}회차` || trimmed === `${round}차시`) return false
  return true
}

function resolveLeadLabel(input: GeneralProgressSessionTableHeaderInput): string {
  if (input.scheduleDirect) {
    const directName = input.scheduleName?.trim() ?? ''
    if (directName && !isGenericProgressScheduleName(directName, input.round)) return directName
    return input.leadLabel?.trim() ?? ''
  }
  const named =
    input.educationScheduleLabel?.trim() || input.scheduleName?.trim() || ''
  if (named && !isGenericProgressScheduleName(named, input.round) && isNamedScheduleLead(named, input.round)) {
    return named
  }
  if (input.leadLabel?.trim()) return input.leadLabel.trim()
  return `${input.round}회차`
}

function formatMinutesDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return ''
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60}시간`
  return `${minutes}분`
}

function formatDurationLabel(input: GeneralProgressSessionTableHeaderInput): string {
  const stored = input.sessionDuration?.trim() ?? ''
  if (stored && stored !== '-') {
    const minutesMatch = /^(\d+)\s*분$/u.exec(stored)
    if (minutesMatch) return formatMinutesDuration(Number(minutesMatch[1]))
    return stored
  }
  if (input.allDay === true) return ''
  if (!input.startAt?.trim() || !input.endAt?.trim()) return ''
  if (isMidnightIso(input.startAt) && isMidnightIso(input.endAt)) return ''
  const start = Date.parse(input.startAt)
  const end = Date.parse(input.endAt)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return ''
  return formatMinutesDuration(Math.round((end - start) / 60_000))
}

function resolveEducationFormat(input: GeneralProgressSessionTableHeaderInput): string {
  const sessionFormat = input.sessionFormat?.trim() ?? ''
  if (sessionFormat && sessionFormat !== '-' && EDUCATION_FORMAT_HINT.test(sessionFormat)) {
    return sessionFormat
  }
  const common = input.program ? resolveGeneralProgramCommonInfo(input.program) : null
  if (input.scheduleDirect) return common?.educationFormLabel?.trim() || ''
  const roundIndex = Math.max(0, input.round - 1)
  const fromCurriculum = common?.curriculumSessions?.[roundIndex]?.educationFormLabel?.trim()
  if (fromCurriculum) return fromCurriculum
  const fromDetail = common?.scheduleDetails?.[roundIndex]?.educationFormLabel?.trim()
  if (fromDetail) return fromDetail
  return common?.educationFormLabel?.trim() || ''
}

function formatClockRange(input: GeneralProgressSessionTableHeaderInput): string {
  const timeRange = input.sessionTimeRange?.trim() ?? ''
  if (timeRange && timeRange !== '-' && /\d{1,2}\s*:\s*\d{2}/u.test(timeRange)) {
    const spaced = timeRange.includes('~')
      ? timeRange.replace(/~/gu, ' ~ ').replace(/\s{2,}/gu, ' ')
      : timeRange
    return padClockToken(spaced)
  }
  if (!input.startAt?.trim() || !input.endAt?.trim() || input.allDay === true) return ''
  const start = seoulClock(input.startAt)
  const end = seoulClock(input.endAt)
  if (!start || !end) return ''
  if (start === '00:00' && end === '00:00') return ''
  return `${start} ~ ${end}`
}

function resolveClassPeriodFromCommonInfo(input: GeneralProgressSessionTableHeaderInput): string {
  if (input.scheduleDirect) return ''
  const common = input.program ? resolveGeneralProgramCommonInfo(input.program) : null
  const roundIndex = Math.max(0, input.round - 1)
  const summary = common?.scheduleDetails?.[roundIndex]?.progressTimeSummary?.trim() ?? ''
  return summary.includes('교시') ? padClockToken(summary) : ''
}

function formatPeriodLabel(input: GeneralProgressSessionTableHeaderInput): string {
  const classNum = input.sessionClassNum?.trim() ?? ''
  const timeRange = input.sessionTimeRange?.trim() ?? ''
  if (timeRange.includes('교시')) return padClockToken(timeRange.replace(/~/gu, ' ~ ').replace(/\s{2,}/gu, ' '))
  const clock = formatClockRange(input)
  const synthetic = SYNTHETIC_CLASS_NUM.exec(classNum)
  const isSynthetic = synthetic != null && Number(synthetic[1]) === input.round
  if (classNum.includes('교시') && !isSynthetic) {
    if (clock && !classNum.includes(clock)) return `${classNum} (${clock})`
    return classNum
  }
  return resolveClassPeriodFromCommonInfo(input) || clock
}

function joinLeadAndDate(lead: string, dateLabel: string, separator: string): string {
  if (!lead) return dateLabel
  return dateLabel ? `${lead}${separator}${dateLabel}` : lead
}

function joinDateAndName(dateTimeLabel: string, name: string): string {
  if (!name) return dateTimeLabel
  return dateTimeLabel ? `${dateTimeLabel}${SCHEDULE_DIRECT_NAME_SEPARATOR}${name}` : name
}

export function buildGeneralProgressSessionTableHeader(
  input: GeneralProgressSessionTableHeaderInput
): GeneralProgressSessionTableHeader {
  const round = input.round
  const lead = resolveLeadLabel(input)
  const dateLabel = formatDateTitle(input)
  const headerTitle = input.scheduleDirect
    ? joinDateAndName(dateLabel, lead)
    : joinLeadAndDate(lead, dateLabel, ' : ')
  const duration = formatDurationLabel(input)
  const formatLabel = resolveEducationFormat(input)
  const headerScheduleSummary =
    duration && formatLabel ? `${duration} (${formatLabel})` : duration || (formatLabel ? `(${formatLabel})` : '')
  const headerPeriodRangeLabel = formatPeriodLabel(input)
  const headerPrefix = [headerTitle, headerScheduleSummary, headerPeriodRangeLabel]
    .filter(Boolean)
    .join(' | ')
  const filterLabel = input.scheduleDirect
    ? joinDateAndName([dateLabel, headerPeriodRangeLabel].filter(Boolean).join(' '), lead)
    : joinLeadAndDate(lead, dateLabel, ' · ')
  return {
    round,
    headerTitle,
    headerScheduleSummary,
    headerPeriodRangeLabel,
    headerPrefix,
    filterLabel,
    dateLabel,
  }
}
