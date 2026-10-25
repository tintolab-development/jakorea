/**
 * 일반 프로그램 상세 — 공통·모집·신청 양식 「정보 수정」 가능 여부
 * 공통 정보: 사업 종료일(`endDate` = businessEndDate) 당일까지. 한국 시간 다음 날부터 불가.
 * 모집 정보: 그 모집행의 `startAt` 전. 시작하지 않은 행이 있으면 그 유형은 연다.
 * 신청 양식: 모집별 신청 건수가 0건일 때만 클라이언트에서 수정 가능 상태로 본다.
 * 실제 저장 가능 여부는 서버가 최종 판단한다.
 */

import type { Program } from '@/types/domain'
import {
  PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED_MESSAGE,
  PROGRAM_RECRUITMENT_INFO_EDIT_BLOCKED_ALERT_TITLE,
  PROGRAM_RECRUITMENT_ROW_EDIT_PERIOD_ENDED_MESSAGE,
} from '@/shared/lib/program-edit-window-error-message'
import {
  isCommonInfoEditPeriodOpen,
  isRecruitmentTypeGeneralInfoClosed,
  type ProgramRecruitmentEditType,
} from '@/features/program/shared/lib/program-edit-window'

export type ApplicationFormEditContext = {
  /** 해당 모집에 연결된 신청 양식 바인딩이 있는지. 없으면 항상 허용한다. */
  hasBinding?: boolean
  /** 해당 모집의 신청 건수. 모르는 경우 클라이언트는 선차단하지 않는다. */
  applicationCount?: number | null
}

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

export function getGeneralProgramCommonInfoEditBlockedAlertMessage(_program: Program): string {
  return PROGRAM_COMMON_INFO_EDIT_PERIOD_ENDED_MESSAGE
}

/** 모집 정보 — 저장된 행이 모두 `startAt`을 지나면 닫는다. 시작 전 행이 있으면 연다. */
export function canGeneralProgramRecruitmentInfoEdit(
  program: Program | null | undefined,
  recruitmentType: ProgramRecruitmentEditType,
  now: Date = new Date()
): boolean {
  if (!program) return false
  return !isRecruitmentTypeGeneralInfoClosed(program, recruitmentType, now)
}

export function getGeneralProgramRecruitmentInfoEditBlockedAlertTitle(): string {
  return PROGRAM_RECRUITMENT_INFO_EDIT_BLOCKED_ALERT_TITLE
}

export function getGeneralProgramRecruitmentInfoEditBlockedAlertMessage(_program: Program): string {
  return PROGRAM_RECRUITMENT_ROW_EDIT_PERIOD_ENDED_MESSAGE
}

/**
 * 신청 양식 — 모집별 신청 건수가 있을 때만 클라이언트 잠금 상태로 본다.
 * 날짜는 더 이상 신청 양식 수정의 선차단 기준으로 사용하지 않는다.
 */
export function canGeneralProgramApplicationFormEdit(
  program: Program | null | undefined,
  recruitmentType: ProgramRecruitmentEditType,
  context: ApplicationFormEditContext = {}
): boolean {
  if (!program) return false
  const rows = (program.programRecruitments ?? []).filter(
    row => row.recruitmentType === recruitmentType
  )
  if (context.hasBinding === false) return true
  if (
    context.hasBinding == null &&
    rows.length > 0 &&
    rows.every(row => row.applicationFormBindingId == null)
  ) {
    return true
  }
  return (context.applicationCount ?? 0) <= 0
}
