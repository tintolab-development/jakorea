import type { MemberAdminProgramResponse } from '@/shared/api/generated/members/schemas/memberAdminProgramResponse'
import type { AdminProgramAssignmentResponse } from '@/shared/api/generated/members/schemas/adminProgramAssignmentResponse'
import type { Program, ProgramLifecycleStatus, TargetLevel } from '@/types/domain'

/** OpenAPI 미반영 확장 필드 — BE 스키마 확장 시 매핑 SSOT */
type AdminProgramRowExtended = (MemberAdminProgramResponse | AdminProgramAssignmentResponse) & {
  programStartDate?: string
  progressYear?: number
  lifecycleStatus?: string
  programLifecycleStatus?: string
  programStatus?: string
  participantType?: string
  targetLevel?: string
  approvedStudentCount?: number
  recruitmentCapacity?: number
  capacity?: number
}

const PROGRAM_LIFECYCLE_VALUES: ReadonlySet<string> = new Set([
  'planned',
  'instructor_recruitment_planned',
  'volunteer_recruitment_planned',
  'participant_instructor_recruitment_planned',
  'recruiting_students',
  'recruiting_instructors',
  'recruiting_volunteers',
  'participant_instructor_recruiting',
  'education_in_progress',
  'matching_completed',
  'education_before_textbook',
  'education_after_textbook',
  'education_completed',
  'document_processing_completed',
  'participant_instructor_recruitment_completed',
])

const TARGET_LEVEL_VALUES: ReadonlySet<string> = new Set([
  'elementary',
  'middle',
  'high',
  'university',
  'adult',
])

function mapLifecycleStatus(raw?: string): ProgramLifecycleStatus | undefined {
  const normalized = raw?.trim().toLowerCase()
  if (!normalized) return undefined
  if (PROGRAM_LIFECYCLE_VALUES.has(normalized)) {
    return normalized as ProgramLifecycleStatus
  }
  const upper = raw?.trim().toUpperCase()
  const fromUpper: Record<string, ProgramLifecycleStatus> = {
    PLANNED: 'planned',
    INSTRUCTOR_RECRUITMENT_PLANNED: 'instructor_recruitment_planned',
    VOLUNTEER_RECRUITMENT_PLANNED: 'volunteer_recruitment_planned',
    PARTICIPANT_INSTRUCTOR_RECRUITMENT_PLANNED: 'participant_instructor_recruitment_planned',
    RECRUITING_STUDENTS: 'recruiting_students',
    RECRUITING_INSTRUCTORS: 'recruiting_instructors',
    RECRUITING_VOLUNTEERS: 'recruiting_volunteers',
    PARTICIPANT_INSTRUCTOR_RECRUITING: 'participant_instructor_recruiting',
    EDUCATION_IN_PROGRESS: 'education_in_progress',
    MATCHING_COMPLETED: 'matching_completed',
    EDUCATION_BEFORE_TEXTBOOK: 'education_before_textbook',
    EDUCATION_AFTER_TEXTBOOK: 'education_after_textbook',
    EDUCATION_COMPLETED: 'education_completed',
    DOCUMENT_PROCESSING_COMPLETED: 'document_processing_completed',
    PARTICIPANT_INSTRUCTOR_RECRUITMENT_COMPLETED: 'participant_instructor_recruitment_completed',
    /** API 별칭 — 도메인 enum에 없는 값은 가장 가까운 완료 상태로 */
    RECRUITMENT_CLOSED: 'matching_completed',
  }
  return upper ? fromUpper[upper] : undefined
}

function mapTargetLevel(raw?: string): TargetLevel | undefined {
  const normalized = raw?.trim().toLowerCase()
  if (normalized && TARGET_LEVEL_VALUES.has(normalized)) {
    return normalized as TargetLevel
  }
  return undefined
}

function mapParticipantCategory(
  raw?: string
): Program['category'] | undefined {
  const normalized = raw?.trim().toLowerCase()
  if (normalized === 'school' || normalized === 'institution') return 'school'
  if (normalized === 'volunteer') return 'school'
  if (normalized === 'individual') return 'individual'
  return undefined
}

function resolveStartDate(row: AdminProgramRowExtended): string {
  if (row.programStartDate?.trim()) return row.programStartDate.trim()
  if (row.assignedAt?.trim()) return row.assignedAt.trim()
  return new Date().toISOString()
}

function resolveCapacity(row: AdminProgramRowExtended): number {
  const capacity = row.recruitmentCapacity ?? row.capacity
  return typeof capacity === 'number' && Number.isFinite(capacity) ? capacity : 0
}

/** API 응답 → Program 테이블 호환 (미제공 필드는 undefined/기본값) */
export function mapMemberAdminProgramToProgram(
  row: MemberAdminProgramResponse | AdminProgramAssignmentResponse
): Program {
  const extended = row as AdminProgramRowExtended
  const programId = extended.programId != null ? String(extended.programId) : undefined
  const assignmentId =
    extended.assignmentId != null ? String(extended.assignmentId) : undefined
  const id = programId ?? assignmentId ?? `admin-prog-${crypto.randomUUID()}`
  const startDate = resolveStartDate(extended)
  const title = extended.programName?.trim() || '-'
  const lifecycleStatus = mapLifecycleStatus(
    extended.lifecycleStatus ?? extended.programLifecycleStatus ?? extended.programStatus
  )
  const targetLevel = mapTargetLevel(extended.targetLevel)
  const category = mapParticipantCategory(extended.participantType)
  const capacity = resolveCapacity(extended)

  return {
    id,
    title,
    type: 'offline',
    format: 'course',
    category: category ?? 'individual',
    status: 'active',
    lifecycleStatus,
    startDate,
    endDate: startDate,
    applicationStartDate: startDate,
    applicationEndDate: startDate,
    sponsorId: id,
    description: extended.assignmentRole?.trim() ?? '',
    targetLevel,
    approvedStudentCount:
      typeof extended.approvedStudentCount === 'number' &&
      Number.isFinite(extended.approvedStudentCount)
        ? extended.approvedStudentCount
        : undefined,
    rounds: [
      {
        id: `${id}-round`,
        programId: id,
        roundNumber: 1,
        capacity,
        startDate,
        endDate: startDate,
        status: 'active',
      },
    ],
    createdAt: startDate,
    updatedAt: startDate,
  }
}

export function mapMemberAdminPrograms(
  items: (MemberAdminProgramResponse | AdminProgramAssignmentResponse)[] | undefined
): Program[] {
  if (!items?.length) return []
  return items.map(mapMemberAdminProgramToProgram)
}
