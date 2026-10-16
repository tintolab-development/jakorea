import type { SlotRequest } from '@/shared/api/generated/dashboard/schemas/slotRequest'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import { parseOrganizationPreferredScheduleId } from '@/features/program/general/lib/organization-application-preferred-education-schedules'
import type { GeneralProgramSessionRoundKind } from '@/types/domain'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
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

export type OrganizationApproveScheduleValidation = {
  options: OrganizationApproveScheduleOption[]
  invalidReason: string | null
  duplicateScheduleIds: number[]
}

const UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE =
  '희망 교육 일정이 없거나 표시할 수 없습니다. 신청 상세의 preferredEducationSchedules를 확인해 주세요.'

export const ORGANIZATION_APPROVE_MISSING_SCHEDULE_ID_MESSAGE =
  '선택한 희망 교육 일정에 운영 일정 ID(scheduleId)가 없어 승인할 수 없습니다. 신청 상세 API에서 preferredEducationSchedules.scheduleId를 반영해 주세요.'

export type OrganizationApproveAssignedPreviewRow = {
  label: string
  grade: string
  className: string
}

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
      })
      continue
    }

    if (!label) continue
    options.push({ scheduleId: -(index + 1), label })
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

/** 승인 API용 scheduleId 없이도 UI 「배정된 일정」 미리보기를 그린다. */
export function buildOrganizationApproveAssignedPreview(input: {
  sessionRound: GeneralProgramSessionRoundKind
  selectedOptionIds: readonly number[]
  scheduleOptions: OrganizationApproveScheduleOption[]
  educationGrade: string
  classCount: number
}): OrganizationApproveAssignedPreviewRow[] {
  const grade = input.educationGrade.trim()
  const classTotal = Math.max(1, input.classCount || 1)
  const optionsById = new Map(input.scheduleOptions.map(option => [option.scheduleId, option]))
  const distinctSelected = [...new Set(input.selectedOptionIds)]
  if (distinctSelected.length === 0) return []

  if (input.sessionRound === 'single') {
    const optionId = distinctSelected[0]
    const label = optionsById.get(optionId)?.label?.trim() ?? ''
    if (!label) return []
    return Array.from({ length: classTotal }, (_, index) => ({
      label,
      grade,
      className: `${index + 1}반`,
    }))
  }

  const rows: OrganizationApproveAssignedPreviewRow[] = []
  for (const optionId of distinctSelected) {
    const label = optionsById.get(optionId)?.label?.trim() ?? ''
    if (!label) continue
    rows.push({ label, grade, className: '1반' })
  }
  return rows
}

export function buildOrganizationApproveSlotsForSelection(input: {
  sessionRound: GeneralProgramSessionRoundKind
  selectedScheduleIds: number[]
  educationGrade: string
  classCount: number
}): OrganizationApplicationApproveSlot[] {
  const grade = input.educationGrade.trim()
  const distinctIds = [
    ...new Set(input.selectedScheduleIds.filter(id => Number.isFinite(id) && id > 0)),
  ]
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
  if (!input.slots.every(slot => Number.isInteger(slot.scheduleId) && slot.scheduleId > 0)) {
    return ORGANIZATION_APPROVE_MISSING_SCHEDULE_ID_MESSAGE
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
  }
  if (distinctScheduleIds.size < 1) {
    return '복수 회차 프로그램은 하나 이상의 교육 일정을 선택해 주세요.'
  }
  const classKeys = new Set<string>()
  for (const slot of input.slots) {
    const key = `${slot.grade.trim()}\u0000${slot.className.trim()}`
    if (classKeys.has(key)) return '동일한 학년·학급을 중복 배정할 수 없습니다.'
    classKeys.add(key)
  }
  return null
}

const ORGANIZATION_APPROVE_ERROR_FALLBACKS: Record<string, string> = {
  ORGANIZATION_APPROVE_SLOTS_REQUIRED: '승인하려면 교육 일정·학급 배정이 필요합니다.',
  ORGANIZATION_APPROVE_SLOT_COUNT_INVALID:
    '선택한 교육 일정 수가 프로그램 회차 유형과 맞지 않습니다.',
  ORGANIZATION_APPROVE_PREFERRED_SCHEDULE_REQUIRED: ORGANIZATION_APPROVE_MISSING_SCHEDULE_ID_MESSAGE,
  ORGANIZATION_APPROVE_SCHEDULE_NOT_REQUESTED:
    '신청자가 희망하지 않은 교육 일정입니다. 희망 일정을 다시 확인해 주세요.',
  GENERAL_ORGANIZATION_ASSIGNMENT_SCHEDULE_INVALID:
    '유효하지 않거나 취소된 교육 일정입니다. 목록을 새로고침한 후 다시 선택해 주세요.',
  GENERAL_ORGANIZATION_ASSIGNMENT_SLOT_DUPLICATED: '동일한 일정·학년·학급이 중복되었습니다.',
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
