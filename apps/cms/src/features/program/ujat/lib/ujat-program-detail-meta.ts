/**
 * UJAT 프로그램 상세 LNB·설문·면접 분기용 메타 (mock)
 */

import type { Program } from '@/types/domain'
import {
  findUjatRegistrationLocalSaveProgramById,
  UJAT_REGISTRATION_LOCAL_PROGRAM_ID_PREFIX,
} from '@/features/program/ujat/lib/ujat-registration-local-save'
import { mockUjatElementaryListProgramsMap } from '@/data/mock/ujat-programs-list-mock'

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

/** 스토어 `programs` 로드 전에도 상세 모달 복원용 */
export function resolveUjatProgramForDetail(programId: string): Program | undefined {
  return (
    mockUjatElementaryListProgramsMap.get(programId) ??
    findUjatRegistrationLocalSaveProgramById(programId)
  )
}

/** true면 봉사자 신청 LNB에 면접 단계(2·3뎁스) 노출 */
export function getUjatVolunteerInterviewEnabled(programId: string): boolean {
  const p = mockUjatElementaryListProgramsMap.get(programId)
  if (!p) return true
  // 진행 예정 단계는 면접 분기 없이 단순 목록만 (요구: 없으면 2depth 없음)
  if (p.ujatProgressStatus === 'EDUCATION_SCHEDULED') return false
  return true
}

export type UjatSurveyMenuItem = { key: string; label: string }

/** 설문 관리 LNB 2뎁스 — 프로그램별 노출 항목 (mock) */
export function getUjatSurveyMenuItems(programId: string): UjatSurveyMenuItem[] {
  void programId
  return [
    { key: 'survey-poll', label: '설문조사' },
    { key: 'survey-satisfaction', label: '만족도 조사' },
    { key: 'survey-lecture-eval', label: '강의평가' },
  ]
}

/** 레거시 URL `tab` → 현행 키 */
export const UJAT_SURVEY_LEGACY_TAB_MAP: Record<string, string> = {
  'survey-student-satisfaction': 'survey-satisfaction',
  'survey-teacher-satisfaction': 'survey-satisfaction',
}

/** 진행 예정 프로그램은 설문 항목 일부만 노출 예시 */
export function getUjatSurveyMenuItemsForProgram(programId: string): UjatSurveyMenuItem[] {
  const p = mockUjatElementaryListProgramsMap.get(programId)
  const all = getUjatSurveyMenuItems(programId)
  if (p?.ujatProgressStatus === 'EDUCATION_SCHEDULED') {
    const sliced = all.slice(0, 1)
    return sliced.length > 0 ? sliced : all
  }
  return all.length > 0 ? all : [{ key: 'survey-poll', label: '설문조사' }]
}
