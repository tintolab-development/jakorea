/**
 * UJAT 프로그램 상세 LNB·설문·면접 분기용 메타 (mock)
 */

import type { Program } from '@/types/domain'
import {
  findUjatRegistrationLocalSaveProgramById,
  UJAT_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX,
} from '@/features/program/ujat/lib/ujat-registration-local-save'
import { mockUjatElementaryListProgramsMap } from '@/data/mock/ujat-programs-list-mock'
import { resolveUjatProgramDisplayProgram } from '@/features/program/ujat/lib/ujat-program-display-program'
import {
  resolveUjatSurveyMenuItems,
  type UjatSurveyMenuItem,
} from '@/features/program/ujat/lib/ujat-registration-basic-info-display'

export type { UjatSurveyMenuItem }

export function isUjatProgramId(programId: string): boolean {
  return mockUjatElementaryListProgramsMap.has(programId)
}

/** UJAT 목록·상세 URL에 쓸 수 있는 프로그램 id (mock 7단계·로컬 등록 저장본) */
export function isResolvableUjatProgramId(programId: string): boolean {
  return (
    isUjatProgramId(programId) ||
    programId.startsWith(UJAT_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX) ||
    findUjatRegistrationLocalSaveProgramById(programId) != null
  )
}

/** UJAT 목록·상세 mock 복원 — 템플릿 병합 포함 */
export function resolveUjatProgramForDetail(programId: string): Program | undefined {
  const base =
    mockUjatElementaryListProgramsMap.get(programId) ??
    findUjatRegistrationLocalSaveProgramById(programId)
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
