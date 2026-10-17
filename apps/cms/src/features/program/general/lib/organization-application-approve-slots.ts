import type { SlotRequest } from '@/shared/api/generated/dashboard/schemas/slotRequest'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import { parseOrganizationPreferredScheduleId } from '@/features/program/general/lib/organization-application-preferred-education-schedules'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import {
  extractApiErrorMessage,
  getApiErrorCode,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'

export type OrganizationApplicationApproveSlot = SlotRequest

export type OrganizationApproveScheduleOption = {
  /** UI 선택 키. 양수 = materialized `program_schedule.id`, 음수 = `line:N` placeholder */
  scheduleId: number
  label: string
  /** 승인 `selectedScheduleId`로 보낼 수 있는 id. 없으면 칩 비활성 */
  confirmableScheduleId: number | null
}

export type OrganizationApproveScheduleValidation = {
  options: OrganizationApproveScheduleOption[]
  invalidReason: string | null
  duplicateScheduleIds: number[]
}

const UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE =
  '희망 교육 일정이 없거나 표시할 수 없습니다. 신청 상세의 preferredEducationSchedules를 확인해 주세요.'

export const ORGANIZATION_APPROVE_MISSING_SCHEDULE_ID_MESSAGE =
  '선택한 희망 교육 일정에 운영 일정 ID(scheduleId)가 없어 승인할 수 없습니다. 신청 상세 API에서 preferredEducationSchedules.scheduleId를 반영해 주세요.'

function parseIsoDateTime(value: unknown): number | null {
  if (typeof value !== 'string') return null
  // Date.parse alone accepts non-ISO formats. The API contract requires a datetime string.
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatScheduleLabel(schedule: PreferredEducationSchedule): string {
  const label = typeof schedule.label === 'string' ? schedule.label.trim() : ''
  if (label) return label
  const start = parseIsoDateTime(schedule.startAt)
  const end = parseIsoDateTime(schedule.endAt)
  if (start == null || end == null) return ''
  const startDate = new Date(start)
  const endDate = new Date(end)
  return `${startDate.toLocaleDateString('ko-KR')} ${startDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })} ~ ${endDate.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })}`
}

/**
 * 승인 모달 선택지 — 해당 신청의 `preferredEducationSchedules`만 노출한다.
 * 프로그램 schedules GET·시각 교차 검증은 하지 않는다.
 */
export function resolveOrganizationApproveScheduleOptionsFromPreferred(
  preferred: PreferredEducationSchedule[] | undefined
): OrganizationApproveScheduleValidation {
  const list = preferred ?? []
  if (list.length === 0) {
    return {
      options: [],
      invalidReason: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
      duplicateScheduleIds: [],
    }
  }

  const options: OrganizationApproveScheduleOption[] = []
  const seenPositiveIds = new Set<number>()

  for (let index = 0; index < list.length; index++) {
    const schedule = list[index]
    const label =
      (typeof schedule.label === 'string' ? schedule.label.trim() : '') ||
      formatScheduleLabel(schedule)
    const scheduleId = parseOrganizationPreferredScheduleId(schedule.scheduleId)

    if (scheduleId != null) {
      if (seenPositiveIds.has(scheduleId)) continue
      seenPositiveIds.add(scheduleId)
      options.push({
        scheduleId,
        label: label || `일정 ${scheduleId}`,
        confirmableScheduleId: scheduleId,
      })
      continue
    }

    if (!label) continue
    options.push({
      scheduleId: -(index + 1),
      label,
      confirmableScheduleId: null,
    })
  }

  return options.length > 0
    ? { options, invalidReason: null, duplicateScheduleIds: [] }
    : {
        options: [],
        invalidReason: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
        duplicateScheduleIds: [],
      }
}

/** 승인 API용 scheduleId — UI placeholder(음수)는 preferred 항목의 scheduleId로만 해석한다. */
export function resolveOrganizationApproveScheduleIdsFromSelection(
  preferred: PreferredEducationSchedule[] | undefined,
  selectedOptionIds: readonly number[]
): number[] {
  const list = preferred ?? []
  const resolved: number[] = []
  for (const optionId of selectedOptionIds) {
    if (Number.isInteger(optionId) && optionId > 0) {
      resolved.push(optionId)
      continue
    }
    if (!Number.isInteger(optionId) || optionId >= 0) continue
    const entry = list[-optionId - 1]
    const scheduleId = parseOrganizationPreferredScheduleId(entry?.scheduleId)
    if (scheduleId != null) {
      resolved.push(scheduleId)
    }
  }
  return resolved
}

/** 승인 API `selectedScheduleId` — 선택한 칩 1건의 materialized id (없으면 undefined). */
export function resolveOrganizationApproveSelectedScheduleId(
  preferred: PreferredEducationSchedule[] | undefined,
  selectedOptionId: number | null | undefined
): number | undefined {
  if (selectedOptionId == null) return undefined
  const [resolved] = resolveOrganizationApproveScheduleIdsFromSelection(preferred, [
    selectedOptionId,
  ])
  return resolved
}

export function organizationApproveScheduleOptionLabel(
  scheduleOptions: OrganizationApproveScheduleOption[],
  selectedOptionId: number | null | undefined
): string | null {
  if (selectedOptionId == null) return null
  return scheduleOptions.find(option => option.scheduleId === selectedOptionId)?.label ?? null
}

/**
 * @deprecated 승인 모달은 {@link resolveOrganizationApproveScheduleOptionsFromPreferred} 사용.
 * program_schedule 교차 검증이 필요한 레거시·테스트용.
 */
export function validateOrganizationApproveScheduleOptions(
  preferred: PreferredEducationSchedule[] | undefined,
  programSchedules: ProgramScheduleResponse[] | undefined
): OrganizationApproveScheduleValidation {
  const list = preferred ?? []
  if (list.length === 0) {
    return {
      options: [],
      invalidReason: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
      duplicateScheduleIds: [],
    }
  }

  const schedulesById = new Map<number, { startAt: number; endAt: number }>()
  for (const schedule of programSchedules ?? []) {
    const id = schedule.id
    const startAt = parseIsoDateTime(schedule.startAt)
    const endAt = parseIsoDateTime(schedule.endAt)
    if (
      !Number.isInteger(id) ||
      (id ?? 0) <= 0 ||
      startAt == null ||
      endAt == null ||
      startAt >= endAt
    ) {
      continue
    }
    schedulesById.set(id as number, { startAt, endAt })
  }

  const options: OrganizationApproveScheduleOption[] = []
  const preferredRangeById = new Map<number, string>()
  const duplicateScheduleIds = new Set<number>()

  for (const schedule of list) {
    const scheduleId = (schedule as { scheduleId?: unknown }).scheduleId
    const startAt = parseIsoDateTime(schedule.startAt)
    const endAt = parseIsoDateTime(schedule.endAt)
    if (
      !Number.isInteger(scheduleId) ||
      (scheduleId as number) <= 0 ||
      startAt == null ||
      endAt == null ||
      startAt >= endAt
    ) {
      return {
        options: [],
        invalidReason: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
        duplicateScheduleIds: [],
      }
    }

    const numericScheduleId = scheduleId as number
    const rangeKey = `${startAt}:${endAt}`
    const previousRange = preferredRangeById.get(numericScheduleId)
    if (previousRange && previousRange !== rangeKey) {
      duplicateScheduleIds.add(numericScheduleId)
      return {
        options: [],
        invalidReason: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
        duplicateScheduleIds: [...duplicateScheduleIds],
      }
    }
    if (previousRange) continue
    preferredRangeById.set(numericScheduleId, rangeKey)

    const programSchedule = schedulesById.get(numericScheduleId)
    if (
      !programSchedule ||
      programSchedule.startAt !== startAt ||
      programSchedule.endAt !== endAt
    ) {
      return {
        options: [],
        invalidReason: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
        duplicateScheduleIds: [],
      }
    }

    options.push({
      scheduleId: numericScheduleId,
      label: formatScheduleLabel(schedule) || `일정 ${numericScheduleId}`,
      confirmableScheduleId: numericScheduleId,
    })
  }

  return options.length > 0
    ? { options, invalidReason: null, duplicateScheduleIds: [] }
    : {
        options: [],
        invalidReason: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
        duplicateScheduleIds: [],
      }
}

export function listOrganizationApproveScheduleOptions(
  preferred: PreferredEducationSchedule[] | undefined
): OrganizationApproveScheduleOption[] {
  return resolveOrganizationApproveScheduleOptionsFromPreferred(preferred).options
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

const ORGANIZATION_APPROVE_ERROR_FALLBACKS: Record<string, string> = {
  ORGANIZATION_APPROVE_PREFERRED_SCHEDULE_REQUIRED: ORGANIZATION_APPROVE_MISSING_SCHEDULE_ID_MESSAGE,
  ORGANIZATION_APPROVE_SCHEDULE_NOT_REQUESTED:
    '신청자가 희망하지 않은 교육 일정입니다. 희망 일정을 다시 확인해 주세요.',
  GENERAL_ORGANIZATION_ASSIGNMENT_SCHEDULE_INVALID:
    '유효하지 않거나 취소된 교육 일정입니다. 목록을 새로고침한 후 다시 선택해 주세요.',
  GENERAL_ORGANIZATION_ASSIGNMENT_SLOT_DUPLICATED: '동일한 일정·학년·학급이 중복되었습니다.',
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
