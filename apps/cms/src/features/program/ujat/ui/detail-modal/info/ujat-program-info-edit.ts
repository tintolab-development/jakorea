/**
 * UJAT 프로그램 공통 정보·모집 정보 「정보 수정」 가능 여부.
 * 공통 정보는 사업 종료일 당일까지. 모집 정보는 유형별 운영 시작일 전.
 */

import type { Program } from '@/types/domain'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import { getProgramProgressDisplayStatus } from '@/shared/constants/status'
import { isCommonInfoEditPeriodOpen, isProgramOperationStartLocked } from '@/features/program/shared/lib/program-edit-window'

/** @deprecated `getProgramProgressDisplayStatus` 사용 */
export function getUjatProgramProgressDisplayStatus(
  program: Program
): ProgramEnrollmentDisplayStatus {
  return getProgramProgressDisplayStatus(program)
}

export function canUjatProgramInfoEdit(program: Program | null | undefined): boolean {
  if (!program) return false
  return isCommonInfoEditPeriodOpen(program.endDate)
}

export function canUjatRecruitmentInfoEdit(
  program: Program | null | undefined,
  recruitTab: 'recruit_participant' | 'recruit_volunteer_h1' | 'recruit_volunteer_h2'
): boolean {
  if (!program) return false
  const recruitmentType = recruitTab === 'recruit_participant' ? 'PARTICIPANT' : 'VOLUNTEER'
  return !isProgramOperationStartLocked(program, recruitmentType)
}
