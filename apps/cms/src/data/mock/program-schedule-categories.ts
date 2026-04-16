/**
 * 대시보드 프로그램 일정 위젯: 일반 / 경제 / 제미나이 프로그램 분류
 * (메뉴 바로가기 배지 집계와 동일한 제미나이 판별 규칙)
 */

import type { Program } from '@/types/domain'
import type { User } from '@/types/user'
import { filterProgramsByACL } from '@/features/permission-request/lib/program-acl'
import { getEducationPrograms } from './education-programs'
import { getEconomyPrograms } from './economy-programs'

export type ProgramScheduleKind = 'general' | 'economy' | 'gemini'

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

export const PROGRAM_SCHEDULE_WIDGET_KEYS: Record<
  ProgramScheduleKind,
  | 'program-schedule-general-widget'
  | 'program-schedule-economy-widget'
  | 'program-schedule-gemini-widget'
> = {
  general: 'program-schedule-general-widget',
  economy: 'program-schedule-economy-widget',
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
    return ['general', 'economy', 'gemini']
  }

  const general = filterProgramsByACL(getGeneralEducationPrograms(), user)
  const economy = filterProgramsByACL(getEconomyPrograms(), user)
  const gemini = filterProgramsByACL(getGeminiPrograms(), user)

  const out: ProgramScheduleKind[] = []
  if (general.length > 0) out.push('general')
  if (economy.length > 0) out.push('economy')
  if (gemini.length > 0) out.push('gemini')
  return out
}
