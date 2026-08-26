import type { Application, UserHistory } from '@/types/domain'
import { programService } from '@/entities/program/api/program-service'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import {
  getEffectiveEnrollmentDisplayStatus,
  type ProgramEnrollmentDisplayStatus,
} from '@/shared/constants/status'

export function resolveMemberProgramYear(
  programId: string,
  record?: Application | UserHistory
): number | null {
  const fromApi = (record as Application | undefined)?.customFields?.progressYear
  if (typeof fromApi === 'number' && Number.isFinite(fromApi)) return fromApi
  if (isMembersRemoteEnabled()) return null
  const program = programService.getByIdSync(programId)
  if (!program) return null
  return new Date(program.startDate).getFullYear()
}

export function resolveMemberProgramTitle(
  programId: string,
  record?: Application | UserHistory
): string {
  const fromApi =
    (record as Application | undefined)?.customFields?.programName ??
    (record as UserHistory | undefined)?.programName
  if (typeof fromApi === 'string' && fromApi.trim()) return fromApi.trim()
  if (isMembersRemoteEnabled()) return programId
  const program = programService.getByIdSync(programId)
  return program?.title ?? programId
}

export function resolveApplicationEnrollmentDisplayStatus(
  app: Application
): ProgramEnrollmentDisplayStatus {
  const fromApi = app.customFields?.enrollmentDisplayStatus
  if (typeof fromApi === 'string' && fromApi.trim()) {
    return fromApi.trim() as ProgramEnrollmentDisplayStatus
  }
  if (isMembersRemoteEnabled()) {
    return getEffectiveEnrollmentDisplayStatus(
      app.status,
      app.progressStatus,
      undefined,
      app.rejectionKind
    )
  }
  const program = programService.getByIdSync(app.programId)
  return getEffectiveEnrollmentDisplayStatus(
    app.status,
    app.progressStatus,
    program?.lifecycleStatus,
    app.rejectionKind
  )
}

export function resolveVolunteerHistoryDisplayStatus(
  history: UserHistory
): ProgramEnrollmentDisplayStatus {
  if (history.finalStatus === 'CANCELLED') return 'REJECTED'
  if (history.finalStatus === 'COMPLETED') return 'PROGRAM_ENDED'
  if (history.finalStatus === 'CONFIRMED') return 'EDUCATION_IN_PROGRESS'
  if (isMembersRemoteEnabled()) {
    return getEffectiveEnrollmentDisplayStatus('submitted', undefined, undefined)
  }
  const program = programService.getByIdSync(history.programId)
  return getEffectiveEnrollmentDisplayStatus('submitted', undefined, program?.lifecycleStatus)
}
