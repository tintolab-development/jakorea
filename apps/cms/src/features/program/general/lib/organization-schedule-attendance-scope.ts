import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'
import type { SchoolDetailAttendanceStudentRow } from '@/features/program/general/model/school-detail-types'
import { getApiErrorCode } from '@/shared/lib/extract-api-error-message'

export const GENERAL_ORGANIZATION_ATTENDANCE_ASSIGNMENT_SCOPE_REQUIRED =
  'GENERAL_ORGANIZATION_ATTENDANCE_ASSIGNMENT_SCOPE_REQUIRED'

export const ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_TITLE = '출석 저장 안내'

export const ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_MESSAGE =
  '교육 일정 배정이 완료된 후 출석을 저장할 수 있습니다.'

export const ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_HINT =
  '기관의 교육 일정 배정을 먼저 완료해 주세요.'

const ALLOWED_ASSIGNMENT_STATUSES = new Set(['TEMP_ASSIGNED', 'CONFIRMED'])

export type OrganizationAttendanceScopeMissingStep = 'SCHEDULE_ASSIGNMENT'

export type OrganizationAttendanceScopeReadiness = {
  ready: boolean
  missingStep?: OrganizationAttendanceScopeMissingStep
  unassignedStudentCount: number
}

function resolveSlotProgramScheduleId(slot: SlotResponse): number | null {
  const raw =
    (slot as SlotResponse & { programScheduleId?: number | null }).programScheduleId ??
    slot.scheduleId
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) return null
  return raw
}

function resolveSlotActiveYn(slot: SlotResponse): boolean {
  const raw = (slot as SlotResponse & { activeYn?: boolean | null }).activeYn ?? slot.active
  return raw === true
}

function isSlotEligibleForAttendanceRecord(
  slot: SlotResponse,
  input: {
    programId: string
    organizationApplicationId: string
    scheduleId: number
  }
): boolean {
  const programScheduleId = resolveSlotProgramScheduleId(slot)
  if (programScheduleId !== input.scheduleId) return false

  const orgAppId = slot.organizationApplicationId
  if (orgAppId == null) return false
  if (String(orgAppId) !== String(input.organizationApplicationId)) return false

  if (!resolveSlotActiveYn(slot)) return false

  const status = (slot.assignmentStatus ?? '').trim().toUpperCase()
  if (!ALLOWED_ASSIGNMENT_STATUSES.has(status)) return false

  const programId = slot.programId
  if (programId != null && String(programId) !== String(input.programId)) return false

  return true
}

/**
 * GENERAL_ORGANIZATION 회차 출석 저장 전 기관 일정 배정 scope 충족 여부.
 * 일반 기관 일정 배정은 scheduleId 단위(학년·학급 미연결)이므로 학생/배정의 grade·class_name은 보지 않는다.
 * 최종 판정(명단 소속·배정 상태)은 서버 bulk-upsert 응답이 SSOT.
 */
export function evaluateOrganizationAttendanceScopeReadiness(input: {
  programId: string
  organizationApplicationId: string
  scheduleId: number
  rosterStudents: Array<Pick<SchoolDetailAttendanceStudentRow, 'participantId'>>
  assignmentSlots: SlotResponse[]
}): OrganizationAttendanceScopeReadiness {
  const scopeInput = {
    programId: input.programId,
    organizationApplicationId: input.organizationApplicationId,
    scheduleId: input.scheduleId,
  }

  const rosterStudentCount = input.rosterStudents.filter(
    student =>
      student.participantId != null &&
      Number.isFinite(Number(student.participantId)) &&
      Number(student.participantId) > 0
  ).length

  if (rosterStudentCount === 0) {
    return {
      ready: false,
      missingStep: 'SCHEDULE_ASSIGNMENT',
      unassignedStudentCount: 0,
    }
  }

  const hasScheduleAssignment = input.assignmentSlots.some(slot =>
    isSlotEligibleForAttendanceRecord(slot, scopeInput)
  )

  if (hasScheduleAssignment) {
    return {
      ready: true,
      unassignedStudentCount: 0,
    }
  }

  return {
    ready: false,
    missingStep: 'SCHEDULE_ASSIGNMENT',
    unassignedStudentCount: rosterStudentCount,
  }
}

export function formatOrganizationAttendanceScopeBlockedDescription(
  readiness: OrganizationAttendanceScopeReadiness,
  sessionLabel?: string
): string {
  const lines = [ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_MESSAGE, ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_HINT]
  if (sessionLabel?.trim()) {
    lines.push(`선택 회차: ${sessionLabel.trim()}`)
  }
  if (readiness.unassignedStudentCount > 0) {
    lines.push(`미배정 학생 수: ${readiness.unassignedStudentCount}명`)
  }
  if (readiness.missingStep) {
    lines.push(`선행 절차: ${readiness.missingStep}`)
  }
  return lines.join('\n')
}

/** 서버 code가 `GENERAL_ORGANIZATION_ATTENDANCE_ASSIGNMENT_SCOPE_REQUIRED[:<participantId>]` 형태일 수 있어 prefix로 판정 */
export function isGeneralOrganizationAttendanceScopeRequiredError(error: unknown): boolean {
  const code = getApiErrorCode(error)
  if (!code) return false
  return (
    code === GENERAL_ORGANIZATION_ATTENDANCE_ASSIGNMENT_SCOPE_REQUIRED ||
    code.startsWith(`${GENERAL_ORGANIZATION_ATTENDANCE_ASSIGNMENT_SCOPE_REQUIRED}:`)
  )
}

export function resolveOrganizationAttendanceScopeErrorMessage(error: unknown): string | null {
  if (!isGeneralOrganizationAttendanceScopeRequiredError(error)) return null
  const data =
    error && typeof error === 'object' && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined
  const details =
    data && typeof data === 'object' && 'error' in data
      ? (data as { error?: { details?: Record<string, unknown> | null } }).error?.details
      : undefined
  const missingStep =
    details && typeof details.missingStep === 'string' ? details.missingStep.trim() : ''
  if (missingStep === 'SCHEDULE_ASSIGNMENT') {
    return `${ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_MESSAGE}\n${ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_HINT}`
  }
  return `${ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_MESSAGE}\n${ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_HINT}`
}
