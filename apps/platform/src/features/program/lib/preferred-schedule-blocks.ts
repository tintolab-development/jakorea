/**
 * Platform 희망 일정 UI ↔ Portal preferredScheduleBlocks / answers
 */

import type { ApplyPreferredScheduleBlock } from '../ui/apply-preferred-schedule/apply-preferred-schedule'
import type { PortalPreferredScheduleBlock } from '../api/application-types'

export function toPortalPreferredScheduleBlocks(
  blocks: readonly ApplyPreferredScheduleBlock[],
): PortalPreferredScheduleBlock[] {
  const out: PortalPreferredScheduleBlock[] = []
  let rank = 1
  for (const block of blocks) {
    const date = block.date.trim()
    if (!date) continue
    const classPeriod = block.classPeriod.trim()
    const startTime = block.startTime.trim()
    const endTime = block.endTime.trim()
    out.push({
      preferenceRank: rank,
      date,
      sessionCount: 1,
      sessionTimes: [
        {
          sessionIndex: 1,
          classPeriod: classPeriod || undefined,
          startTime: startTime || undefined,
          endTime: endTime || undefined,
          timeRange: startTime && endTime ? `${startTime}~${endTime}` : undefined,
        },
      ],
    })
    rank += 1
  }
  return out
}

/**
 * Submit answers 의 preferred-schedule 키용.
 * 빈 배열은 BE 필수값 누락으로 거절되므로, 블록이 있을 때만 반환한다.
 */
export function toPreferredScheduleAnswerValue(
  blocks: readonly ApplyPreferredScheduleBlock[],
): PortalPreferredScheduleBlock[] | null {
  const mapped = toPortalPreferredScheduleBlocks(blocks)
  return mapped.length > 0 ? mapped : null
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
      classPeriod: typeof first?.classPeriod === 'string' ? first.classPeriod : '',
      startTime:
        typeof first?.startTime === 'string'
          ? first.startTime
          : typeof first?.start === 'string'
            ? first.start
            : '',
      endTime:
        typeof first?.endTime === 'string'
          ? first.endTime
          : typeof first?.end === 'string'
            ? first.end
            : '',
    })
  }
  return blocks.length > 0 ? blocks : null
}
