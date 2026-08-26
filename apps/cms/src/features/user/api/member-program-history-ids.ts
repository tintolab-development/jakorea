import type { Application, UserHistory } from '@/types/domain'

export type MemberProgramHistoryRowKind = 'application' | 'participant' | 'programHistory'

export function parseMemberProgramHistoryRowId(
  rowId: string
): { kind: MemberProgramHistoryRowKind; numericId: number } | null {
  const trimmed = rowId.trim()
  const match = /^(app|part|ph)-(\d+)$/.exec(trimmed)
  if (!match) return null
  const numericId = Number(match[2])
  if (!Number.isFinite(numericId)) return null
  const prefix = match[1]
  if (prefix === 'app') return { kind: 'application', numericId }
  if (prefix === 'part') return { kind: 'participant', numericId }
  return { kind: 'programHistory', numericId }
}

export function resolveMemberApplicationIdFromApplication(record: Application): number | undefined {
  const fromCustom = record.customFields?.memberApplicationId
  if (typeof fromCustom === 'number' && Number.isFinite(fromCustom)) return fromCustom
  const parsed = parseMemberProgramHistoryRowId(record.id)
  return parsed?.kind === 'application' ? parsed.numericId : undefined
}

export function resolveParticipantIdFromHistoryRow(
  record: Application | UserHistory
): number | undefined {
  if ('customFields' in record && record.customFields) {
    const fromCustom = record.customFields.participantId
    if (typeof fromCustom === 'number' && Number.isFinite(fromCustom)) return fromCustom
  }
  const parsed = parseMemberProgramHistoryRowId(record.id)
  if (parsed?.kind === 'participant' || parsed?.kind === 'programHistory') {
    return parsed.numericId
  }
  return undefined
}

export function collectParticipantIdsFromHistoryRowIds(rowIds: readonly string[]): number[] {
  const ids = new Set<number>()
  for (const rowId of rowIds) {
    const parsed = parseMemberProgramHistoryRowId(rowId)
    if (parsed?.kind === 'participant' || parsed?.kind === 'programHistory') {
      ids.add(parsed.numericId)
    }
  }
  return [...ids]
}
