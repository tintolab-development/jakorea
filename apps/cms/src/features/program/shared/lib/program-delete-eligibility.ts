/**
 * 프로그램 목록 — 삭제 가능 여부 (체크박스 비활성 UI 가드)
 * 교육 예정 참여자 또는 교육 진행 이력이 있으면 삭제 불가. 최종 판정은 BE 409.
 */

import type { ProgramLifecycleStatus, UjatProgramProgressStatus } from '@/types/domain'
import { programMatchesProgressPhase } from '@/features/program/general/ui/constants/program-list-constants'

export interface ProgramListDeleteEligibilityInput {
  lifecycleStatus?: ProgramLifecycleStatus
  ujatProgressStatus?: UjatProgramProgressStatus
  participantApprovedCount?: number | null
  approvedOrganizationApplicationCount?: number | null
  participatingSchoolCount?: number | null
  participatingStudentCount?: number | null
}

const UJAT_DELETE_BLOCKED_PROGRESS: readonly UjatProgramProgressStatus[] = [
  'EDUCATION_IN_PROGRESS',
  'PROGRAM_ENDED',
]

function isPositive(value: number | null | undefined): boolean {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

export function resolveProgramListDeleteBlocked(input: ProgramListDeleteEligibilityInput): boolean {
  const hasScheduledParticipants =
    isPositive(input.participantApprovedCount) ||
    isPositive(input.approvedOrganizationApplicationCount) ||
    isPositive(input.participatingSchoolCount) ||
    isPositive(input.participatingStudentCount)
  if (hasScheduledParticipants) return true

  if (input.ujatProgressStatus) {
    return UJAT_DELETE_BLOCKED_PROGRESS.includes(input.ujatProgressStatus)
  }

  const program = { lifecycleStatus: input.lifecycleStatus }
  return (
    programMatchesProgressPhase(program, 'in_progress') ||
    programMatchesProgressPhase(program, 'completed')
  )
}
