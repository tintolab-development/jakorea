/**
 * 대시보드 프로그램 일정 위젯: 일반 / 1사1교 / UJAT / Gemini 프로그램 분류
 * (제미나이 판별은 제목 `제미나이` 포함 — 메뉴 Gemini와 동기화)
 * (UJAT 풀은 봉사·UJAT 루트와 동일: `getVolunteerPrograms()`)
 */

import type { Program } from '@/types/domain'
import type { User } from '@/types/user'
import { filterProgramsByACL } from '@/features/permission-request/lib/program-acl'
import { getEducationPrograms } from './education-programs'
import { getEconomyPrograms } from './economy-programs'
import { getVolunteerPrograms } from './volunteer-programs'

export type ProgramScheduleKind = 'general' | 'economy' | 'ujat' | 'gemini'

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

/** UJAT 프로그램(봉사) — `admin-dashboard-service` 배지 `programs-ujat`과 동일 풀 */
export function getUjatPrograms(): Program[] {
  return getVolunteerPrograms()
}

export const PROGRAM_SCHEDULE_WIDGET_KEYS: Record<
  ProgramScheduleKind,
  | 'program-schedule-general-widget'
  | 'program-schedule-economy-widget'
  | 'program-schedule-ujat-widget'
  | 'program-schedule-gemini-widget'
> = {
  general: 'program-schedule-general-widget',
  economy: 'program-schedule-economy-widget',
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
  if (user.adminLevel === 'MASTER') {
    return ['general', 'economy', 'ujat', 'gemini']
  }

  const general = filterProgramsByACL(getGeneralEducationPrograms(), user)
  const economy = filterProgramsByACL(getEconomyPrograms(), user)
  const ujat = filterProgramsByACL(getUjatPrograms(), user)
  const gemini = filterProgramsByACL(getGeminiPrograms(), user)

  const out: ProgramScheduleKind[] = []
  if (general.length > 0) out.push('general')
  if (economy.length > 0) out.push('economy')
  if (ujat.length > 0) out.push('ujat')
  if (gemini.length > 0) out.push('gemini')
  return out
}
