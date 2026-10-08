/**
 * UJAT 프로그램 상세 LNB·설문·면접 분기용 메타
 */

import type { Program } from '@/types/domain'
import {
  findUjatRegistrationLocalSaveProgramById,
  UJAT_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX,
} from '@/features/program/ujat/lib/ujat-registration-local-save'
import { resolveUjatProgramDisplayProgram } from '@/features/program/ujat/lib/ujat-program-display-program'
import {
  resolveUjatSurveyMenuItems,
  type UjatSurveyMenuItem,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import {
  isUjatPrimaryProgramId,
  looksLikeUjatProgramId,
} from '@/features/program/ujat/lib/is-ujat-primary-program'

export type { UjatSurveyMenuItem }

export function isUjatProgramId(programId: string): boolean {
  return isUjatPrimaryProgramId(programId) || looksLikeUjatProgramId(programId)
}

/** UJAT 목록·상세 URL에 쓸 수 있는 프로그램 id (Primary · mock · 로컬 등록) */
export function isResolvableUjatProgramId(programId: string): boolean {
  return (
    isUjatProgramId(programId) ||
    programId.startsWith(UJAT_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX) ||
    findUjatRegistrationLocalSaveProgramById(programId) != null
  )
}

/** 로컬 임시 저장본만 상세 placeholder로 복원. 시드 mock은 사용하지 않는다. */
export function resolveUjatProgramForDetail(programId: string): Program | undefined {
  const base = findUjatRegistrationLocalSaveProgramById(programId)
  return base ? resolveUjatProgramDisplayProgram(base) : undefined
}

/** UJAT는 봉사자 면접이 항상 있음 — 신청 목록 LNB 2depth 상시 노출 */
export function getUjatVolunteerInterviewEnabled(_program: Program): boolean {
  return true
}

/** 레거시 URL `tab` → 현행 키 */
export const UJAT_SURVEY_LEGACY_TAB_MAP: Record<string, string> = {
  'survey-student-satisfaction': 'survey-volunteer-satisfaction',
  'survey-teacher-satisfaction': 'survey-school-satisfaction',
  'survey-satisfaction': 'survey-volunteer-satisfaction',
}

/** 공통 정보 > 설문 진행 항목 기준 LNB 2depth (항목 1개여도 2depth) */
export function getUjatSurveyMenuItemsForProgram(program: Program): UjatSurveyMenuItem[] {
  return resolveUjatSurveyMenuItems(program)
}
