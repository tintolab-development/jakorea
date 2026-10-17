import type { SlotResponse } from '@/shared/api/generated/dashboard/schemas/slotResponse'
import type { SchoolDetailAttendanceStudentRow } from '@/features/program/general/model/school-detail-types'
import { parseStudentGradeClassForRosterApi } from '@/features/program/general/lib/student-registered-grade-class-options'
import { getApiErrorCode } from '@/shared/lib/extract-api-error-message'

export const GENERAL_ORGANIZATION_ATTENDANCE_ASSIGNMENT_SCOPE_REQUIRED =
  'GENERAL_ORGANIZATION_ATTENDANCE_ASSIGNMENT_SCOPE_REQUIRED'

export const ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_TITLE = '출석 저장 안내'

export const ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_MESSAGE =
  '교육 일정 배정이 완료된 후 출석을 저장할 수 있습니다.'

export const ORGANIZATION_ATTENDANCE_SCOPE_BLOCKED_HINT =
  '기관의 교육 일정 배정을 먼저 완료해 주세요.'

const ALLOWED_ASSIGNMENT_STATUSES = new Set(['TEMP_ASSIGNED', 'CONFIRMED'])

/** 레거시 OSA row — OpenAPI `SlotResponse`에 grade/class가 없을 수 있음 */
type LegacyOrganizationAssignmentSlotFields = {
  grade?: string | null
  className?: string | null
  classLabel?: string | null
}

type OrganizationAssignmentSlot = SlotResponse & LegacyOrganizationAssignmentSlotFields

function asOrganizationAssignmentSlot(slot: SlotResponse): OrganizationAssignmentSlot {
  return slot as OrganizationAssignmentSlot
}

export type OrganizationAttendanceScopeMissingStep = 'SCHEDULE_ASSIGNMENT'

export type OrganizationAttendanceScopeGradeClassSummary = {
  grade: string
  className: string
  studentCount: number
}

export type OrganizationAttendanceScopeReadiness = {
  ready: boolean
  missingStep?: OrganizationAttendanceScopeMissingStep
  unassignedStudentCount: number
  missingByGradeClass: OrganizationAttendanceScopeGradeClassSummary[]
}

export function normalizeOrganizationAttendanceScopeLabel(value: string): string {
  return value.trim().toLowerCase()
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

function resolveSlotClassName(slot: OrganizationAssignmentSlot): string {
  return (slot.className ?? slot.classLabel ?? '').trim()
}

function isPlaceholderAssignmentLabel(value: string): boolean {
  const normalized = value.trim()
  return !normalized || normalized === '미지정'
}

/** GENERAL schedule-only OSA — grade/class 없음 또는 미지정 placeholder */
function isScheduleOnlyOrganizationAssignmentSlot(slot: SlotResponse): boolean {
  const legacy = asOrganizationAssignmentSlot(slot)
  const grade = (legacy.grade ?? '').trim()
  const className = resolveSlotClassName(legacy)
  return isPlaceholderAssignmentLabel(grade) && isPlaceholderAssignmentLabel(className)
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

function studentMatchesAssignmentSlot(
  studentGrade: string,
  studentClassName: string,
  slot: SlotResponse
): boolean {
  if (isScheduleOnlyOrganizationAssignmentSlot(slot)) {
    return true
  }
  const legacy = asOrganizationAssignmentSlot(slot)
  const slotGrade = (legacy.grade ?? '').trim()
  const slotClassName = resolveSlotClassName(legacy)
  if (!slotGrade || !studentClassName.trim() || !slotClassName) return false

  return (
    normalizeOrganizationAttendanceScopeLabel(studentGrade) ===
      normalizeOrganizationAttendanceScopeLabel(slotGrade) &&
    normalizeOrganizationAttendanceScopeLabel(studentClassName) ===
      normalizeOrganizationAttendanceScopeLabel(slotClassName)
  )
}

function studentHasAttendanceAssignmentScope(
  studentGrade: string,
  studentClassName: string,
  slots: SlotResponse[],
  scopeInput: {
    programId: string
    organizationApplicationId: string
    scheduleId: number
  }
): boolean {
  return slots.some(
    slot =>
      isSlotEligibleForAttendanceRecord(slot, scopeInput) &&
      studentMatchesAssignmentSlot(studentGrade, studentClassName, slot)
  )
}

function summarizeMissingStudents(
  missingStudents: Array<{ grade: string; className: string }>
): OrganizationAttendanceScopeGradeClassSummary[] {
  const counts = new Map<string, OrganizationAttendanceScopeGradeClassSummary>()
  for (const student of missingStudents) {
    const grade = student.grade.trim() || '-'
    const className = student.className.trim() || '-'
    const key = `${grade}\u0000${className}`
    const existing = counts.get(key)
    if (existing) {
      existing.studentCount += 1
    } else {
      counts.set(key, { grade, className, studentCount: 1 })
    }
  }
  return [...counts.values()].sort((a, b) =>
    `${a.grade}${a.className}`.localeCompare(`${b.grade}${b.className}`, 'ko')
  )
}

/** GENERAL_ORGANIZATION 회차 출석 저장 전 학급 일정 배정 scope 충족 여부 */
export function evaluateOrganizationAttendanceScopeReadiness(input: {
  programId: string
  organizationApplicationId: string
  scheduleId: number
  educationGrade?: string | null
  rosterStudents: Array<Pick<SchoolDetailAttendanceStudentRow, 'participantId' | 'gradeClass'>>
  assignmentSlots: SlotResponse[]
}): OrganizationAttendanceScopeReadiness {
  const scopeInput = {
    programId: input.programId,
    organizationApplicationId: input.organizationApplicationId,
    scheduleId: input.scheduleId,
  }

  const studentsForScope = input.rosterStudents.filter(
    student =>
      student.participantId != null &&
      Number.isFinite(Number(student.participantId)) &&
      Number(student.participantId) > 0
  )

  if (studentsForScope.length === 0) {
    return {
      ready: false,
      missingStep: 'SCHEDULE_ASSIGNMENT',
      unassignedStudentCount: 0,
      missingByGradeClass: [],
    }
  }

  const missingStudents: Array<{ grade: string; className: string }> = []

  for (const student of studentsForScope) {
    const { grade, className } = parseStudentGradeClassForRosterApi(
      student.gradeClass ?? '',
      input.educationGrade
    )
    const hasScope = studentHasAttendanceAssignmentScope(
      grade,
      className,
      input.assignmentSlots,
      scopeInput
    )
    if (!hasScope) {
      missingStudents.push({ grade, className })
    }
  }

  if (missingStudents.length === 0) {
    return {
      ready: true,
      unassignedStudentCount: 0,
      missingByGradeClass: [],
    }
  }

  return {
    ready: false,
    missingStep: 'SCHEDULE_ASSIGNMENT',
    unassignedStudentCount: missingStudents.length,
    missingByGradeClass: summarizeMissingStudents(missingStudents),
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
  if (readiness.missingByGradeClass.length > 0) {
    const gradeClassLines = readiness.missingByGradeClass
      .slice(0, 8)
      .map(
        item =>
          `${item.grade} ${item.className} (${item.studentCount}명)`.trim()
      )
    lines.push(`미배정 학년·반: ${gradeClassLines.join(', ')}`)
    if (readiness.missingByGradeClass.length > 8) {
      lines.push(`외 ${readiness.missingByGradeClass.length - 8}개 학급`)
    }
  }
  if (readiness.missingStep) {
    lines.push(`선행 절차: ${readiness.missingStep}`)
  }
  return lines.join('\n')
}

export function isGeneralOrganizationAttendanceScopeRequiredError(error: unknown): boolean {
  return (
    getApiErrorCode(error) === GENERAL_ORGANIZATION_ATTENDANCE_ASSIGNMENT_SCOPE_REQUIRED
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
