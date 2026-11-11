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

/**
 * 선택한 행 ID로 증명서 발급 대상 participantId를 모은다.
 * 신청 이력 행(`app-`)은 응답의 participantId(customFields)를 쓰고, 없으면(null) 제외한다. 중복은 1번만.
 */
export function collectParticipantIdsFromHistoryRows(
  rowIds: readonly string[],
  rows: readonly (Application | UserHistory)[]
): number[] {
  const rowById = new Map(rows.map(row => [row.id, row]))
  const ids = new Set<number>()
  for (const rowId of rowIds) {
    const row = rowById.get(rowId)
    const participantId = row
      ? resolveParticipantIdFromHistoryRow(row)
      : collectParticipantIdsFromHistoryRowIds([rowId])[0]
    if (participantId != null) ids.add(participantId)
  }
  return [...ids]
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
