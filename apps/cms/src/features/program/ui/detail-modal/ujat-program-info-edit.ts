/**
 * UJAT 프로그램 진행 현황·공통 정보 「정보 수정」 가능 여부
 */

import type { Program, UjatProgramProgressStatus } from '@/types/domain'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import { getEnrollmentDisplayStatusFromProgramLifecycle } from '@/shared/constants/status'

const EDIT_BLOCKED_STATUSES: ReadonlySet<UjatProgramProgressStatus> = new Set([
  'EDUCATION_IN_PROGRESS',
  'PROGRAM_ENDED',
])

export function getUjatProgramProgressDisplayStatus(
  program: Program
): ProgramEnrollmentDisplayStatus {
  if (program.ujatProgressStatus) {
    return program.ujatProgressStatus
  }
  if (program.lifecycleStatus) {
    return getEnrollmentDisplayStatusFromProgramLifecycle(program.lifecycleStatus)
  }
  return 'EDUCATION_SCHEDULED'
}

export function canUjatProgramInfoEdit(program: Program | null | undefined): boolean {
  if (!program) return false
  const status = getUjatProgramProgressDisplayStatus(program)
  return !EDIT_BLOCKED_STATUSES.has(status as UjatProgramProgressStatus)
}
