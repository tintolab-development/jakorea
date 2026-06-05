/**
 * 대시보드 프로그램 일정 위젯: 일반 / 1사1교 / UJAT / Gemini 프로그램 분류
 * (제미나이 판별은 제목 `제미나이` 포함 — 메뉴 Gemini와 동기화)
 * (UJAT 풀은 `mockUjatElementaryListPrograms` — `/programs/ujat` 목록과 동일)
 */

import type { Program } from '@/types/domain'
import type { User } from '@/types/user'
import { filterProgramsByACL } from '@/features/permission-request/lib/program-acl'
import { getEducationPrograms } from './education-programs'
import { mockUjatElementaryListPrograms } from './ujat-programs-list-mock'

export type ProgramScheduleKind = 'general' | 'company_school' | 'ujat' | 'gemini'

export function isGeminiProgram(program: Program): boolean {
  const t = `${program.title ?? ''}${program.mainTitle ?? ''}`
  return t.includes('제미나이')
}

/** 봉사 제외 교육 목록 중 제미나이 아님 (일반 교육 프로그램 일정) */
export function getGeneralEducationPrograms(): Program[] {
  return getEducationPrograms().filter(p => !isGeminiProgram(p))
}

export function getGeminiPrograms(): Program[] {
  return getEducationPrograms().filter(isGeminiProgram)
}

/** UJAT 프로그램 목록 — `/programs/ujat`·일정 위젯·배지와 동일 풀 (`mockUjatElementaryListPrograms`) */
export function getUjatPrograms(): Program[] {
  return mockUjatElementaryListPrograms
}

export const PROGRAM_SCHEDULE_WIDGET_KEYS: Record<
  ProgramScheduleKind,
  | 'program-schedule-general-widget'
  | 'program-schedule-company-school-widget'
  | 'program-schedule-ujat-widget'
  | 'program-schedule-gemini-widget'
> = {
  general: 'program-schedule-general-widget',
  company_school: 'program-schedule-company-school-widget',
  ujat: 'program-schedule-ujat-widget',
  gemini: 'program-schedule-gemini-widget',
}

/** ACL 기준으로 노출할 프로그램 일정 위젯 유형 (관리자 전용) */
export function getProgramScheduleKindsForAdminUser(
  user: Omit<User, 'password'> | null
): ProgramScheduleKind[] {
  if (!user || user.role !== 'ADMIN') {
    return []
  }
  // TODO(dashboard): 1사1교·UJAT·Gemini 일정 위젯은 추후 단계별 노출
  if (user.adminLevel === 'MASTER') {
    return ['general']
  }

  const general = filterProgramsByACL(getGeneralEducationPrograms(), user)
  return general.length > 0 ? ['general'] : []
}
