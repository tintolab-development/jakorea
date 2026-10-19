import type { SlotRequest } from '@/shared/api/generated/dashboard/schemas/slotRequest'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { parseOrganizationPreferredScheduleId } from '@/features/program/general/lib/organization-application-preferred-education-schedules'
import {
  formatOrganizationPreferredScheduleLabel,
  formatOrganizationScheduleRangeLabel,
} from '@/features/program/general/lib/organization-preferred-schedule-label'
import { organizationScheduleAssignmentsQueryKey } from '@/features/program/general/lib/organization-education-schedule-sources'
import { isProgramScheduleCandidateForNewEducationAssignment } from '@/features/program/shared/lib/program-schedule-canonical'
import {
  PROGRAM_SCHEDULE_ORIGIN_APPLICATION_MATERIALIZED,
  PROGRAM_SCHEDULE_ORIGIN_PROGRAM_DEFINED,
  PROGRAM_SCHEDULE_ORIGIN_UNKNOWN,
  readProgramScheduleOrigin,
} from '@/features/program/shared/lib/program-schedule-origin'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'
import {
  extractApiErrorMessage,
  getApiErrorCode,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'

export type OrganizationApplicationApproveSlot = SlotRequest

export type OrganizationApproveEducationScheduleMode = 'date' | 'period'

/** 날짜 지정은 공통 슬롯 id 확정. 기간 지정은 승인만 하고 OSA에서 배정한다. */
export type OrganizationApproveAssignmentPolicy = 'program_defined_slot' | 'approve_then_osa'

export type OrganizationApproveScheduleAssignmentBlock =
  | 'UNMAPPED'
  | 'AMBIGUOUS'
  | 'NO_PROGRAM_MATCH'
  | 'NOT_IN_PROGRAM_SLOTS'

export type OrganizationApproveScheduleOption = {
  /** 희망 일정 행 키. 양수여도 배정 id가 아닐 수 있다. */
  scheduleId: number
  /** 같은 희망 일정을 구분하는 안정 키 */
  optionKey?: string
  label: string
  /** 승인 `selectedScheduleId`로 보낼 수 있는 education-slots id. 없으면 배정 불가 */
  confirmableScheduleId: number | null
  unresolvedReason?: PreferredEducationSchedule['unresolvedReason']
  /** 신청 원본 희망 일정 */
  preferredRecord?: boolean
  /** education-slots에 명시 매핑된 배정 후보 */
  assignable?: boolean
  sessionNo?: number | null
  round?: number | null
  assignmentNote?: string | null
}

export type OrganizationApproveScheduleValidation = {
  /** 신청 희망 일정 원본. 공통 슬롯으로 대체하지 않는다. */
  options: OrganizationApproveScheduleOption[]
  /** 명시 매핑된 공통 교육 슬롯만. 승인 payload 후보 */
  assignableOptions: OrganizationApproveScheduleOption[]
  /** 프로그램 공통 교육 예정 일정. 표시 전용이며 희망 일정·승인 id가 아니다. */
  commonSlotOptions: OrganizationApproveScheduleOption[]
  invalidReason: string | null
  unresolvedReason: string | null
  duplicateScheduleIds: number[]
  /** education-slots 응답을 받은 뒤인지. 로딩 중에는 불일치로 단정하지 않는다. */
  slotsResolved: boolean
  /** 기간 지정은 공통 예정 슬롯과 비교하지 않고 승인 후 배정한다. */
  assignmentPolicy: OrganizationApproveAssignmentPolicy
}

export type OrganizationApplicationApproveSchedulePayload = {
  selectedScheduleId?: number
  /** 여러 일정 배정. `selectedScheduleId`와 함께 보내지 않는다. */
  slots?: Array<{ scheduleId: number }>
}

export const ORGANIZATION_EDUCATION_MULTIPLE_SCHEDULE_HINT =
  '교육은 여러 개의 일정에 배정할 수 있습니다.'

export const ORGANIZATION_EDUCATION_SINGLE_SCHEDULE_HINT =
  '교육은 한 개의 일정에만 배정할 수 있습니다.'

export type OrganizationEducationScheduleAssignmentLimitInput = {
  sessionRound?: 'single' | 'multi' | null
  educationScheduleMode?: OrganizationApproveEducationScheduleMode | null
  /** 모집 「신청 가능 최대 일정 수」. 기간 지정에서만 배정 개수에 쓴다. */
  maxScheduleCount?: number | null
}

/**
 * 복수 회차는 회차마다 일정이 나뉜다.
 * 기간 지정은 신청 가능 최대 일정 수가 2 이상일 때 여러 일정에 배정한다.
 * 단일 회차 날짜 지정은 선택한 일정 중 1타임만 배정한다.
 */
export function allowsMultipleOrganizationEducationScheduleAssignment(
  input: OrganizationEducationScheduleAssignmentLimitInput
): boolean {
  if (input.sessionRound === 'multi') return true
  if (input.educationScheduleMode === 'period') {
    const max = input.maxScheduleCount
    return typeof max === 'number' && Number.isFinite(max) && max > 1
  }
  return false
}

export function organizationEducationScheduleAssignmentHint(
  input: OrganizationEducationScheduleAssignmentLimitInput
): string {
  return allowsMultipleOrganizationEducationScheduleAssignment(input)
    ? ORGANIZATION_EDUCATION_MULTIPLE_SCHEDULE_HINT
    : ORGANIZATION_EDUCATION_SINGLE_SCHEDULE_HINT
}

const EMPTY_SCHEDULE_VALIDATION: OrganizationApproveScheduleValidation = {
  options: [],
  assignableOptions: [],
  commonSlotOptions: [],
  invalidReason: null,
  unresolvedReason: null,
  duplicateScheduleIds: [],
  slotsResolved: false,
  assignmentPolicy: 'program_defined_slot',
}

const UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE =
  '희망 교육 일정이 없거나 표시할 수 없습니다. 신청 상세의 preferredEducationSchedules를 확인해 주세요.'

export const ORGANIZATION_APPROVE_SCHEDULE_REQUIRED_MESSAGE = '교육 일정을 지정해주세요.'

export const ABSENT_PREFERRED_SCHEDULE_MESSAGE = `신청 희망 교육 일정이 없습니다. ${ORGANIZATION_APPROVE_SCHEDULE_REQUIRED_MESSAGE}`

export const PERIOD_ORGANIZATION_APPROVE_DEFERRED_ASSIGNMENT_MESSAGE = `기간 지정 희망일은 프로그램 공통 예정 슬롯과 매칭하지 않습니다. ${ORGANIZATION_APPROVE_SCHEDULE_REQUIRED_MESSAGE}`

export const ORGANIZATION_APPROVE_MISSING_SCHEDULE_ID_MESSAGE =
  '선택한 희망 교육 일정에 운영 일정 ID(scheduleId)가 없어 승인할 수 없습니다. 신청 상세 API에서 preferredEducationSchedules.scheduleId를 반영해 주세요.'

export const ORGANIZATION_APPROVE_UNRESOLVED_REASON_MESSAGES: Record<
  Exclude<PreferredEducationSchedule['unresolvedReason'], null | undefined>,
  string
> = {
  NO_PROGRAM_DEFINED_SCHEDULE_MATCH: `현재 프로그램 공통 교육 일정과 연결되지 않은 희망 일정입니다. ${ORGANIZATION_APPROVE_SCHEDULE_REQUIRED_MESSAGE}`,
  AMBIGUOUS_SCHEDULE_MATCH:
    '동일한 시간의 공통 교육 일정이 여러 건이어서 자동 연결할 수 없습니다. 관리자에게 일정 정리를 요청해 주세요.',
}

export function getUnresolvedPreferredScheduleMessage(reason: string | null | undefined): string {
  switch (reason?.trim()) {
    case 'AMBIGUOUS_SCHEDULE_MATCH':
      return `희망 교육 일정과 일치하는 운영 일정이 여러 개여서 자동 확정할 수 없습니다. ${ORGANIZATION_APPROVE_SCHEDULE_REQUIRED_MESSAGE}`
    case 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH':
      return `희망 교육 일정과 일치하는 운영 일정이 없어 자동 확정할 수 없습니다. ${ORGANIZATION_APPROVE_SCHEDULE_REQUIRED_MESSAGE}`
    default:
      return UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE
  }
}

function firstUnresolvedPreferredScheduleReason(
  preferred: PreferredEducationSchedule[] | undefined
): string | null {
  for (const schedule of preferred ?? []) {
    if (parseOrganizationPreferredScheduleId(schedule.scheduleId) != null) continue
    if (typeof schedule.unresolvedReason !== 'string') continue
    const reason = schedule.unresolvedReason.trim()
    if (reason) return reason
  }
  return null
}

function parseIsoDateTime(value: unknown): number | null {
  if (typeof value !== 'string') return null
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function formatScheduleLabel(schedule: PreferredEducationSchedule): string {
  return formatOrganizationPreferredScheduleLabel(schedule)
}

function isExplicitProgramEducationSlot(schedule: ProgramScheduleResponse): boolean {
  const origin = readProgramScheduleOrigin(schedule)?.toUpperCase() ?? null
  if (
    origin === PROGRAM_SCHEDULE_ORIGIN_APPLICATION_MATERIALIZED ||
    origin === PROGRAM_SCHEDULE_ORIGIN_UNKNOWN
  ) {
    return false
  }
  if (origin != null && origin !== PROGRAM_SCHEDULE_ORIGIN_PROGRAM_DEFINED) return false
  if (!isProgramScheduleCandidateForNewEducationAssignment(schedule)) return false
  return typeof schedule.id === 'number' && Number.isInteger(schedule.id) && schedule.id > 0
}

function indexExplicitEducationSlots(
  programSchedules: ProgramScheduleResponse[] | undefined
): Map<number, ProgramScheduleResponse> | null {
  if (programSchedules == null) return null
  const slots = new Map<number, ProgramScheduleResponse>()
  for (const schedule of programSchedules) {
    if (!isExplicitProgramEducationSlot(schedule) || schedule.id == null) continue
    slots.set(Math.trunc(schedule.id), schedule)
  }
  return slots
}

function assignmentNoteFor(
  block: OrganizationApproveScheduleAssignmentBlock | null
): string | null {
  switch (block) {
    case 'UNMAPPED':
      return '공통 교육 슬롯과 연결되지 않은 신청 희망 일정입니다.'
    case 'AMBIGUOUS':
      return '같은 조건의 공통 교육 슬롯이 여러 건이어서 자동으로 배정하지 않습니다.'
    case 'NO_PROGRAM_MATCH':
      return '연결된 공통 교육 슬롯이 없습니다.'
    case 'NOT_IN_PROGRAM_SLOTS':
      return '프로그램 공통 교육 슬롯에 없는 일정입니다. 이번 승인에서는 배정하지 않습니다.'
    default:
      return null
  }
}

function formatAssignableEducationSlotLabel(slot: ProgramScheduleResponse): string {
  const sessionNo =
    typeof slot.sessionNo === 'number' && Number.isFinite(slot.sessionNo) && slot.sessionNo > 0
      ? Math.trunc(slot.sessionNo)
      : null
  const when = formatOrganizationScheduleRangeLabel(
    slot.startAt ?? slot.startDate,
    slot.endAt ?? slot.endDate
  )
  const session = sessionNo != null ? `${sessionNo}회차` : ''
  return [session, when].filter(Boolean).join(' · ') || `일정 ${slot.id}`
}

function readPositiveInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  return null
}

function readClockToken(value: string | null | undefined): string | null {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})/)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour === 0 && minute === 0) return null
  return `${hour}:${String(minute).padStart(2, '0')}`
}

/**
 * requested-schedules 행 → 희망 일정 표시.
 * 행 id는 희망 행 식별자이므로 scheduleId로 쓰지 않는다.
 * `resolvedScheduleId`가 양수일 때만 배정 후보 id로 남긴다.
 */
function requestedScheduleToPreferred(
  row: RequestedScheduleResponse
): PreferredEducationSchedule | null {
  const scheduleId = parseOrganizationPreferredScheduleId(row.resolvedScheduleId)
  const explicitLabel = row.label?.trim() || ''
  const requestedDate = row.requestedDate?.trim() || ''
  const periodStart = row.periodStartDate?.trim() || ''
  const periodEnd = row.periodEndDate?.trim() || ''
  const firstTime = row.sessionTimes?.[0]
  const startClock = readClockToken(firstTime?.startTime)
  const endClock = readClockToken(firstTime?.endTime)
  const dateLabel = periodStart
    ? periodEnd && periodEnd !== periodStart
      ? `${periodStart} ~ ${periodEnd}`
      : periodStart
    : requestedDate
  const timeLabel = startClock && endClock ? `${startClock} ~ ${endClock}` : ''
  const rank =
    typeof row.preferenceOrder === 'number' && row.preferenceOrder > 0
      ? `${Math.trunc(row.preferenceOrder)}지망`
      : ''
  const body = explicitLabel || [dateLabel, timeLabel].filter(Boolean).join(' ')
  const label = [rank, body].filter(Boolean).join(' · ')
  if (scheduleId == null && !label) return null
  const round = readPositiveInteger(row.preferenceOrder)
  const startAt = periodStart || requestedDate || undefined
  const endAt = periodEnd || periodStart || requestedDate || undefined
  return {
    ...(scheduleId != null ? { scheduleId } : { scheduleId: null }),
    ...(round != null ? { round } : {}),
    ...(startAt ? { startAt } : {}),
    ...(endAt ? { endAt } : {}),
    ...(label ? { label } : {}),
  }
}

/**
 * 희망 일정 정본.
 * 신청 상세 preferredEducationSchedules가 있으면 그것만 쓴다.
 * 비어 있을 때만 requested-schedules를 표시용으로 읽는다.
 * 공통 education-slots로 희망 일정을 만들지 않는다.
 */
export function selectOrganizationApprovePreferredSchedules(
  preferred: PreferredEducationSchedule[] | undefined,
  requestedSchedules?: readonly RequestedScheduleResponse[] | null
): PreferredEducationSchedule[] {
  if ((preferred?.length ?? 0) > 0) return preferred ?? []
  if (!requestedSchedules?.length) return []
  const sorted = [...requestedSchedules].sort(
    (left, right) => (left.preferenceOrder ?? 99) - (right.preferenceOrder ?? 99)
  )
  return sorted
    .map(requestedScheduleToPreferred)
    .filter((entry): entry is PreferredEducationSchedule => entry != null)
}

function listCommonEducationSlotOptions(
  programSchedules: ProgramScheduleResponse[] | undefined
): OrganizationApproveScheduleOption[] {
  const slots = indexExplicitEducationSlots(programSchedules)
  if (slots == null) return []
  return [...slots.entries()]
    .sort((left, right) => left[0] - right[0])
    .map(([, slot]) => {
      const scheduleId = Math.trunc(slot.id as number)
      const sessionNo =
        typeof slot.sessionNo === 'number' && Number.isFinite(slot.sessionNo)
          ? Math.trunc(slot.sessionNo)
          : null
      return {
        scheduleId,
        optionKey: `common:${scheduleId}`,
        label: formatAssignableEducationSlotLabel(slot),
        confirmableScheduleId: null,
        preferredRecord: false,
        assignable: false,
        sessionNo,
      }
    })
}

/**
 * 일정형·복수 회차 — 교육 진행(일정형) 행사가 education-slots로 내려온 일정.
 * 희망 일정과 섞지 않고, 시작 시각 다음 scheduleId 순으로 전부 배정한다.
 */
export function resolveOrganizationScheduleMultiAutoAssign(
  educationSlots: ProgramScheduleResponse[] | undefined
): {
  items: Array<{ scheduleId: number; label: string }>
  payload: OrganizationApplicationApproveSchedulePayload
} {
  const indexed = indexExplicitEducationSlots(educationSlots)
  if (indexed == null || indexed.size === 0) return { items: [], payload: {} }
  const ordered = [...indexed.values()].sort((left, right) => {
    const leftStart = parseIsoDateTime(left.startAt) ?? Number.POSITIVE_INFINITY
    const rightStart = parseIsoDateTime(right.startAt) ?? Number.POSITIVE_INFINITY
    if (leftStart !== rightStart) return leftStart - rightStart
    return Math.trunc(left.id as number) - Math.trunc(right.id as number)
  })
  const items = ordered.map(slot => {
    const scheduleId = Math.trunc(slot.id as number)
    const when = formatOrganizationScheduleRangeLabel(
      slot.startAt ?? slot.startDate,
      slot.endAt ?? slot.endDate
    )
    return { scheduleId, label: when || `일정 ${scheduleId}` }
  })
  if (items.length === 1) return { items, payload: { selectedScheduleId: items[0]?.scheduleId } }
  return { items, payload: { slots: items.map(item => ({ scheduleId: item.scheduleId })) } }
}

function preferredOptionLabel(
  schedule: PreferredEducationSchedule,
  scheduleId: number | null
): string {
  const label = formatScheduleLabel(schedule)
  if (label) return label
  if (scheduleId != null) return `일정 ${scheduleId}`
  if (schedule.unresolvedReason) return '희망 교육 일정'
  return ''
}

/**
 * 승인 모달 — 희망 일정은 신청 원본으로 두고, 날짜 지정만 education-slots와
 * `preferred.scheduleId`가 명시적으로 같을 때 배정한다.
 * 기간 지정 희망일은 공통 예정 슬롯과 비교하지 않는다. 날짜가 같다고 첫 슬롯을 고르지 않는다.
 * scheduleId가 없다는 이유만으로 일정 자체를 오류로 보지 않는다.
 */
export function resolveOrganizationApproveScheduleOptionsFromPreferred(
  preferred: PreferredEducationSchedule[] | undefined,
  programSchedules?: ProgramScheduleResponse[],
  educationScheduleMode: OrganizationApproveEducationScheduleMode = 'date',
  requestedSchedules?: readonly RequestedScheduleResponse[] | null
): OrganizationApproveScheduleValidation {
  const list = selectOrganizationApprovePreferredSchedules(preferred, requestedSchedules)
  const periodMode = educationScheduleMode === 'period'
  const assignmentPolicy: OrganizationApproveAssignmentPolicy = periodMode
    ? 'approve_then_osa'
    : 'program_defined_slot'
  const slotsResolved = programSchedules != null
  const slotsById = periodMode ? null : indexExplicitEducationSlots(programSchedules)
  const commonSlotOptions = listCommonEducationSlotOptions(programSchedules)
  if (list.length === 0) {
    return {
      ...EMPTY_SCHEDULE_VALIDATION,
      commonSlotOptions,
      invalidReason: ABSENT_PREFERRED_SCHEDULE_MESSAGE,
      slotsResolved,
      assignmentPolicy,
    }
  }

  const options: OrganizationApproveScheduleOption[] = []
  const assignableById = new Map<number, OrganizationApproveScheduleOption>()

  for (let index = 0; index < list.length; index++) {
    const schedule = list[index]
    const scheduleId = parseOrganizationPreferredScheduleId(schedule.scheduleId)
    const label = preferredOptionLabel(schedule, scheduleId)
    if (!label) continue
    const unresolvedReason = schedule.unresolvedReason ?? null
    const round =
      typeof schedule.round === 'number' && Number.isInteger(schedule.round) && schedule.round > 0
        ? schedule.round
        : null

    let confirmableScheduleId: number | null = null
    let block: OrganizationApproveScheduleAssignmentBlock | null = null
    let sessionNo: number | null = null

    if (periodMode || !slotsResolved || slotsById == null) {
      block = null
    } else if (unresolvedReason === 'AMBIGUOUS_SCHEDULE_MATCH') {
      block = 'AMBIGUOUS'
    } else if (unresolvedReason === 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH') {
      block = 'NO_PROGRAM_MATCH'
    } else if (scheduleId == null) {
      block = 'UNMAPPED'
    } else {
      const slot = slotsById.get(scheduleId)
      if (slot == null) {
        block = 'NOT_IN_PROGRAM_SLOTS'
      } else {
        confirmableScheduleId = scheduleId
        sessionNo =
          typeof slot.sessionNo === 'number' && Number.isFinite(slot.sessionNo)
            ? Math.trunc(slot.sessionNo)
            : null
        if (!assignableById.has(scheduleId)) {
          assignableById.set(scheduleId, {
            scheduleId,
            optionKey: `slot:${scheduleId}`,
            label: formatAssignableEducationSlotLabel(slot),
            confirmableScheduleId: scheduleId,
            assignable: true,
            preferredRecord: false,
            sessionNo,
            round,
          })
        }
      }
    }

    options.push({
      scheduleId: scheduleId ?? -(index + 1),
      optionKey: `preferred:${index}`,
      label,
      confirmableScheduleId,
      unresolvedReason,
      preferredRecord: true,
      assignable: confirmableScheduleId != null,
      sessionNo,
      round,
      assignmentNote: periodMode || !slotsResolved ? null : assignmentNoteFor(block),
    })
  }

  const unresolvedReason = periodMode ? null : firstUnresolvedPreferredScheduleReason(list)
  if (options.length === 0) {
    return {
      ...EMPTY_SCHEDULE_VALIDATION,
      commonSlotOptions,
      invalidReason: getUnresolvedPreferredScheduleMessage(unresolvedReason),
      unresolvedReason,
      slotsResolved,
      assignmentPolicy,
    }
  }

  return {
    options,
    assignableOptions: [...assignableById.values()],
    commonSlotOptions,
    invalidReason: null,
    unresolvedReason,
    duplicateScheduleIds: [],
    slotsResolved,
    assignmentPolicy,
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
 * 승인 API 일정 필드.
 * 공통 교육 슬롯에 명시 매핑된 id만 보낸다.
 * 한 건은 `selectedScheduleId`, 여러 건은 `slots`만 보낸다. 둘을 같이 보내면 OSA가 중복될 수 있다.
 */
function uniquePositiveScheduleIds(ids: readonly number[]): number[] {
  const unique: number[] = []
  const seen = new Set<number>()
  for (const raw of ids) {
    if (!Number.isInteger(raw) || raw <= 0) continue
    const id = Math.trunc(raw)
    if (seen.has(id)) continue
    seen.add(id)
    unique.push(id)
  }
  return unique
}

export function buildOrganizationApplicationApproveSchedulePayload(input: {
  preferred: PreferredEducationSchedule[] | undefined
  educationSlots: ProgramScheduleResponse[] | undefined
  selectedSlotId?: number | null
  /** 여러 장 선택. 있으면 `selectedSlotId`보다 우선한다. */
  selectedSlotIds?: readonly number[] | null
  educationScheduleMode?: OrganizationApproveEducationScheduleMode
}): OrganizationApplicationApproveSchedulePayload {
  if (input.educationScheduleMode === 'period') return {}
  const requested =
    input.selectedSlotIds != null
      ? uniquePositiveScheduleIds(input.selectedSlotIds)
      : input.selectedSlotId == null
        ? []
        : uniquePositiveScheduleIds([input.selectedSlotId])
  if (requested.length === 0 || input.educationSlots == null) return {}
  const validation = resolveOrganizationApproveScheduleOptionsFromPreferred(
    input.preferred,
    input.educationSlots,
    input.educationScheduleMode ?? 'date'
  )
  const allowedFromPreferred = requested.filter(slotId =>
    validation.assignableOptions.some(option => option.confirmableScheduleId === slotId)
  )
  const hopeIsEmpty = validation.options.length === 0
  const allowed = hopeIsEmpty
    ? requested.filter(slotId =>
        validation.commonSlotOptions.some(option => option.scheduleId === slotId)
      )
    : allowedFromPreferred
  if (allowed.length === 0) return {}
  if (allowed.length === 1) return { selectedScheduleId: allowed[0] }
  return { slots: allowed.map(scheduleId => ({ scheduleId })) }
}

/** 승인 API `selectedScheduleId` — education-slots에 명시 매핑된 id만. */
export function resolveOrganizationApproveSelectedScheduleId(
  preferred: PreferredEducationSchedule[] | undefined,
  selectedOptionId: number | null | undefined,
  educationSlots?: ProgramScheduleResponse[]
): number | undefined {
  return buildOrganizationApplicationApproveSchedulePayload({
    preferred,
    educationSlots,
    selectedSlotId: selectedOptionId,
  }).selectedScheduleId
}

/** 승인 성공 후 이 신청의 OSA·예정 슬롯만 갱신한다. 다른 기관 키는 포함하지 않는다. */
export function organizationApprovalRefreshTargets(
  programId: string,
  applicationIds: readonly string[]
) {
  const program = programId.trim()
  const ids = applicationIds.map(id => id.trim()).filter(Boolean)
  return {
    educationSlots: generalProgramQueryKeys.educationSlots(program),
    schedules: generalProgramQueryKeys.schedules(program),
    organizationScheduleAssignments: ids.map(id =>
      organizationScheduleAssignmentsQueryKey(program, id)
    ),
    organizationDetails: ids.map(id => generalApplicationsQueryKeys.organizationDetail(id)),
  }
}

export function organizationApproveScheduleOptionLabel(
  scheduleOptions: OrganizationApproveScheduleOption[],
  selectedOptionId: number | null | undefined
): string | null {
  if (selectedOptionId == null) return null
  return scheduleOptions.find(option => option.scheduleId === selectedOptionId)?.label ?? null
}

export function organizationApproveUnconfirmableScheduleNotice(
  scheduleOptions: OrganizationApproveScheduleOption[]
): string | null {
  const unresolvedReasons = scheduleOptions
    .map(option => option.unresolvedReason)
    .filter(
      (
        reason
      ): reason is Exclude<PreferredEducationSchedule['unresolvedReason'], null | undefined> =>
        reason === 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH' || reason === 'AMBIGUOUS_SCHEDULE_MATCH'
    )

  if (unresolvedReasons.includes('AMBIGUOUS_SCHEDULE_MATCH')) {
    return ORGANIZATION_APPROVE_UNRESOLVED_REASON_MESSAGES.AMBIGUOUS_SCHEDULE_MATCH
  }
  if (unresolvedReasons.includes('NO_PROGRAM_DEFINED_SCHEDULE_MATCH')) {
    return ORGANIZATION_APPROVE_UNRESOLVED_REASON_MESSAGES.NO_PROGRAM_DEFINED_SCHEDULE_MATCH
  }
  return null
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
      ...EMPTY_SCHEDULE_VALIDATION,
      invalidReason: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
      slotsResolved: true,
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
        ...EMPTY_SCHEDULE_VALIDATION,
        invalidReason: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
        slotsResolved: true,
      }
    }

    const numericScheduleId = scheduleId as number
    const rangeKey = `${startAt}:${endAt}`
    const previousRange = preferredRangeById.get(numericScheduleId)
    if (previousRange && previousRange !== rangeKey) {
      duplicateScheduleIds.add(numericScheduleId)
      return {
        ...EMPTY_SCHEDULE_VALIDATION,
        invalidReason: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
        duplicateScheduleIds: [...duplicateScheduleIds],
        slotsResolved: true,
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
        ...EMPTY_SCHEDULE_VALIDATION,
        invalidReason: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
        slotsResolved: true,
      }
    }

    options.push({
      scheduleId: numericScheduleId,
      label: formatScheduleLabel(schedule) || `일정 ${numericScheduleId}`,
      confirmableScheduleId: numericScheduleId,
    })
  }

  return options.length > 0
    ? {
        options,
        assignableOptions: options.filter(option => option.confirmableScheduleId != null),
        commonSlotOptions: [],
        invalidReason: null,
        unresolvedReason: null,
        duplicateScheduleIds: [],
        slotsResolved: true,
        assignmentPolicy: 'program_defined_slot',
      }
    : {
        ...EMPTY_SCHEDULE_VALIDATION,
        invalidReason: UNRESOLVED_PREFERRED_SCHEDULE_MESSAGE,
        slotsResolved: true,
        assignmentPolicy: 'program_defined_slot',
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
  ORGANIZATION_APPROVE_PREFERRED_SCHEDULE_REQUIRED:
    ORGANIZATION_APPROVE_MISSING_SCHEDULE_ID_MESSAGE,
  ORGANIZATION_APPROVE_SCHEDULE_NOT_REQUESTED:
    '신청자가 희망하지 않은 교육 일정입니다. 희망 일정을 다시 확인해 주세요.',
  GENERAL_ORGANIZATION_ASSIGNMENT_SCHEDULE_INVALID:
    '유효하지 않거나 취소된 교육 일정입니다. 목록을 새로고침한 후 다시 선택해 주세요.',
  GENERAL_ORGANIZATION_ASSIGNMENT_SLOT_DUPLICATED: '동일한 교육 일정이 중복되었습니다.',
  GENERAL_ORGANIZATION_ASSIGNMENT_SLOT_INVALID: '유효한 교육 일정 ID(scheduleId)를 선택해 주세요.',
  PROGRAM_SCHEDULE_NOT_EDUCATION_SLOT:
    '교육 일정이 아닌 유형입니다. 교육 회차 일정을 선택해 주세요.',
  GENERAL_ORGANIZATION_HISTORICAL_ASSIGNMENT_IMMUTABLE:
    '이미 시작되었거나 출석 이력이 있는 일정은 변경할 수 없습니다.',
  GENERAL_ORGANIZATION_APPLICATION_NOT_APPROVED:
    '승인된 기관 신청에만 교육 일정을 배정할 수 있습니다.',
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
