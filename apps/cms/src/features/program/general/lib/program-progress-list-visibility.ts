import type { ParticipantListItemResponse } from '@/shared/api/generated/dashboard/schemas/participantListItemResponse'

/** GET /participants additive — 승인 취소 후 신청이 REJECTED여도 participant 행이 남을 수 있다. */
export type ProgramProgressParticipantListItem = ParticipantListItemResponse & {
  applicationStatus?: string | null
}

const HIDDEN_APPLICATION_STATUSES = new Set(['REJECTED', 'AUTO_REJECTED'])

export function isHiddenFromProgramProgressList(
  item: ProgramProgressParticipantListItem
): boolean {
  const status = item.applicationStatus?.trim().toUpperCase()
  return status != null && HIDDEN_APPLICATION_STATUSES.has(status)
}

export function filterProgramProgressParticipantItems<T extends ProgramProgressParticipantListItem>(
  items: T[]
): T[] {
  return items.filter(item => !isHiddenFromProgramProgressList(item))
}
