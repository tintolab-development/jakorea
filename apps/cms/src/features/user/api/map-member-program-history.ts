import type { MemberProgramHistoryResponse } from '@/shared/api/generated/members/schemas/memberProgramHistoryResponse'
import type { Application, FinalStatus, ParticipationRole, UserHistory } from '@/types/domain'
import type { ApplicationProgressStatus } from '@/types/application-progress'

function mapParticipantRole(raw?: string): ParticipationRole {
  const v = raw?.trim().toUpperCase()
  if (v === 'VOLUNTEER') return 'VOLUNTEER'
  if (v === 'INSTRUCTOR' || v === 'LECTURER') return 'INSTRUCTOR'
  return 'PARTICIPANT'
}

function mapFinalStatus(
  participantStatus?: string,
  completionStatus?: string
): FinalStatus {
  const status = (participantStatus ?? completionStatus)?.trim().toUpperCase()
  if (status === 'CANCELLED' || status === 'GIVE_UP' || status === 'WITHDRAWN') {
    return 'CANCELLED'
  }
  if (status === 'COMPLETED' || completionStatus?.trim().toUpperCase() === 'COMPLETED') {
    return 'COMPLETED'
  }
  return 'CONFIRMED'
}

function mapApplicationStatusFromParticipant(participantStatus?: string): Application['status'] {
  const v = participantStatus?.trim().toUpperCase()
  if (v === 'COMPLETED' || v === 'CONFIRMED' || v === 'ACTIVE') return 'approved'
  if (v === 'CANCELLED' || v === 'GIVE_UP') return 'rejected'
  return 'submitted'
}

function mapProgressFromParticipant(participantStatus?: string): ApplicationProgressStatus | undefined {
  const v = participantStatus?.trim().toUpperCase()
  if (v === 'IN_PROGRESS' || v === 'ACTIVE') return 'IN_PROGRESS'
  if (v === 'COMPLETED') return 'REPORT_SUBMITTED'
  if (v === 'RECEIVED' || v === 'JOINED') return 'RECEIVED'
  return undefined
}

export function isVolunteerProgramHistoryItem(item: MemberProgramHistoryResponse): boolean {
  const type = item.participantType?.trim().toUpperCase()
  return type === 'VOLUNTEER'
}

export function mapMemberProgramHistoryToUserHistory(
  item: MemberProgramHistoryResponse,
  userId: string
): UserHistory {
  const now = new Date().toISOString()
  const participantId = item.participantId
  const programId = item.programId != null ? String(item.programId) : 'unknown'
  const id =
    participantId != null ? `ph-${participantId}` : `ph-${programId}-${item.joinedAt ?? now}`

  return {
    id,
    userId,
    programId,
    role: mapParticipantRole(item.participantType),
    completedAt: item.completedAt ?? item.giveUpAt ?? item.joinedAt ?? now,
    finalStatus: mapFinalStatus(item.participantStatus, item.completionStatus),
    createdAt: item.joinedAt ?? now,
    updatedAt: item.completedAt ?? item.joinedAt ?? now,
    ...(item.programName?.trim() ? { programName: item.programName.trim() } : {}),
    ...(participantId != null ? { participantId } : {}),
  }
}

export function mapMemberProgramHistoryToApplication(
  item: MemberProgramHistoryResponse,
  subjectId: string
): Application {
  const now = new Date().toISOString()
  const participantId = item.participantId
  const programId = item.programId != null ? String(item.programId) : 'unknown'
  const id =
    participantId != null ? `part-${participantId}` : `part-${programId}-${item.joinedAt ?? now}`

  return {
    id,
    programId,
    subjectType: 'student',
    subjectId,
    status: mapApplicationStatusFromParticipant(item.participantStatus),
    progressStatus: mapProgressFromParticipant(item.participantStatus),
    submittedAt: item.joinedAt ?? now,
    createdAt: item.joinedAt ?? now,
    updatedAt: item.completedAt ?? item.joinedAt ?? now,
    customFields: {
      ...(item.programName?.trim() ? { programName: item.programName.trim() } : {}),
      ...(participantId != null ? { participantId } : {}),
    },
  }
}

export function mapMemberProgramHistoryItems(
  items: MemberProgramHistoryResponse[] | undefined,
  userId: string
): UserHistory[] {
  if (!items?.length) return []
  return items
    .filter(isVolunteerProgramHistoryItem)
    .map(item => mapMemberProgramHistoryToUserHistory(item, userId))
}

export function mapMemberProgramHistoryToEnrollmentApplications(
  items: MemberProgramHistoryResponse[] | undefined,
  subjectId: string
): Application[] {
  if (!items?.length) return []
  return items
    .filter(item => !isVolunteerProgramHistoryItem(item))
    .map(item => mapMemberProgramHistoryToApplication(item, subjectId))
}

/** API row에서 프로그램명 조회 — programService 폴백 전 사용 */
export function resolveProgramNameFromHistoryItem(
  item: MemberProgramHistoryResponse
): string | undefined {
  const name = item.programName?.trim()
  return name || undefined
}
