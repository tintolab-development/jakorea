import type { EducationUjatTemporarySchedule } from '../model/types'

export type UjatAcknowledgedSchedule = {
  applicationId: string
  assignmentRevision: number
}

export const UJAT_ACKNOWLEDGED_SCHEDULE_STATE_KEY = 'ujatAcknowledgedSchedule'

export const UJAT_SCHEDULE_RECONFIRM_REQUIRED_MESSAGE =
  '관리자 배정 일정을 1단계에서 확인한 후 안내사항을 제출할 수 있습니다. 교육 진행 정보 확인 화면으로 돌아가 일정을 다시 확인해 주세요.'

export function isPositiveIntegerRevision(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

export function readUjatAcknowledgedScheduleFromLocationState(
  state: unknown,
): UjatAcknowledgedSchedule | null {
  if (!state || typeof state !== 'object') return null
  const record = state as Record<string, unknown>
  const raw =
    record[UJAT_ACKNOWLEDGED_SCHEDULE_STATE_KEY] ?? record.ujatAcknowledgedSchedule
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const applicationId =
    typeof item.applicationId === 'string' ? item.applicationId.trim() : ''
  const assignmentRevision = item.assignmentRevision
  if (!applicationId || !isPositiveIntegerRevision(assignmentRevision)) return null
  return { applicationId, assignmentRevision }
}

export function isValidUjatAcknowledgedScheduleForApplication(
  acknowledged: UjatAcknowledgedSchedule | null | undefined,
  applicationId: string,
): boolean {
  if (!acknowledged) return false
  return (
    acknowledged.applicationId === applicationId &&
    isPositiveIntegerRevision(acknowledged.assignmentRevision)
  )
}

export function buildUjatAcknowledgedScheduleNavigateState(
  schedule: UjatAcknowledgedSchedule,
): Record<string, UjatAcknowledgedSchedule> {
  return { [UJAT_ACKNOWLEDGED_SCHEDULE_STATE_KEY]: schedule }
}

/**
 * 1→2단계 이동·confirm 전 revision 유효성.
 * 배정 일정 카드 UI는 노출하지 않으므로 slots 유무는 보지 않는다.
 */
export function canAcknowledgeDisplayedUjatSchedule(input: {
  assignmentRevision: number | undefined
  temporarySchedule?: EducationUjatTemporarySchedule
}): boolean {
  void input.temporarySchedule
  return isPositiveIntegerRevision(input.assignmentRevision)
}

export function hasUjatScheduleRevisionDrift(
  acknowledged: UjatAcknowledgedSchedule | null | undefined,
  serverAssignmentRevision: number | undefined,
): boolean {
  if (!acknowledged || !isPositiveIntegerRevision(serverAssignmentRevision)) return false
  return serverAssignmentRevision !== acknowledged.assignmentRevision
}
