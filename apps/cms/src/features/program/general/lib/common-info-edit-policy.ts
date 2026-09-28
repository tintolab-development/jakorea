/**
 * 일반 프로그램 상세 — 공통·모집 정보 「정보 수정」 가능 여부
 * 공통 정보: 사업 종료일(`endDate` = businessEndDate) 당일까지. 한국 시간 다음 날부터 불가.
 * 모집 정보: 그 유형의 `recruitments[].startAt` 전. `operationStartDate`로 막지 않는다.
 */

import type { Program } from '@/types/domain'
import {
  PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED_MESSAGE,
  PROGRAM_RECRUITMENT_EDIT_PERIOD_ENDED_MESSAGE,
} from '@/shared/lib/program-edit-window-error-message'
import {
  isCommonInfoEditPeriodOpen,
  isProgramRecruitmentTypeLocked,
  type ProgramRecruitmentEditType,
} from '@/features/program/shared/lib/program-edit-window'

export type GeneralProgramInfoEditBlockReason = 'missing' | 'period_ended'

export function resolveGeneralProgramInfoEditBlockReason(
  program: Program | null | undefined,
  now: Date = new Date()
): GeneralProgramInfoEditBlockReason | null {
  if (!program) return 'missing'
  if (!isCommonInfoEditPeriodOpen(program.endDate, now)) return 'period_ended'
  return null
}

export function canGeneralProgramCommonInfoEdit(
  program: Program | null | undefined,
  now: Date = new Date()
): boolean {
  return resolveGeneralProgramInfoEditBlockReason(program, now) == null
}

export function getGeneralProgramCommonInfoEditBlockedAlertMessage(
  _program: Program
): string {
  return PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED_MESSAGE
}

/** 모집 정보 — 유형별 `startAt`. 시작 시각이 없으면 수정 가능. */
export function canGeneralProgramRecruitmentInfoEdit(
  program: Program | null | undefined,
  recruitmentType: ProgramRecruitmentEditType,
  now: Date = new Date()
): boolean {
  if (!program) return false
  return !isProgramRecruitmentTypeLocked(program, recruitmentType, now)
}

export function getGeneralProgramRecruitmentInfoEditBlockedAlertMessage(
  _program: Program
): string {
  return PROGRAM_RECRUITMENT_EDIT_PERIOD_ENDED_MESSAGE
}
