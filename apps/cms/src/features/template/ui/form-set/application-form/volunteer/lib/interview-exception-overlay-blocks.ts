/**
 * 봉사 면접 예외 일정 블록 — overlay 레코드에서 블록 id·값을 읽는 순수 함수(스토어 아님).
 * 스토어 읽기·쓰기는 `interview-schedule-overlay-sync`.
 */
import {
  getInterviewOverlayKeyPrefix,
  type VolunteerInterviewOverlayStore,
} from './interview-schedule-overlay-keys'

export type VolunteerInterviewExceptionOverlayBlock = {
  blockId: number
  exceptionDate: unknown
  selectedSlotKeys: unknown
  interviewTime: unknown
  interviewTimeRange: unknown
  timeUnit: unknown
  exclusionState: unknown
  appliedUnavailableDates: unknown
}

export function exceptionBlockKeyPrefix(
  store: VolunteerInterviewOverlayStore,
  namespace: string | undefined,
  blockId: number
): string {
  return `${getInterviewOverlayKeyPrefix(store, namespace)}.exception.${blockId}.`
}

/** overlay에 남아 있는 예외 일정 블록 id. 추가 순서(키 삽입 순서)를 유지한다. */
export function listVolunteerInterviewExceptionBlockIds(
  record: Record<string, unknown>,
  store: VolunteerInterviewOverlayStore,
  namespace?: string
): number[] {
  const prefix = `${getInterviewOverlayKeyPrefix(store, namespace)}.exception.`
  const ids: number[] = []
  const seen = new Set<number>()
  for (const key of Object.keys(record)) {
    if (!key.startsWith(prefix)) continue
    const idPart = key.slice(prefix.length).split('.')[0] ?? ''
    if (!/^\d+$/.test(idPart)) continue
    const id = Number(idPart)
    if (seen.has(id)) continue
    seen.add(id)
    ids.push(id)
  }
  return ids
}

function exceptionOverlayBlockIsFilled(block: VolunteerInterviewExceptionOverlayBlock): boolean {
  if (block.exceptionDate != null && String(block.exceptionDate).trim() !== '') return true
  if (block.interviewTime != null && String(block.interviewTime).trim() !== '') return true
  return Array.isArray(block.selectedSlotKeys) && block.selectedSlotKeys.length > 0
}

/** 저장된 예외 일정만. persistMissing 기본값만 있는 빈 블록은 뺀다. */
export function listFilledVolunteerInterviewExceptionBlockIds(
  record: Record<string, unknown>,
  store: VolunteerInterviewOverlayStore,
  namespace?: string
): number[] {
  return readVolunteerInterviewExceptionOverlayBlocks(record, store, namespace)
    .filter(exceptionOverlayBlockIsFilled)
    .map(block => block.blockId)
}

export function readVolunteerInterviewExceptionOverlayBlocks(
  record: Record<string, unknown>,
  store: VolunteerInterviewOverlayStore,
  namespace?: string
): VolunteerInterviewExceptionOverlayBlock[] {
  return listVolunteerInterviewExceptionBlockIds(record, store, namespace).map(blockId => {
    const prefix = exceptionBlockKeyPrefix(store, namespace, blockId)
    return {
      blockId,
      exceptionDate: record[`${prefix}exceptionDate`],
      selectedSlotKeys: record[`${prefix}selectedSlotKeys`],
      interviewTime: record[`${prefix}interviewTime`],
      interviewTimeRange: record[`${prefix}interviewTimeRange`],
      timeUnit: record[`${prefix}timeUnit`],
      exclusionState: record[`${prefix}exclusionState`],
      appliedUnavailableDates: record[`${prefix}appliedUnavailableDates`],
    }
  })
}

function mintExceptionBlockIds(count: number, existing: number[]): number[] {
  const next = [...existing]
  let stamp = Date.now()
  while (next.length < existing.length + count) {
    while (next.includes(stamp)) stamp += 1
    next.push(stamp)
    stamp += 1
  }
  return next
}

/**
 * 예외 일정 블록 id를 overlay에 이미 있는 id와 맞춘다.
 * 다시 열 때 `Date.now()`로 새 id를 만들면 저장된 값이 빈 블록으로 보인다.
 */
export function reconcileVolunteerInterviewExceptionBlockKeys(args: {
  previous: number[]
  saved: number[]
  count: number
}): number[] {
  const { previous, saved, count } = args
  if (previous.length === 0) {
    if (saved.length === 0) {
      return count > 0 ? mintExceptionBlockIds(count, []) : []
    }
    if (count <= saved.length) return saved
    return mintExceptionBlockIds(count - saved.length, saved)
  }
  if (count < previous.length) {
    const previousMatchesSaved = previous.every(id => saved.includes(id))
    if (previousMatchesSaved) return previous
    return previous.slice(0, count)
  }
  if (count > previous.length) {
    const base = [...previous]
    for (const id of saved) {
      if (!base.includes(id)) base.push(id)
    }
    if (base.length >= count) return base
    return mintExceptionBlockIds(count - base.length, base)
  }
  return previous
}
