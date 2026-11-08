/**
 * Platform 희망 일정 UI ↔ Portal preferredScheduleBlocks / answers
 */

import type { ApplyPreferredScheduleBlock } from '../ui/apply-preferred-schedule/apply-preferred-schedule'
import type { PortalPreferredScheduleBlock } from '../api/application-types'

function normalizeScheduleTime(raw: string): string {
  const trimmed = raw.trim()
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return trimmed
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return trimmed
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return trimmed
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const SCHEDULE_TIME_RE = /^\d{2}:\d{2}$/

/**
 * 희망 차시 선택값은 화면에서 `1`, `2`처럼 전달되지만 legacy draft에는
 * `1교시` 형태가 남아 있을 수 있다. BE가 사용하는 sessionCount는 선택한
 * 차시 번호를 그대로 반영해야 하므로 숫자 prefix를 정규화한다.
 */
function parsePreferredSessionCount(classPeriod: string): number {
  const match = classPeriod.trim().match(/^\d+/)
  const value = match ? Number(match[0]) : Number.NaN
  return Number.isInteger(value) && value > 0 ? value : 1
}

function isValidScheduleTime(value: string): boolean {
  if (!SCHEDULE_TIME_RE.test(value)) return false
  const [hour, minute] = value.split(':').map(Number)
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

export const PREFERRED_SCHEDULE_TIME_ORDER_ERROR_MESSAGE =
  '교육 종료 시간은 시작 시간 이후로 입력해 주세요.'

export function formatPreferredSessionCountRangeMessage(range: {
  min: number
  max: number
}): string {
  return `${range.min}차시 이상 최대 ${range.max}차시까지 신청할 수 있습니다.`
}

export type PreferredScheduleBlocksMapOptions = {
  /** 일정형 단일 기간 — 희망 교육일만 (sessionTimes는 빈 배열) */
  dateOnly?: boolean
  /** UJAT 기관 — { preferenceRank, date }만. classPeriod/sessionTimes 없음. max 10 */
  dateFieldsOnly?: boolean
  /** Gemini 기관 — 희망 차시 2~4만 제출 */
  sessionCountRange?: { min: number; max: number }
  /**
   * 일반 기관 신청(커리큘럼·기간 지정). 일반 프로그램에는 교시 개념이 없다(교육받은교사 전용).
   * - `sessionCount` 지정(단일 회차): 교시·차시 입력 없이 날짜·시작/종료 시간만 받고,
   *   커리큘럼 1일 차시 수를 sessionCount로 제출한다.
   * - 미지정(복수 회차): 희망 차시 셀렉트 값(classPeriod)을 sessionCount로 제출한다.
   */
  generalInstitution?: { sessionCount?: number }
}

function readGeneralInstitutionFixedSessionCount(
  options: PreferredScheduleBlocksMapOptions | undefined
): number | undefined {
  const value = options?.generalInstitution?.sessionCount
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : undefined
}

export const UJAT_PREFERRED_SCHEDULE_BLOCK_MAX = 10

export function toPortalPreferredScheduleBlocks(
  blocks: readonly ApplyPreferredScheduleBlock[],
  options?: PreferredScheduleBlocksMapOptions,
): PortalPreferredScheduleBlock[] {
  const out: PortalPreferredScheduleBlock[] = []
  let rank = 1
  for (const block of blocks) {
    const date = block.date.trim()
    if (options?.dateFieldsOnly) {
      if (!date) continue
      out.push({
        preferenceRank: rank,
        date,
      })
      rank += 1
      if (out.length >= UJAT_PREFERRED_SCHEDULE_BLOCK_MAX) break
      continue
    }
    if (options?.dateOnly) {
      if (!date) continue
      out.push({
        preferenceRank: rank,
        date,
        sessionCount: 1,
        sessionTimes: [],
        ...(block.session ? { session: block.session } : {}),
      })
      rank += 1
      continue
    }
    const startTime = normalizeScheduleTime(block.startTime)
    const endTime = normalizeScheduleTime(block.endTime)
    const fixedSessionCount = readGeneralInstitutionFixedSessionCount(options)
    if (fixedSessionCount != null) {
      if (!date || !startTime || !endTime) continue
      out.push({
        preferenceRank: rank,
        date,
        sessionCount: fixedSessionCount,
        startTime,
        endTime,
        ...(block.session ? { session: block.session } : {}),
        sessionTimes: [
          {
            sessionIndex: 1,
            startTime,
            endTime,
            timeRange: `${startTime}~${endTime}`,
          },
        ],
      })
      rank += 1
      continue
    }
    const classPeriod = block.classPeriod.trim()
    /** BE: date·startTime·endTime 필수. 일반·Gemini 기관은 차시도 필수 */
    if (!date || !startTime || !endTime || !classPeriod) continue
    const sessionCount = parsePreferredSessionCount(classPeriod)
    const sessionCountRange = options?.sessionCountRange
    if (
      sessionCountRange &&
      (sessionCount < sessionCountRange.min || sessionCount > sessionCountRange.max)
    ) {
      continue
    }
    out.push({
      preferenceRank: rank,
      date,
      sessionCount,
      startTime,
      endTime,
      ...(block.session ? { session: block.session } : {}),
      sessionTimes: [
        {
          sessionIndex: 1,
          classPeriod,
          startTime,
          endTime,
          timeRange: `${startTime}~${endTime}`,
        },
      ],
    })
    rank += 1
  }
  return out
}

/**
 * Submit answers 의 preferred-schedule 키용.
 * 빈 배열은 BE 필수값 누락으로 거절되므로, 완전 입력된 블록이 있을 때만 반환한다.
 */
export function toPreferredScheduleAnswerValue(
  blocks: readonly ApplyPreferredScheduleBlock[],
  options?: PreferredScheduleBlocksMapOptions,
): PortalPreferredScheduleBlock[] | null {
  const mapped = toPortalPreferredScheduleBlocks(blocks, options)
  return mapped.length > 0 ? mapped : null
}

/** 고정 일정 선택형은 일정 객체가 아니라 Runtime option value 배열을 제출한다. */
export function toFixedScheduleOptionAnswerValue(
  blocks: readonly Pick<ApplyPreferredScheduleBlock, 'scheduleOptionId'>[],
): string[] | null {
  return toFixedScheduleSelectedIds(
    blocks.map(block => block.scheduleOptionId)
  )
}

/** Runtime `scheduleOptions[].value|id` 선택 배열. 빈 선택은 null. */
export function toFixedScheduleSelectedIds(
  selectedIds: readonly (string | null | undefined)[],
): string[] | null {
  const out: string[] = []
  const seen = new Set<string>()
  for (const selected of selectedIds) {
    const value = selected?.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out.length > 0 ? out : null
}

export function capFixedScheduleSelectedIds(
  selectedIds: readonly string[],
  maxCount?: number | null,
): string[] {
  const unique = toFixedScheduleSelectedIds(selectedIds) ?? []
  if (maxCount == null || maxCount < 1) return unique
  return unique.slice(0, maxCount)
}

/** 상한 1이면 새로 고른 항목으로 교체(라디오). 그 외는 추가 후 cap. */
export function toggleFixedScheduleSelectedIds(
  selectedIds: readonly string[],
  id: string,
  checked: boolean,
  maxCount?: number | null,
): string[] {
  const token = id.trim()
  if (!token) return capFixedScheduleSelectedIds(selectedIds, maxCount)
  if (!checked) return selectedIds.filter(value => value !== token)
  if (maxCount === 1) return [token]
  return capFixedScheduleSelectedIds([...selectedIds, token], maxCount)
}

export function selectedFixedScheduleIdsFromDraftAnswer(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return (
    toFixedScheduleSelectedIds(
      raw.map(item => (typeof item === 'string' || typeof item === 'number' ? String(item) : ''))
    ) ?? []
  )
}

/** 화면 검증 — 날짜만 있고 교시·시간이 비면 제출 차단 */
export function findIncompletePreferredScheduleMessage(
  blocks: readonly ApplyPreferredScheduleBlock[],
  options?: PreferredScheduleBlocksMapOptions,
): string | null {
  const withoutClassPeriod = readGeneralInstitutionFixedSessionCount(options) != null
  const hasPartial = blocks.some(block => {
    const date = block.date.trim()
    const classPeriod = block.classPeriod.trim()
    const startTime = normalizeScheduleTime(block.startTime)
    const endTime = normalizeScheduleTime(block.endTime)
    const any = Boolean(date || classPeriod || startTime || endTime)
    if (options?.dateOnly) {
      const complete = Boolean(date)
      return any && !complete
    }
    const complete = Boolean(
      date && (withoutClassPeriod || classPeriod) && startTime && endTime
    )
    return any && !complete
  })
  if (hasPartial) {
    if (options?.dateOnly) return '진행 희망 교육 일정에 희망 교육일을 입력해 주세요.'
    if (withoutClassPeriod) {
      return '진행 희망 교육 일정에 날짜·시작/종료 시간을 모두 입력해 주세요.'
    }
    if (options?.generalInstitution) {
      return '진행 희망 교육 일정에 날짜·희망 차시·시작/종료 시간을 모두 입력해 주세요.'
    }
    return '진행 희망 교육 일정에 날짜·차시(교시)·시작/종료 시간을 모두 입력해 주세요.'
  }
  const sessionCountRange = options?.sessionCountRange
  if (sessionCountRange && !options?.dateOnly) {
    const hasInvalidSessionCount = blocks.some(block => {
      const classPeriod = block.classPeriod.trim()
      if (!classPeriod) return false
      const sessionCount = parsePreferredSessionCount(classPeriod)
      return sessionCount < sessionCountRange.min || sessionCount > sessionCountRange.max
    })
    if (hasInvalidSessionCount) {
      return formatPreferredSessionCountRangeMessage(sessionCountRange)
    }
  }
  if (!options?.dateOnly) {
    const hasInvalidTimeRange = blocks.some(block => {
      const startTime = normalizeScheduleTime(block.startTime)
      const endTime = normalizeScheduleTime(block.endTime)
      if (!startTime || !endTime) return false
      return !isValidScheduleTime(startTime) || !isValidScheduleTime(endTime) || endTime <= startTime
    })
    if (hasInvalidTimeRange) return PREFERRED_SCHEDULE_TIME_ORDER_ERROR_MESSAGE
  }
  if (toPortalPreferredScheduleBlocks(blocks, options).length === 0) {
    return '진행 희망 교육 일정을 한 개 이상 입력해 주세요.'
  }
  return null
}

export function preferredScheduleBlocksFromDraftAnswers(
  draftAnswers: Record<string, unknown> | null | undefined,
  answerKey: string,
): ApplyPreferredScheduleBlock[] | null {
  if (!draftAnswers) return null
  const raw = draftAnswers[answerKey]
  if (!Array.isArray(raw) || raw.length === 0) return null
  const blocks: ApplyPreferredScheduleBlock[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const date =
      (typeof row.date === 'string' && row.date) ||
      (typeof row.dateText === 'string' && row.dateText) ||
      ''
    const sessions = Array.isArray(row.sessionTimes)
      ? row.sessionTimes
      : Array.isArray(row.times)
        ? row.times
        : []
    const first =
      sessions[0] && typeof sessions[0] === 'object'
        ? (sessions[0] as Record<string, unknown>)
        : null
    blocks.push({
      date,
      session: typeof row.session === 'string' ? row.session : undefined,
      classPeriod: typeof first?.classPeriod === 'string' ? first.classPeriod : '',
      startTime: normalizeScheduleTime(
        typeof first?.startTime === 'string'
          ? first.startTime
          : typeof first?.start === 'string'
            ? first.start
            : '',
      ),
      endTime: normalizeScheduleTime(
        typeof first?.endTime === 'string'
          ? first.endTime
          : typeof first?.end === 'string'
            ? first.end
            : '',
      ),
    })
  }
  return blocks.length > 0 ? blocks : null
}
