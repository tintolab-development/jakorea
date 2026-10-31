import dayjs from 'dayjs'
import {
  ujatVolunteerHalfOverlayKey,
  ujatVolunteerRecruitInterviewNamespace,
  ujatVolunteerRecruitInterviewRangeSealKey,
  type UjatVolunteerRecruitHalf,
} from '@/features/program/ujat/lib/ujat-recruit-volunteer-half-overlay'

type RangeSeal = { start: string; end: string }

const HALVES: readonly UjatVolunteerRecruitHalf[] = ['h1', 'h2']

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function serializeOverlayDateValue(value: unknown): unknown {
  if (value == null) return value
  if (dayjs.isDayjs(value)) return value.isValid() ? value.toISOString() : null
  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    const parsed = dayjs(value)
    return parsed.isValid() && (dayjs.isDayjs(value) || value instanceof Date)
      ? parsed.toISOString()
      : value
  }
  if (Array.isArray(value)) return value.map(item => serializeOverlayDateValue(item))
  return value
}

function readCompleteRangeSeal(value: unknown): RangeSeal | null {
  if (!isRecord(value)) return null
  const start = value.start
  const end = value.end
  if (typeof start !== 'string' || typeof end !== 'string') return null
  if (!start.trim() || !end.trim()) return null
  if (!dayjs(start).isValid() || !dayjs(end).isValid()) return null
  return { start, end }
}

function inferTimeUnitFromSlotKeys(keys: unknown): '15' | '30' | '60' | undefined {
  if (!Array.isArray(keys) || keys.length === 0) return undefined
  const first = keys[0]
  if (typeof first !== 'string') return undefined
  const [startRaw, endRaw] = first.split('-')
  const start = Number(startRaw)
  const end = Number(endRaw)
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return undefined
  const minutes = Math.round((end - start) / 60_000)
  if (minutes === 15 || minutes === 30 || minutes === 60) return String(minutes) as '15' | '30' | '60'
  return undefined
}

function parseSlotKeyBounds(key: string): { startMs: number; endMs: number } | null {
  const [startRaw, endRaw] = key.split('-')
  const startMs = Number(startRaw)
  const endMs = Number(endRaw)
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) return null
  return { startMs, endMs }
}

/** 면접 기간(날짜) 밖 슬롯 키를 제거하고, 남은 키로 interviewTimeRange를 다시 맞춘다. */
function pruneInterviewSlotsToRange(
  overlay: Record<string, unknown>,
  ns: string,
  range: RangeSeal
): void {
  const rangeStart = dayjs(range.start).startOf('day')
  const rangeEnd = dayjs(range.end).endOf('day')
  if (!rangeStart.isValid() || !rangeEnd.isValid()) return

  const rawKeys = overlay[`${ns}.selectedSlotKeys`]
  const keys = Array.isArray(rawKeys)
    ? rawKeys.filter((item): item is string => typeof item === 'string')
    : []
  const kept = keys.filter(key => {
    const bounds = parseSlotKeyBounds(key)
    if (!bounds) return false
    const slotDay = dayjs(bounds.startMs)
    return (
      slotDay.isValid() &&
      !slotDay.isBefore(rangeStart, 'day') &&
      !slotDay.isAfter(rangeEnd, 'day')
    )
  })
  overlay[`${ns}.selectedSlotKeys`] = kept

  if (kept.length === 0) {
    overlay[`${ns}.interviewTimeRange`] = []
    return
  }

  let minStart = Number.POSITIVE_INFINITY
  let maxEnd = Number.NEGATIVE_INFINITY
  for (const key of kept) {
    const bounds = parseSlotKeyBounds(key)
    if (!bounds) continue
    minStart = Math.min(minStart, bounds.startMs)
    maxEnd = Math.max(maxEnd, bounds.endMs)
  }
  if (!Number.isFinite(minStart) || !Number.isFinite(maxEnd)) {
    overlay[`${ns}.interviewTimeRange`] = []
    return
  }
  overlay[`${ns}.interviewTimeRange`] = [
    new Date(minStart).toISOString(),
    new Date(maxEnd).toISOString(),
  ]
}

function halfHasInterviewSelection(overlay: Record<string, unknown>, half: UjatVolunteerRecruitHalf): boolean {
  const ns = ujatVolunteerRecruitInterviewNamespace(half)
  return (
    readCompleteRangeSeal(overlay[ujatVolunteerHalfOverlayKey(half, 'interviewRange')]) != null ||
    readCompleteRangeSeal(overlay[ujatVolunteerRecruitInterviewRangeSealKey(half)]) != null ||
    overlay[`${ns}.interviewTimeRange`] != null ||
    overlay[`${ns}.interviewTime`] != null ||
    overlay[`${ns}.timeUnit`] != null ||
    overlay[`${ns}.exclusionState`] != null ||
    (Array.isArray(overlay[`${ns}.selectedSlotKeys`]) &&
      (overlay[`${ns}.selectedSlotKeys`] as unknown[]).length > 0) ||
    (Array.isArray(overlay[`${ns}.appliedUnavailableDates`]) &&
      (overlay[`${ns}.appliedUnavailableDates`] as unknown[]).length > 0)
  )
}

/**
 * 모집 양식에서 고른 면접 기간·시간·단위가 등록 overlay에 빠지지 않게 맞춘다.
 * 봉사자 정보「면접 기간」을 반기 interviewRangeSeal의 SSOT로 쓴다.
 */
export function completeUjatRecruitDateSelections(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...overlay }

  for (const half of HALVES) {
    const ns = ujatVolunteerRecruitInterviewNamespace(half)
    const sealKey = ujatVolunteerRecruitInterviewRangeSealKey(half)
    const formRange = readCompleteRangeSeal(next[ujatVolunteerHalfOverlayKey(half, 'interviewRange')])
    if (formRange) next[sealKey] = formRange

    const activeRange = formRange ?? readCompleteRangeSeal(next[sealKey])
    if (activeRange && Array.isArray(next[`${ns}.selectedSlotKeys`])) {
      pruneInterviewSlotsToRange(next, ns, activeRange)
    }

    if (halfHasInterviewSelection(next, half) && next[`${ns}.timeUnit`] == null) {
      next[`${ns}.timeUnit`] =
        inferTimeUnitFromSlotKeys(next[`${ns}.selectedSlotKeys`]) ?? '30'
    }

    for (const suffix of ['interviewTimeRange', 'interviewTime', 'exceptionDate'] as const) {
      const key = `${ns}.${suffix}`
      if (key in next) next[key] = serializeOverlayDateValue(next[key])
    }
  }

  return next
}
