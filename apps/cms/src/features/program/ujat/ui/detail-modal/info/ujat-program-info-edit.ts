/**
 * UJAT 프로그램 진행 현황·공통 정보 「정보 수정」 가능 여부
 */

import type { Program, UjatProgramProgressStatus } from '@/types/domain'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import { getProgramProgressDisplayStatus } from '@/shared/constants/status'

const EDIT_BLOCKED_STATUSES: ReadonlySet<UjatProgramProgressStatus> = new Set([
  'EDUCATION_IN_PROGRESS',
  'PROGRAM_ENDED',
])

/** @deprecated `getProgramProgressDisplayStatus` 사용 */
export function getUjatProgramProgressDisplayStatus(
  program: Program
): ProgramEnrollmentDisplayStatus {
  return getProgramProgressDisplayStatus(program)
}

export function canUjatProgramInfoEdit(program: Program | null | undefined): boolean {
  if (!program) return false
  const status = getProgramProgressDisplayStatus(program)
  return !EDIT_BLOCKED_STATUSES.has(status as UjatProgramProgressStatus)
}
