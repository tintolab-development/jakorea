/**
 * 1사1교(institution-economy) 진행 희망 교육 일정 — 화면 블록 ↔ Portal preferredScheduleBlocks / answers
 *
 * CMS `1c-1s/paragraphs/preferred-schedule-paragraph.tsx`와 같은 구조:
 * 지망마다 희망 교육일 + 희망 차시(1|2), 차시별 교시·시작~종료. 2차시 교시는 1차시 + 1(연강).
 * BE `RequestedScheduleResponse.startPeriod`(시작 교시)·`sessionCount`(차시 수)로 저장된다.
 */

import type {
  PortalPreferredScheduleBlock,
  PortalPreferredScheduleSessionTime,
} from '../api/application-types'

export const ECONOMY_PREFERRED_SCHEDULE_BLOCK_COUNT = 2
export const ECONOMY_PREFERRED_SCHEDULE_MAX_CLASS_PERIOD = 12

export type EconomyPreferredScheduleSession = '' | '1' | '2'

export type EconomyPreferredScheduleBlock = {
  /** `YYYY-MM-DD` */
  date: string
  session: EconomyPreferredScheduleSession
  firstClassPeriod: string
  /** `HH:mm` */
  firstStart: string
  firstEnd: string
  secondStart: string
  secondEnd: string
}

export function createEmptyEconomyPreferredScheduleBlock(): EconomyPreferredScheduleBlock {
  return {
    date: '',
    session: '',
    firstClassPeriod: '',
    firstStart: '',
    firstEnd: '',
    secondStart: '',
    secondEnd: '',
  }
}

export function createEmptyEconomyPreferredScheduleBlocks(): EconomyPreferredScheduleBlock[] {
  return Array.from({ length: ECONOMY_PREFERRED_SCHEDULE_BLOCK_COUNT }, () =>
    createEmptyEconomyPreferredScheduleBlock()
  )
}

/** CMS `resolveNextClassPeriod` — 2차시는 1차시 다음 교시 */
export function resolveEconomySecondClassPeriod(firstClassPeriod: string): string {
  const trimmed = firstClassPeriod.trim()
  if (!trimmed) return ''
  const parsed = Number(trimmed)
  if (!Number.isInteger(parsed)) return ''
  return String(parsed + 1)
}

function normalizeTime(raw: string): string {
  const match = raw.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return raw.trim()
  return `${match[1]!.padStart(2, '0')}:${match[2]}`
}

function isValidTime(value: string): boolean {
  const match = value.match(/^(\d{2}):(\d{2})$/)
  if (!match) return false
  const hour = Number(match[1])
  const minute = Number(match[2])
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59
}

function sessionCountOf(block: EconomyPreferredScheduleBlock): number {
  return block.session === '2' ? 2 : block.session === '1' ? 1 : 0
}

function hasAnyInput(block: EconomyPreferredScheduleBlock): boolean {
  return Boolean(
    block.date.trim() ||
      block.session ||
      block.firstClassPeriod.trim() ||
      block.firstStart.trim() ||
      block.firstEnd.trim() ||
      block.secondStart.trim() ||
      block.secondEnd.trim()
  )
}

/** CMS `isScheduleBlockIncomplete`(economy-program-registration-required-fields)와 같은 기준 */
function isBlockComplete(block: EconomyPreferredScheduleBlock): boolean {
  if (!block.date.trim()) return false
  const count = sessionCountOf(block)
  if (count === 0) return false
  if (!block.firstClassPeriod.trim()) return false
  if (!normalizeTime(block.firstStart) || !normalizeTime(block.firstEnd)) return false
  if (count === 2 && (!normalizeTime(block.secondStart) || !normalizeTime(block.secondEnd))) {
    return false
  }
  return true
}

function sessionTime(
  sessionIndex: number,
  classPeriod: string,
  start: string,
  end: string
): PortalPreferredScheduleSessionTime {
  const startTime = normalizeTime(start)
  const endTime = normalizeTime(end)
  return { sessionIndex, classPeriod, startTime, endTime, timeRange: `${startTime}~${endTime}` }
}

/** 완전 입력된 블록만 지망 순서대로 변환 (preferenceRank = 화면 지망 순서) */
export function toEconomyPortalPreferredScheduleBlocks(
  blocks: readonly EconomyPreferredScheduleBlock[]
): PortalPreferredScheduleBlock[] {
  const out: PortalPreferredScheduleBlock[] = []
  blocks.slice(0, ECONOMY_PREFERRED_SCHEDULE_BLOCK_COUNT).forEach((block, index) => {
    if (!isBlockComplete(block)) return
    const sessionCount = sessionCountOf(block)
    const firstClassPeriod = block.firstClassPeriod.trim()
    const sessionTimes = [sessionTime(1, firstClassPeriod, block.firstStart, block.firstEnd)]
    if (sessionCount === 2) {
      sessionTimes.push(
        sessionTime(
          2,
          resolveEconomySecondClassPeriod(firstClassPeriod),
          block.secondStart,
          block.secondEnd
        )
      )
    }
    out.push({
      preferenceRank: index + 1,
      date: block.date.trim(),
      sessionCount,
      startTime: sessionTimes[0]!.startTime,
      endTime: sessionTimes[sessionTimes.length - 1]!.endTime,
      sessionTimes,
    })
  })
  return out
}

/** answers 의 preferred-schedule 키 — 완전 입력 블록이 없으면 null (BE 필수 누락 방지) */
export function toEconomyPreferredScheduleAnswerValue(
  blocks: readonly EconomyPreferredScheduleBlock[]
): PortalPreferredScheduleBlock[] | null {
  const mapped = toEconomyPortalPreferredScheduleBlocks(blocks)
  return mapped.length > 0 ? mapped : null
}

/**
 * 화면 검증. CMS 1사1교 필수 기준과 같이 1·2지망 모두 날짜·희망 차시·교시·시간을 요구한다.
 * `required=false`면 빈 지망은 허용하고 일부만 입력된 지망만 막는다.
 */
export function findIncompleteEconomyPreferredScheduleMessage(
  blocks: readonly EconomyPreferredScheduleBlock[],
  required: boolean
): string | null {
  const ranked = Array.from(
    { length: ECONOMY_PREFERRED_SCHEDULE_BLOCK_COUNT },
    (_, index) => blocks[index] ?? createEmptyEconomyPreferredScheduleBlock()
  )
  for (const [index, block] of ranked.entries()) {
    if (!required && !hasAnyInput(block)) continue
    if (!isBlockComplete(block)) {
      return `진행 희망 교육 일정 ${index + 1}지망의 희망 교육일·희망 차시·교시·시간을 모두 입력해 주세요.`
    }
    const firstPeriod = Number(block.firstClassPeriod.trim())
    const lastPeriod = firstPeriod + sessionCountOf(block) - 1
    if (
      !Number.isInteger(firstPeriod) ||
      firstPeriod < 1 ||
      lastPeriod > ECONOMY_PREFERRED_SCHEDULE_MAX_CLASS_PERIOD
    ) {
      return `수업 진행 교시는 1~${ECONOMY_PREFERRED_SCHEDULE_MAX_CLASS_PERIOD}교시 안에서 입력해 주세요.`
    }
    const ranges: [string, string][] = [[block.firstStart, block.firstEnd]]
    if (sessionCountOf(block) === 2) ranges.push([block.secondStart, block.secondEnd])
    for (const [rawStart, rawEnd] of ranges) {
      const start = normalizeTime(rawStart)
      const end = normalizeTime(rawEnd)
      if (!isValidTime(start) || !isValidTime(end) || end <= start) {
        return '교육 종료 시간은 시작 시간 이후로 입력해 주세요.'
      }
    }
  }
  if (required && toEconomyPortalPreferredScheduleBlocks(ranked).length === 0) {
    return '진행 희망 교육 일정을 입력해 주세요.'
  }
  return null
}

function readString(record: Record<string, unknown> | null, ...keys: string[]): string {
  if (!record) return ''
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return ''
}

function asRecord(raw: unknown): Record<string, unknown> | null {
  return raw != null && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : null
}

/** 저장된 answers(preferredScheduleBlocks 형태) → 화면 블록. 항상 2지망을 채워 돌려준다. */
export function economyPreferredScheduleBlocksFromDraftAnswer(
  raw: unknown
): EconomyPreferredScheduleBlock[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null
  const out = createEmptyEconomyPreferredScheduleBlocks()
  let found = false
  raw.forEach((item, index) => {
    const row = asRecord(item)
    if (!row) return
    const rankValue = Number(row.preferenceRank)
    const slot = Number.isInteger(rankValue) && rankValue >= 1 ? rankValue - 1 : index
    if (slot < 0 || slot >= ECONOMY_PREFERRED_SCHEDULE_BLOCK_COUNT) return
    const sessions = Array.isArray(row.sessionTimes)
      ? row.sessionTimes
      : Array.isArray(row.times)
        ? row.times
        : []
    const first = asRecord(sessions[0])
    const second = asRecord(sessions[1])
    const countValue = Number(row.sessionCount)
    const session: EconomyPreferredScheduleSession =
      countValue === 2 || second ? '2' : countValue === 1 || first ? '1' : ''
    out[slot] = {
      date: readString(row, 'date', 'dateText'),
      session,
      firstClassPeriod: readString(first, 'classPeriod').replace(/[^\d]/g, ''),
      firstStart: normalizeTime(readString(first, 'startTime', 'start')),
      firstEnd: normalizeTime(readString(first, 'endTime', 'end')),
      secondStart: normalizeTime(readString(second, 'startTime', 'start')),
      secondEnd: normalizeTime(readString(second, 'endTime', 'end')),
    }
    found = true
  })
  return found ? out : null
}
