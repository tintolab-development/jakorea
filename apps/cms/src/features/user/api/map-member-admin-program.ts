import type { MemberAdminProgramResponse } from '@/shared/api/generated/members/schemas/memberAdminProgramResponse'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'

const DEFAULT_LIFECYCLE: ProgramLifecycleStatus = 'education_in_progress'

/** API 응답 → Program 테이블 호환 스텁 (미제공 필드는 기본값) */
export function mapMemberAdminProgramToProgram(row: MemberAdminProgramResponse): Program {
  const programId = row.programId != null ? String(row.programId) : undefined
  const assignmentId = row.assignmentId != null ? String(row.assignmentId) : undefined
  const id = programId ?? assignmentId ?? `admin-prog-${crypto.randomUUID()}`
  const assignedAt = row.assignedAt ?? new Date().toISOString()
  const title = row.programName?.trim() || '-'

  return {
    id,
    title,
    type: 'offline',
    format: 'course',
    category: 'school',
    status: 'active',
    lifecycleStatus: DEFAULT_LIFECYCLE,
    startDate: assignedAt,
    endDate: assignedAt,
    applicationStartDate: assignedAt,
    applicationEndDate: assignedAt,
    sponsorId: id,
    description: row.assignmentRole?.trim() ?? '',
    rounds: [
      {
        id: `${id}-round`,
        programId: id,
        roundNumber: 1,
        capacity: 0,
        startDate: assignedAt,
        endDate: assignedAt,
        status: 'active',
      },
    ],
    createdAt: assignedAt,
    updatedAt: assignedAt,
  }
}

export function mapMemberAdminPrograms(
  items: MemberAdminProgramResponse[] | undefined
): Program[] {
  if (!items?.length) return []
  return items.map(mapMemberAdminProgramToProgram)
}
