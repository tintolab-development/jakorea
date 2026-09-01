/**
 * 대시보드 프로그램 일정 위젯: 일반 / 1사1교 / UJAT / Gemini 프로그램 분류
 * (제미나이 판별은 제목 `제미나이` 포함 — 메뉴 Gemini와 동기화)
 * (UJAT 풀은 `mockUjatElementaryListPrograms` — `/programs/ujat` 목록과 동일)
 */

import type { Program } from '@/types/domain'
import type { User } from '@/types/user'
import { filterProgramsByACL } from '@/features/permission-request/lib/program-acl'
import { getCompanySchoolPrograms } from './economy-programs'
import { getEducationPrograms } from './education-programs'
import { mockUjatElementaryListPrograms } from './ujat-programs-list-mock'
import {
  PROGRAM_SCHEDULE_WIDGET_KEYS,
  type ProgramScheduleKind,
} from './program-schedule-keys'

const SCHEDULE_KIND_ORDER: readonly ProgramScheduleKind[] = [
  'general',
  'company_school',
  'ujat',
  'gemini',
]

export type { ProgramScheduleKind }
export { PROGRAM_SCHEDULE_WIDGET_KEYS }

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

/** ACL 기준으로 노출할 프로그램 일정 위젯 유형 (관리자 전용) */
export function getProgramScheduleKindsForAdminUser(
  user: Omit<User, 'password'> | null
): ProgramScheduleKind[] {
  if (!user || user.role !== 'ADMIN') {
    return []
  }
  if (user.adminLevel === 'MASTER') {
    return [...SCHEDULE_KIND_ORDER]
  }

  const pools: Array<[ProgramScheduleKind, Program[]]> = [
    ['general', getGeneralEducationPrograms()],
    ['company_school', getCompanySchoolPrograms()],
    ['ujat', getUjatPrograms()],
    ['gemini', getGeminiPrograms()],
  ]

  return pools
    .filter(([, programs]) => filterProgramsByACL(programs, user).length > 0)
    .map(([kind]) => kind)
}
