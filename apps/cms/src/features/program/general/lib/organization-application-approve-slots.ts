import type { SlotRequest } from '@/shared/api/generated/dashboard/schemas/slotRequest'
import { mapPreferredEducationSchedulesToSessions } from '@/features/program/general/api/adapters/general-applications-adapters'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import type { GeneralProgramSessionRoundKind } from '@/types/domain'
import {
  extractApiErrorMessage,
  getApiErrorCode,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'

export type OrganizationApplicationApproveSlot = SlotRequest

export type OrganizationApproveScheduleOption = {
  scheduleId: number
  label: string
}

const UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE =
  '교육 일정이 아직 확정 가능한 일정으로 생성되지 않았습니다. 프로그램 일정을 확인한 후 다시 시도해 주세요.'

export function listOrganizationApproveScheduleOptions(
  preferred: PreferredEducationSchedule[] | undefined
): OrganizationApproveScheduleOption[] {
  const sessions = mapPreferredEducationSchedulesToSessions(preferred)
  const seen = new Set<number>()
  const options: OrganizationApproveScheduleOption[] = []
  for (const session of sessions) {
    const scheduleId = session.resolvedScheduleId
    if (scheduleId == null || !Number.isFinite(scheduleId) || scheduleId <= 0) continue
    if (seen.has(scheduleId)) continue
    seen.add(scheduleId)
    const dateLabel = [session.date, session.dayOfWeek !== '-' ? `(${session.dayOfWeek})` : '']
      .filter(Boolean)
      .join('')
    const timeLabel = session.timeRange !== '-' ? ` ${session.timeRange}` : ''
    options.push({
      scheduleId,
      label: `${dateLabel}${timeLabel}`.trim() || `일정 ${scheduleId}`,
    })
  }
  return options
}

export function hasUnresolvedOrganizationApprovePreferredSchedules(
  preferred: PreferredEducationSchedule[] | undefined
): boolean {
  const list = preferred ?? []
  if (list.length === 0) return true
  const options = listOrganizationApproveScheduleOptions(preferred)
  if (options.length > 0) return false
  return list.some(
    entry =>
      (entry.scheduleId == null || entry.scheduleId <= 0) &&
      Boolean(entry.label?.trim() || entry.startAt?.trim())
  )
}

export function buildOrganizationApproveSlotsForSelection(input: {
  sessionRound: GeneralProgramSessionRoundKind
  selectedScheduleIds: number[]
  educationGrade: string
  classCount: number
}): OrganizationApplicationApproveSlot[] {
  const grade = input.educationGrade.trim()
  const distinctIds = [...new Set(input.selectedScheduleIds.filter(id => Number.isFinite(id) && id > 0))]
  const classTotal = Math.max(1, input.classCount || 1)

  if (input.sessionRound === 'single') {
    const scheduleId = distinctIds[0]
    if (scheduleId == null) return []
    return Array.from({ length: classTotal }, (_, index) => ({
      scheduleId,
      grade,
      className: `${index + 1}반`,
    }))
  }

  return distinctIds.map(scheduleId => ({
    scheduleId,
    grade,
    className: '1반',
  }))
}

export function validateOrganizationApproveSlotsClient(input: {
  sessionRound: GeneralProgramSessionRoundKind
  slots: OrganizationApplicationApproveSlot[]
  allowedScheduleIds: number[]
}): string | null {
  if (input.slots.length === 0) {
    return '교육 일정·학급을 선택해 주세요.'
  }
  if (!input.slots.every(slot => slot.grade.trim() && slot.className.trim())) {
    return '학년·학급 정보를 확인해 주세요.'
  }
  const allowed = new Set(input.allowedScheduleIds)
  if (input.slots.some(slot => !allowed.has(slot.scheduleId))) {
    return '선택한 일정이 희망 교육 일정과 일치하지 않습니다. 목록을 새로고침한 후 다시 선택해 주세요.'
  }

  const distinctScheduleIds = new Set(input.slots.map(slot => slot.scheduleId))
  if (input.sessionRound === 'single') {
    if (distinctScheduleIds.size !== 1) {
      return '단일 회차 프로그램은 하나의 교육 일정만 선택할 수 있습니다.'
    }
    return null
  }
  if (distinctScheduleIds.size < 1) {
    return '복수 회차 프로그램은 하나 이상의 교육 일정을 선택해 주세요.'
  }
  return null
}

const ORGANIZATION_APPROVE_ERROR_FALLBACKS: Record<string, string> = {
  ORGANIZATION_APPROVE_SLOTS_REQUIRED: '승인하려면 교육 일정·학급 배정이 필요합니다.',
  ORGANIZATION_APPROVE_SLOT_COUNT_INVALID:
    '선택한 교육 일정 수가 프로그램 회차 유형과 맞지 않습니다.',
  ORGANIZATION_APPROVE_PREFERRED_SCHEDULE_REQUIRED: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
  ORGANIZATION_APPROVE_SCHEDULE_NOT_REQUESTED:
    '신청자가 희망하지 않은 교육 일정입니다. 희망 일정을 다시 확인해 주세요.',
  GENERAL_ORGANIZATION_ASSIGNMENT_SCHEDULE_INVALID:
    '유효하지 않거나 취소된 교육 일정입니다. 목록을 새로고침한 후 다시 선택해 주세요.',
  GENERAL_ORGANIZATION_ASSIGNMENT_SLOT_DUPLICATED:
    '동일한 일정·학년·학급이 중복되었습니다.',
  GENERAL_ORGANIZATION_ASSIGNMENT_EXCEEDS_REQUESTED_CLASS_COUNT:
    '신청 학급 수를 초과하는 배정입니다.',
  GENERAL_ORGANIZATION_HISTORICAL_ASSIGNMENT_IMMUTABLE:
    '이미 시작되었거나 출석 이력이 있는 일정은 변경할 수 없습니다.',
}

export function formatOrganizationApplicationApproveErrorMessage(error: unknown): string | null {
  const code = getApiErrorCode(error)
  if (!code || !(code in ORGANIZATION_APPROVE_ERROR_FALLBACKS)) {
    return null
  }
  const data =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined
  const message = extractApiErrorMessage(data, {
    httpStatus: getApiErrorHttpStatus(error),
    fallback: ORGANIZATION_APPROVE_ERROR_FALLBACKS[code] ?? '',
  }).trim()
  return message || ORGANIZATION_APPROVE_ERROR_FALLBACKS[code] || null
}

export { UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE }
