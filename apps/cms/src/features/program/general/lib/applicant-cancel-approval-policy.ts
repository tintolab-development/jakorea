import type { ApplicantApprovalStatusKey } from '@/data/mock/applicant-institutions'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import {
  PROGRAM_PROGRESS_PHASE_COMPLETED_STATUSES,
  PROGRAM_PROGRESS_PHASE_IN_PROGRESS_STATUSES,
} from '@/shared/constants/status'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'

const PROGRAM_STARTED_LIFECYCLE_STATUSES = new Set<ProgramLifecycleStatus>([
  ...PROGRAM_PROGRESS_PHASE_IN_PROGRESS_STATUSES,
  ...PROGRAM_PROGRESS_PHASE_COMPLETED_STATUSES,
])

export interface ApplicantCancelApprovalState {
  disabled: boolean
  reason: string | null
}

function hasCompletedSession(sessions?: ParticipatingSchoolSession[]): boolean {
  return (sessions ?? []).some(session => session.status === 'completed')
}

function isProgramProgressStarted(program: Program | null | undefined): boolean {
  const lifecycle = program?.lifecycleStatus
  if (!lifecycle) return false
  return PROGRAM_STARTED_LIFECYCLE_STATUSES.has(lifecycle)
}

export function resolveApplicantCancelApprovalState(params: {
  program?: Program | null
  approvalStatus: ApplicantApprovalStatusKey
  sessions?: ParticipatingSchoolSession[]
  hasCancelHandler?: boolean
}): ApplicantCancelApprovalState {
  const { program, approvalStatus, sessions, hasCancelHandler = true } = params

  if (!hasCancelHandler) {
    return { disabled: true, reason: '현재 승인 취소를 처리할 수 없습니다.' }
  }

  if (approvalStatus !== 'approved') {
    return { disabled: true, reason: '승인 완료 상태에서만 승인 취소할 수 있습니다.' }
  }

  if (isProgramProgressStarted(program) || hasCompletedSession(sessions)) {
    return {
      disabled: true,
      reason: '프로그램 진행 이후에는 승인 취소할 수 없습니다.',
    }
  }

  return { disabled: false, reason: null }
}
