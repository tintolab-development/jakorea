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

function isValidScheduleTime(value: string): boolean {
  if (!SCHEDULE_TIME_RE.test(value)) return false
  const [hour, minute] = value.split(':').map(Number)
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

export const PREFERRED_SCHEDULE_TIME_ORDER_ERROR_MESSAGE =
  '교육 종료 시간은 시작 시간 이후로 입력해 주세요.'

export type PreferredScheduleBlocksMapOptions = {
  /** 일정형 단일 기간 — 희망 교육일만 */
  dateOnly?: boolean
}

export function toPortalPreferredScheduleBlocks(
  blocks: readonly ApplyPreferredScheduleBlock[],
  options?: PreferredScheduleBlocksMapOptions,
): PortalPreferredScheduleBlock[] {
  const out: PortalPreferredScheduleBlock[] = []
  let rank = 1
  for (const block of blocks) {
    const date = block.date.trim()
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
    const classPeriod = block.classPeriod.trim()
    const startTime = normalizeScheduleTime(block.startTime)
    const endTime = normalizeScheduleTime(block.endTime)
    /** BE: date·classPeriod·startTime·endTime 모두 필수 */
    if (!date || !classPeriod || !startTime || !endTime) continue
    out.push({
      preferenceRank: rank,
      date,
      sessionCount: 1,
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
  const out: string[] = []
  const seen = new Set<string>()
  for (const block of blocks) {
    const value = block.scheduleOptionId?.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out.length > 0 ? out : null
}

/** 화면 검증 — 날짜만 있고 교시·시간이 비면 제출 차단 */
export function findIncompletePreferredScheduleMessage(
  blocks: readonly ApplyPreferredScheduleBlock[],
  options?: PreferredScheduleBlocksMapOptions,
): string | null {
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
    const complete = Boolean(date && classPeriod && startTime && endTime)
    return any && !complete
  })
  if (hasPartial) {
    return options?.dateOnly
      ? '진행 희망 교육 일정에 희망 교육일을 입력해 주세요.'
      : '진행 희망 교육 일정에 날짜·차시(교시)·시작/종료 시간을 모두 입력해 주세요.'
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
