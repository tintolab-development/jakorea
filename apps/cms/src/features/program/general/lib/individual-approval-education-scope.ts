/**
 * GENERAL_INDIVIDUAL 승인·재배정 — 신청 희망 일정과 프로그램 정의 교육 슬롯을 분리한다.
 * scheduleId는 education-slots의 양의 정수만 사용한다.
 */

import type { QueryClient } from '@tanstack/react-query'
import { PRE_EDUCATION_DISPLAY_LABEL } from '@/features/program/general/lib/schedule-detail-form'
import type { ProgramEducationSlotResponse } from '@/shared/api/generated/dashboard/schemas/programEducationSlotResponse'
import type { IndividualApprovalWithScopeBulkTarget } from '@/shared/api/generated/dashboard/schemas/individualApprovalWithScopeBulkTarget'
import type { IndividualApprovalWithScopeRequest } from '@/shared/api/generated/dashboard/schemas/individualApprovalWithScopeRequest'
import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import {
  formatCmsScheduleDisplayLabel,
  formatOrganizationScheduleRangeLabel,
} from '@/features/program/general/lib/organization-preferred-schedule-label'
import {
  generalApplicationsQueryKeys,
  generalProgramProgressQueryKeys,
} from '@/features/program/general/api/general-applications-query-keys'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { isProgramSchedulePreEducation } from '@/features/program/shared/lib/program-schedule-canonical'
import {
  extractApiErrorDetails,
  extractApiErrorMessage,
  getApiErrorCode,
  getApiErrorHttpStatus,
} from '@/shared/lib/extract-api-error-message'
import { getNotificationTimingApiErrorMessage } from '@/shared/lib/notification-schedule'

export const INDIVIDUAL_APPROVAL_SCOPE_ERROR_CODES = [
  'EDUCATION_SCOPE_REQUIRED',
  'EDUCATION_SCOPE_SCHEDULE_NOT_AVAILABLE',
  'GENERAL_INDIVIDUAL_PREFERRED_SCHEDULE_REQUIRED',
  'GENERAL_INDIVIDUAL_PREFERRED_SCHEDULE_UNRESOLVED',
  'GENERAL_INDIVIDUAL_SCHEDULE_NOT_IN_PREFERENCE',
  'GENERAL_INDIVIDUAL_SINGLE_SCHEDULE_REQUIRED',
  'GENERAL_INDIVIDUAL_SCHEDULE_MULTI_REQUIRES_ALL_SCHEDULES',
  'GENERAL_INDIVIDUAL_EDUCATION_SCHEDULE_NOT_CONFIGURED',
  'GENERAL_INDIVIDUAL_PRE_EDUCATION_NOT_CONFIGURED',
  'GENERAL_INDIVIDUAL_PRE_EDUCATION_SCOPE_MISMATCH',
  'GENERAL_INDIVIDUAL_SCHEDULE_MODE_FIXED_DATE_ONLY',
  'EDUCATION_SCOPE_REVISION_CONFLICT',
  'EDUCATION_SCOPE_HAS_CERTIFICATE',
  'PARTICIPANT_NOT_ACTIVE',
  'APPLICATION_DECISION_CONFLICT',
] as const

export type IndividualApprovalScopeErrorCode =
  (typeof INDIVIDUAL_APPROVAL_SCOPE_ERROR_CODES)[number]

export type IndividualApprovalEducationStructure = 'CURRICULUM' | 'SCHEDULE'
export type IndividualApprovalSessionRound = 'SINGLE' | 'MULTI'
export type IndividualApprovalAssignmentKind =
  | 'preferred-exact-one'
  | 'preferred-at-least-one'
  | 'all-program-slots'

/** 개인 참여자는 단일 회차에서 1일정. 봉사자는 회차와 무관하게 희망 일정을 여러 개 배정할 수 있다. */
export type IndividualApprovalScheduleAudience = 'individual' | 'volunteer'

export type IndividualApprovalProgramShape = {
  educationStructure: IndividualApprovalEducationStructure
  sessionRound: IndividualApprovalSessionRound
  educationScheduleMode: 'FIXED_DATE'
}

export type IndividualApprovalScheduleOption = {
  key: string
  scheduleId: number | null
  title: string
  selectable: boolean
  blockedReason: string | null
}

export type IndividualApprovalSchedulePlan = {
  kind: IndividualApprovalAssignmentKind | null
  blockedReason: string | null
  options: IndividualApprovalScheduleOption[]
  lockedScheduleIds: number[]
}

const SELECTABLE_ROLES = new Set(['EDUCATION', 'SESSION'])
const DISPLAY_ROLES = new Set(['EDUCATION', 'SESSION', 'PRE_EDUCATION'])

export const GENERAL_INDIVIDUAL_PRE_EDUCATION_NOT_CONFIGURED_MESSAGE =
  '사전교육 일정이 아직 준비되지 않았습니다. 프로그램 저장/동기화 후 다시 시도해 주세요.'

/** PUT education-scope PRE_ED merge는 BE 대기(항목 9). 거절 코드를 일정 선택 오류로 오인하지 않는다. */
export const EDUCATION_SCOPE_PUT_PRE_EDUCATION_MERGE_PENDING_MESSAGE =
  '사전교육은 승인 API로만 연결됩니다. BE 수정 대기'

/** 서버 message가 비어 있을 때만 쓰는 FE 폴백 문구 (서버 문구 우선) */
const INDIVIDUAL_APPROVAL_SCOPE_CODE_FALLBACK_MESSAGES: Partial<Record<string, string>> = {
  GENERAL_INDIVIDUAL_PRE_EDUCATION_NOT_CONFIGURED:
    GENERAL_INDIVIDUAL_PRE_EDUCATION_NOT_CONFIGURED_MESSAGE,
  GENERAL_INDIVIDUAL_PRE_EDUCATION_SCOPE_MISMATCH:
    EDUCATION_SCOPE_PUT_PRE_EDUCATION_MERGE_PENDING_MESSAGE,
}

function readTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** 응답 envelope의 서버 message (`error.message` 우선, 없으면 최상위 `message`). code와 같으면 빈 값 */
function readServerErrorMessage(data: unknown, code: string): string {
  if (data == null || typeof data !== 'object') return ''
  const envelope = data as { message?: unknown; error?: { message?: unknown } | null }
  const message =
    readTrimmedString(envelope.error?.message) || readTrimmedString(envelope.message)
  return message === code ? '' : message
}

export const INDIVIDUAL_APPROVAL_PROGRAM_SHAPE_MISSING_MESSAGE =
  '프로그램의 교육 구조, 회차, 일정 모드를 확인할 수 없습니다.'

export const INDIVIDUAL_APPROVAL_FIXED_DATE_ONLY_MESSAGE =
  '일반 개인 프로그램 승인은 날짜 지정(FIXED_DATE) 교육 일정만 배정할 수 있습니다.'

export const INDIVIDUAL_APPROVAL_NO_SLOTS_MESSAGE =
  '배정 가능한 프로그램 교육 일정이 없습니다.'

export const INDIVIDUAL_APPROVAL_EXACT_ONE_MESSAGE = '교육 일정을 1개 선택해 주세요.'

export const INDIVIDUAL_APPROVAL_AT_LEAST_ONE_MESSAGE = '교육 일정을 1개 이상 선택해 주세요.'

export const INDIVIDUAL_APPROVAL_OUTSIDE_PREFERENCE_MESSAGE =
  '신청 희망 일정에 포함되지 않은 교육 일정은 선택할 수 없습니다.'

export const INDIVIDUAL_APPROVAL_ALL_SLOTS_MESSAGE =
  '일정형 복수 회차는 프로그램에 정의된 교육 일정 전체를 배정해야 합니다.'

export const INDIVIDUAL_APPROVAL_DEFAULT_REASON = '교육 일정 확정'

export const INDIVIDUAL_APPROVAL_REASON_MESSAGE = '승인 사유는 500자 이하로 입력해 주세요.'

export const INDIVIDUAL_PREFERRED_PERIOD_NOTE = '신청 희망 기간'

export const INDIVIDUAL_PREFERRED_AMBIGUOUS_NOTE =
  '동일 시간 슬롯이 여러 개라 자동 매칭할 수 없습니다.'

export const INDIVIDUAL_APPROVAL_NO_PREFERRED_MESSAGE = '신청 희망 교육 일정이 없습니다.'

export const INDIVIDUAL_APPROVAL_NO_SELECTABLE_PREFERRED_MESSAGE =
  '배정할 수 있는 신청 희망 일정이 없습니다.'

const REJECTED_EDUCATION_SCHEDULE_CODES = new Set([
  'EDUCATION_SCOPE_SCHEDULE_NOT_AVAILABLE',
  'GENERAL_INDIVIDUAL_SCHEDULE_NOT_IN_PREFERENCE',
])

function positiveScheduleId(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return Math.trunc(value)
}

function normalizeToken(value: unknown): string {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function isProgramDefinedActiveSlot(slot: ProgramEducationSlotResponse): boolean {
  const scheduleId = positiveScheduleId(slot.scheduleId)
  if (scheduleId == null) return false
  if (normalizeToken(slot.scheduleOrigin) !== 'PROGRAM_DEFINED') return false
  if (normalizeToken(slot.scheduleStatus) !== 'ACTIVE') return false
  return true
}

export function isSelectableProgramDefinedEducationSlot(
  slot: ProgramEducationSlotResponse
): boolean {
  if (!isProgramDefinedActiveSlot(slot)) return false
  if (isProgramSchedulePreEducation(slot)) return false
  return SELECTABLE_ROLES.has(normalizeToken(slot.scheduleRole))
}

export function isDisplayableProgramDefinedEducationSlot(
  slot: ProgramEducationSlotResponse
): boolean {
  if (!isProgramDefinedActiveSlot(slot)) return false
  if (isProgramSchedulePreEducation(slot)) return true
  return DISPLAY_ROLES.has(normalizeToken(slot.scheduleRole))
}

function listProgramDefinedEducationSlots(
  slots: ReadonlyArray<ProgramEducationSlotResponse> | null | undefined,
  accept: (slot: ProgramEducationSlotResponse) => boolean
): ProgramEducationSlotResponse[] {
  const seen = new Set<number>()
  const result: ProgramEducationSlotResponse[] = []
  for (const slot of slots ?? []) {
    if (!accept(slot)) continue
    const scheduleId = positiveScheduleId(slot.scheduleId)
    if (scheduleId == null || seen.has(scheduleId)) continue
    seen.add(scheduleId)
    result.push({ ...slot, scheduleId })
  }
  return result
}

export function listSelectableProgramDefinedEducationSlots(
  slots: ReadonlyArray<ProgramEducationSlotResponse> | null | undefined
): ProgramEducationSlotResponse[] {
  return listProgramDefinedEducationSlots(slots, isSelectableProgramDefinedEducationSlot)
}

export function listDisplayableProgramDefinedEducationSlots(
  slots: ReadonlyArray<ProgramEducationSlotResponse> | null | undefined
): ProgramEducationSlotResponse[] {
  return listProgramDefinedEducationSlots(slots, isDisplayableProgramDefinedEducationSlot)
}

export function resolveIndividualApprovalProgramShape(input: {
  educationStructure?: string | null
  sessionRound?: string | null
  educationScheduleMode?: string | null
}): IndividualApprovalProgramShape | { blockedReason: string } {
  const structure = normalizeToken(input.educationStructure)
  const round = normalizeToken(input.sessionRound)
  const mode = normalizeToken(input.educationScheduleMode)
  const educationStructure =
    structure === 'CURRICULUM' || structure === 'SCHEDULE' ? structure : null
  const sessionRound = round === 'SINGLE' || round === 'MULTI' ? round : null
  if (!educationStructure || !sessionRound || !mode) {
    return { blockedReason: INDIVIDUAL_APPROVAL_PROGRAM_SHAPE_MISSING_MESSAGE }
  }
  if (mode !== 'FIXED_DATE' && mode !== 'DATE') {
    return { blockedReason: INDIVIDUAL_APPROVAL_FIXED_DATE_ONLY_MESSAGE }
  }
  return {
    educationStructure,
    sessionRound,
    educationScheduleMode: 'FIXED_DATE',
  }
}

export function individualApprovalProgramShapeFromProgram(program: {
  generalProgramEducationStructure?: string | null
  generalProgramSessionRound?: string | null
  generalCommonInfo?: { educationScheduleMode?: string | null } | null
} | null | undefined): IndividualApprovalProgramShape | { blockedReason: string } {
  return resolveIndividualApprovalProgramShape({
    educationStructure: program?.generalProgramEducationStructure,
    sessionRound: program?.generalProgramSessionRound,
    educationScheduleMode: program?.generalCommonInfo?.educationScheduleMode,
  })
}

function formatInstantRange(startAt?: string | null, endAt?: string | null): string | null {
  const range = formatOrganizationScheduleRangeLabel(startAt, endAt)
  return range || null
}

function isDisplayableScheduleLabel(label: string | null | undefined): boolean {
  const trimmed = label?.trim() ?? ''
  if (!trimmed) return false
  if (/^line:\d+$/i.test(trimmed)) return false
  if (/^\d+$/.test(trimmed)) return false
  return true
}

function formatSessionRoundLabel(
  sessionNo: number | null | undefined,
  scheduleId: number | null | undefined
): string | null {
  if (sessionNo == null || !Number.isFinite(sessionNo)) return null
  const round = Math.trunc(sessionNo)
  if (round <= 0 || round > 99) return null
  if (scheduleId != null && round === scheduleId) return null
  return `${round}회차`
}

export function formatIndividualEducationSlotTitle(input: {
  scheduleId: number
  sessionNo?: number | null
  startAt?: string | null
  endAt?: string | null
  label?: string | null
}): string {
  if (isDisplayableScheduleLabel(input.label)) {
    return formatCmsScheduleDisplayLabel(input.label!.trim())
  }
  const range = formatInstantRange(input.startAt, input.endAt)
  const session = formatSessionRoundLabel(input.sessionNo, input.scheduleId)
  if (range) return session ? `${session} · ${range}` : range
  if (session) return session
  return '교육 일정'
}

function formatIndividualPreferredScheduleTitle(
  preferred: PreferredEducationSchedule,
  index: number
): string {
  const range = formatInstantRange(preferred.startAt, preferred.endAt)
  const scheduleId = positiveScheduleId(preferred.scheduleId)
  if (scheduleId != null) {
    return formatIndividualEducationSlotTitle({
      scheduleId,
      startAt: preferred.startAt,
      endAt: preferred.endAt,
      label: preferred.label,
    })
  }
  if (range) return range
  if (isDisplayableScheduleLabel(preferred.label)) {
    return formatCmsScheduleDisplayLabel(preferred.label!.trim())
  }
  return `신청 희망 일정 ${index + 1}`
}

export function listAssignedEducationSlotOptions(
  slots: ReadonlyArray<ProgramEducationSlotResponse> | null | undefined
): IndividualApprovalScheduleOption[] {
  return listDisplayableProgramDefinedEducationSlots(slots).map(slot => {
    const scheduleId = slot.scheduleId as number
    const preEducation = isProgramSchedulePreEducation(slot)
    return {
      key: `assigned-slot:${scheduleId}`,
      scheduleId,
      title: preEducation
        ? PRE_EDUCATION_DISPLAY_LABEL
        : formatIndividualEducationSlotTitle({
            scheduleId,
            sessionNo: slot.sessionNo,
            startAt: slot.startAt,
            endAt: slot.endAt,
          }),
      selectable: false,
      blockedReason: null,
    }
  })
}

export function listPlannedEducationSlotOptions(
  slots: ReadonlyArray<ProgramEducationSlotResponse> | null | undefined
): IndividualApprovalScheduleOption[] {
  return listSelectableProgramDefinedEducationSlots(slots).map(slot => {
    const scheduleId = slot.scheduleId as number
    return {
      key: `slot:${scheduleId}`,
      scheduleId,
      title: formatIndividualEducationSlotTitle({
        scheduleId,
        sessionNo: slot.sessionNo,
        startAt: slot.startAt,
        endAt: slot.endAt,
      }),
      selectable: false,
      blockedReason: null,
    }
  })
}

function preferredNote(
  preferred: PreferredEducationSchedule,
  scheduleId: number | null,
  selectableIds: ReadonlySet<number>
): string | null {
  if (preferred.unresolvedReason === 'AMBIGUOUS_SCHEDULE_MATCH') {
    return INDIVIDUAL_PREFERRED_AMBIGUOUS_NOTE
  }
  if (
    scheduleId == null ||
    preferred.unresolvedReason === 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH' ||
    !selectableIds.has(scheduleId)
  ) {
    return INDIVIDUAL_PREFERRED_PERIOD_NOTE
  }
  return null
}

export function listIndividualPreferredScheduleOptions(
  preferred: ReadonlyArray<PreferredEducationSchedule> | null | undefined,
  selectableIds: ReadonlySet<number>
): IndividualApprovalScheduleOption[] {
  return (preferred ?? []).map((item, index) => preferredOption(item, index, selectableIds))
}

function assignmentKind(
  shape: IndividualApprovalProgramShape,
  audience: IndividualApprovalScheduleAudience = 'individual'
): IndividualApprovalAssignmentKind {
  if (shape.educationStructure === 'SCHEDULE' && shape.sessionRound === 'MULTI') {
    return 'all-program-slots'
  }
  if (audience === 'volunteer' || shape.sessionRound === 'MULTI') return 'preferred-at-least-one'
  return 'preferred-exact-one'
}

export function nextIndividualApprovalScheduleIds(
  plan: IndividualApprovalSchedulePlan,
  prev: ReadonlyArray<number>,
  scheduleId: number
): number[] {
  if (plan.kind === 'preferred-exact-one') return [scheduleId]
  if (plan.kind === 'all-program-slots') return [...plan.lockedScheduleIds]
  if (prev.includes(scheduleId)) return prev.filter(id => id !== scheduleId)
  return [...prev, scheduleId]
}

function preferredOption(
  preferred: PreferredEducationSchedule,
  index: number,
  selectableIds: ReadonlySet<number>
): IndividualApprovalScheduleOption {
  const scheduleId = positiveScheduleId(preferred.scheduleId)
  const selectable = scheduleId != null && selectableIds.has(scheduleId)
  const note = selectable ? null : preferredNote(preferred, scheduleId, selectableIds)
  return {
    key:
      scheduleId != null
        ? selectable
          ? `preferred:${scheduleId}`
          : `preferred-unmatched:${scheduleId}:${index}`
        : `preferred-unresolved:${index}`,
    scheduleId,
    title: formatIndividualPreferredScheduleTitle(preferred, index),
    selectable,
    blockedReason: note,
  }
}

export function buildIndividualApprovalSchedulePlan(input: {
  program: IndividualApprovalProgramShape | { blockedReason: string } | null
  preferred?: ReadonlyArray<PreferredEducationSchedule> | null
  slots?: ReadonlyArray<ProgramEducationSlotResponse> | null
  slotsResolved: boolean
  audience?: IndividualApprovalScheduleAudience
}): IndividualApprovalSchedulePlan {
  if (!input.slotsResolved) {
    return { kind: null, blockedReason: null, options: [], lockedScheduleIds: [] }
  }
  if (input.program == null || 'blockedReason' in input.program) {
    return {
      kind: null,
      blockedReason: input.program?.blockedReason ?? INDIVIDUAL_APPROVAL_PROGRAM_SHAPE_MISSING_MESSAGE,
      options: [],
      lockedScheduleIds: [],
    }
  }
  const selectable = listSelectableProgramDefinedEducationSlots(input.slots)
  const selectableIds = new Set(
    selectable.map(slot => positiveScheduleId(slot.scheduleId)).filter((id): id is number => id != null)
  )
  const kind = assignmentKind(input.program, input.audience ?? 'individual')
  if (kind === 'all-program-slots') {
    if (selectable.length === 0) {
      return {
        kind,
        blockedReason: INDIVIDUAL_APPROVAL_NO_SLOTS_MESSAGE,
        options: [],
        lockedScheduleIds: [],
      }
    }
    const lockedScheduleIds = selectable.map(slot => slot.scheduleId as number)
    return {
      kind,
      blockedReason: null,
      lockedScheduleIds,
      options: listPlannedEducationSlotOptions(input.slots),
    }
  }

  const options = listIndividualPreferredScheduleOptions(input.preferred, selectableIds)
  const selectableOptions = options.filter(option => option.selectable && option.scheduleId != null)
  if (selectableOptions.length === 0) {
    return {
      kind,
      blockedReason:
        selectable.length === 0
          ? INDIVIDUAL_APPROVAL_NO_SLOTS_MESSAGE
          : options.length === 0
            ? INDIVIDUAL_APPROVAL_NO_PREFERRED_MESSAGE
            : INDIVIDUAL_APPROVAL_NO_SELECTABLE_PREFERRED_MESSAGE,
      options,
      lockedScheduleIds: [],
    }
  }
  return { kind, blockedReason: null, options, lockedScheduleIds: [] }
}

export function defaultIndividualApprovalScheduleIds(
  plan: IndividualApprovalSchedulePlan
): number[] {
  if (plan.kind === 'all-program-slots') return [...plan.lockedScheduleIds]
  const selectable = plan.options.filter(
    (option): option is IndividualApprovalScheduleOption & { scheduleId: number } =>
      option.selectable && option.scheduleId != null
  )
  if (plan.kind === 'preferred-exact-one' && selectable.length === 1) {
    return [selectable[0].scheduleId]
  }
  return []
}

function uniquePositiveIds(ids: ReadonlyArray<number>): number[] | null {
  const seen = new Set<number>()
  const result: number[] = []
  for (const id of ids) {
    const scheduleId = positiveScheduleId(id)
    if (scheduleId == null || seen.has(scheduleId)) return null
    seen.add(scheduleId)
    result.push(scheduleId)
  }
  return result
}

export function validateIndividualApprovalScheduleSelection(
  plan: IndividualApprovalSchedulePlan,
  selectedIds: ReadonlyArray<number>
): { ok: true; confirmedScheduleIds: number[] } | { ok: false; message: string } {
  if (plan.blockedReason) return { ok: false, message: plan.blockedReason }
  if (plan.kind == null) return { ok: false, message: INDIVIDUAL_APPROVAL_NO_SLOTS_MESSAGE }
  const confirmedScheduleIds = uniquePositiveIds(selectedIds)
  if (confirmedScheduleIds == null || confirmedScheduleIds.length === 0) {
    return {
      ok: false,
      message:
        plan.kind === 'preferred-at-least-one'
          ? INDIVIDUAL_APPROVAL_AT_LEAST_ONE_MESSAGE
          : plan.kind === 'all-program-slots'
            ? INDIVIDUAL_APPROVAL_ALL_SLOTS_MESSAGE
            : INDIVIDUAL_APPROVAL_EXACT_ONE_MESSAGE,
    }
  }
  if (plan.kind === 'all-program-slots') {
    const expected = new Set(plan.lockedScheduleIds)
    const sameSize = confirmedScheduleIds.length === expected.size
    const sameIds = confirmedScheduleIds.every(id => expected.has(id))
    if (!sameSize || !sameIds) {
      return { ok: false, message: INDIVIDUAL_APPROVAL_ALL_SLOTS_MESSAGE }
    }
    return { ok: true, confirmedScheduleIds: plan.lockedScheduleIds }
  }
  const allowed = new Set(
    plan.options.filter(option => option.selectable).map(option => option.scheduleId)
  )
  if (confirmedScheduleIds.some(id => !allowed.has(id))) {
    return { ok: false, message: INDIVIDUAL_APPROVAL_OUTSIDE_PREFERENCE_MESSAGE }
  }
  if (plan.kind === 'preferred-exact-one' && confirmedScheduleIds.length !== 1) {
    return { ok: false, message: INDIVIDUAL_APPROVAL_EXACT_ONE_MESSAGE }
  }
  return { ok: true, confirmedScheduleIds }
}

export function normalizeIndividualApprovalReason(
  reason: string
): { ok: true; reason: string } | { ok: false; message: string } {
  const trimmed = reason.trim()
  if (trimmed.length > 500) {
    return { ok: false, message: INDIVIDUAL_APPROVAL_REASON_MESSAGE }
  }
  return { ok: true, reason: trimmed || INDIVIDUAL_APPROVAL_DEFAULT_REASON }
}

export function buildIndividualApprovalWithScopeRequest(input: {
  confirmedScheduleIds: ReadonlyArray<number>
  reason: string
  expectedScopeRevision?: number
}): { ok: true; body: IndividualApprovalWithScopeRequest } | { ok: false; message: string } {
  const reason = normalizeIndividualApprovalReason(input.reason)
  if (!reason.ok) return reason
  const confirmedScheduleIds = uniquePositiveIds(input.confirmedScheduleIds)
  if (confirmedScheduleIds == null || confirmedScheduleIds.length === 0) {
    return { ok: false, message: INDIVIDUAL_APPROVAL_EXACT_ONE_MESSAGE }
  }
  const expectedScopeRevision = input.expectedScopeRevision ?? 0
  if (!Number.isInteger(expectedScopeRevision) || expectedScopeRevision < 0) {
    return { ok: false, message: '교육 일정 개정 번호를 확인할 수 없습니다.' }
  }
  return {
    ok: true,
    body: {
      confirmedScheduleIds,
      expectedScopeRevision,
      reason: reason.reason,
    },
  }
}

export function buildIndividualBulkApprovalWithScopeRequest(input: {
  reason: string
  targets: ReadonlyArray<{
    applicationId: string | number
    confirmedScheduleIds: ReadonlyArray<number>
    expectedScopeRevision?: number
  }>
}):
  | { ok: true; reason: string; targets: IndividualApprovalWithScopeBulkTarget[] }
  | { ok: false; message: string } {
  const reason = normalizeIndividualApprovalReason(input.reason)
  if (!reason.ok) return reason
  if (input.targets.length === 0) {
    return { ok: false, message: '승인할 신청을 선택해 주세요.' }
  }
  const targets: IndividualApprovalWithScopeBulkTarget[] = []
  for (const target of input.targets) {
    const applicationId = positiveScheduleId(Number(target.applicationId))
    const confirmedScheduleIds = uniquePositiveIds(target.confirmedScheduleIds)
    const expectedScopeRevision = target.expectedScopeRevision ?? 0
    if (
      applicationId == null ||
      confirmedScheduleIds == null ||
      confirmedScheduleIds.length === 0 ||
      !Number.isInteger(expectedScopeRevision) ||
      expectedScopeRevision < 0
    ) {
      return { ok: false, message: '신청별 교육 일정을 확인해 주세요.' }
    }
    targets.push({ applicationId, confirmedScheduleIds, expectedScopeRevision })
  }
  return { ok: true, reason: reason.reason, targets }
}

export function describeApprovedEducationScope(input: {
  requestedScheduleIds: ReadonlyArray<number>
  responseScheduleIds?: ReadonlyArray<number> | null
}): { scheduleIds: number[]; serverAddedScheduleIds: number[] } {
  const scheduleIds = (input.responseScheduleIds ?? [])
    .map(positiveScheduleId)
    .filter((id): id is number => id != null)
  const requested = new Set(
    input.requestedScheduleIds.map(positiveScheduleId).filter((id): id is number => id != null)
  )
  return {
    scheduleIds,
    serverAddedScheduleIds: scheduleIds.filter(id => !requested.has(id)),
  }
}

export function isEducationScopeRevisionConflict(error: unknown): boolean {
  return getApiErrorCode(error) === 'EDUCATION_SCOPE_REVISION_CONFLICT'
}

export function isEducationScopeCertificateLocked(error: unknown): boolean {
  return getApiErrorCode(error) === 'EDUCATION_SCOPE_HAS_CERTIFICATE'
}

export function isRejectedEducationScheduleSelectionError(error: unknown): boolean {
  const code = getApiErrorCode(error)
  return code != null && REJECTED_EDUCATION_SCHEDULE_CODES.has(code)
}

export function parseRejectedEducationScheduleIds(error: unknown): number[] {
  const data =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : error
  const raw = extractApiErrorDetails(data).rejectedScheduleIds?.trim()
  if (!raw) return []
  const seen = new Set<number>()
  const ids: number[] = []
  for (const part of raw.split(',')) {
    const scheduleId = positiveScheduleId(Number(part.trim()))
    if (scheduleId == null || seen.has(scheduleId)) continue
    seen.add(scheduleId)
    ids.push(scheduleId)
  }
  return ids
}

export function formatIndividualApprovalScopeErrorMessage(error: unknown): string {
  const timingMessage = getNotificationTimingApiErrorMessage(error)
  if (timingMessage) return timingMessage
  const code = getApiErrorCode(error)
  const data =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined
  const fallback = code ? INDIVIDUAL_APPROVAL_SCOPE_CODE_FALLBACK_MESSAGES[code] : undefined
  if (code === 'GENERAL_INDIVIDUAL_PRE_EDUCATION_NOT_CONFIGURED' && fallback) {
    return fallback
  }
  if (code && fallback) return readServerErrorMessage(data, code) || fallback
  const message = extractApiErrorMessage(data, {
    httpStatus: getApiErrorHttpStatus(error),
    fallback: '교육 일정 승인에 실패했습니다. 신청과 교육 일정을 다시 확인해 주세요.',
  }).trim()
  if (code && message && !message.includes(code)) return `${message} (${code})`
  return message || code || '교육 일정 승인에 실패했습니다. 신청과 교육 일정을 다시 확인해 주세요.'
}

export function individualApprovalEducationSlotsQueryKey(programId: string) {
  return [...generalProgramQueryKeys.educationSlots(programId), 'individual-approval'] as const
}

/** 승인 성공 후 신청 목록·상세·집계·교육 Scope를 갱신한다. 기관/강사/봉사자 키는 포함하지 않는다. */
export async function invalidateIndividualApprovalScopeQueries(
  queryClient: QueryClient,
  input: {
    programId: string
    applicationIds?: ReadonlyArray<string | number | null | undefined>
    participantIds?: ReadonlyArray<string | number | null | undefined>
  }
): Promise<void> {
  const programId = input.programId.trim()
  const tasks: Array<Promise<unknown>> = []
  if (programId) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: generalApplicationsQueryKeys.individualLists(programId),
      }),
      queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.participants(programId),
      }),
      queryClient.invalidateQueries({
        queryKey: individualApprovalEducationSlotsQueryKey(programId),
      })
    )
  }
  const applicationIds = (input.applicationIds ?? [])
    .map(id => (id == null ? '' : String(id).trim()))
    .filter(Boolean)
  if (applicationIds.length === 0) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: generalApplicationsQueryKeys.individualDetails(),
      })
    )
  } else {
    for (const applicationId of applicationIds) {
      tasks.push(
        queryClient.invalidateQueries({
          queryKey: generalApplicationsQueryKeys.individualDetail(applicationId),
        })
      )
    }
  }
  const participantIds = (input.participantIds ?? [])
    .map(id => (id == null ? '' : String(id).trim()))
    .filter(Boolean)
  if (participantIds.length === 0) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: generalProgramProgressQueryKeys.educationScopes(),
      })
    )
  } else if (programId) {
    for (const participantId of participantIds) {
      tasks.push(
        queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.educationScope(programId, participantId),
        })
      )
    }
  }
  await Promise.all(tasks)
}
