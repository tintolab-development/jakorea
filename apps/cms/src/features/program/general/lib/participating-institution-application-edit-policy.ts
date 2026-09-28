/**
 * 프로그램 진행 현황 > 참여 기관 상세 — 신청 정보 「정보 수정」 가능 여부
 * 프로그램·기관 진행 현황이 「진행 중」「완료」이면 비활성.
 */

import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import { getProgramProgressUiBucket } from '@/shared/lib/program-typed-lifecycle'
import type { Program } from '@/types/domain'

export type ParticipatingInstitutionApplicationInfoEditBlockReason =
  | 'missing_program'
  | 'enrollment_in_progress'
  | 'enrollment_completed'
  | 'program_phase_in_progress'
  | 'program_phase_completed'
  | 'program_phase_other'

export function resolveParticipatingInstitutionApplicationInfoEditBlockReason(params: {
  program?: Program | null
  enrollmentStatus?: ProgramEnrollmentDisplayStatus | null
}): ParticipatingInstitutionApplicationInfoEditBlockReason | null {
  const { program, enrollmentStatus } = params
  if (!program) return 'missing_program'

  if (enrollmentStatus === 'EDUCATION_IN_PROGRESS') return 'enrollment_in_progress'
  if (enrollmentStatus === 'PROGRAM_ENDED') return 'enrollment_completed'

  const bucket = getProgramProgressUiBucket(program.lifecycleStatus)
  if (bucket === 'IN_PROGRESS') return 'program_phase_in_progress'
  if (bucket === 'COMPLETED') return 'program_phase_completed'
  return null
}

export function canParticipatingInstitutionApplicationInfoEdit(params: {
  program?: Program | null
  enrollmentStatus?: ProgramEnrollmentDisplayStatus | null
}): boolean {
  return resolveParticipatingInstitutionApplicationInfoEditBlockReason(params) == null
}

export function getParticipatingInstitutionApplicationInfoEditBlockedAlertMessage(params: {
  program: Program
  enrollmentStatus?: ProgramEnrollmentDisplayStatus | null
}): string {
  const reason = resolveParticipatingInstitutionApplicationInfoEditBlockReason(params)
  if (reason === 'enrollment_in_progress' || reason === 'program_phase_in_progress') {
    return '프로그램 진행 중에는 신청 정보를 수정할 수 없습니다.'
  }
  if (reason === 'enrollment_completed' || reason === 'program_phase_completed') {
    return '프로그램 진행이 완료된 경우 신청 정보를 수정할 수 없습니다.'
  }
  return '현재 상태에서는 신청 정보를 수정할 수 없습니다.'
}
