/**
 * 대시보드 프로그램 일정 위젯: 일반 / 1사1교 / UJAT / Gemini 분류.
 * 카탈로그 시드는 비운다. 위젯 노출은 관리자 역할만 보고, 행은 dashboard/programs API.
 */

import type { Program } from '@/types/domain'
import type { User } from '@/types/user'
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

export function getGeneralEducationPrograms(): Program[] {
  return []
}

export function getGeminiPrograms(): Program[] {
  return []
}

export function getUjatPrograms(): Program[] {
  return []
}

/** ACL mock 카탈로그 없이 관리자면 4유형 위젯 슬롯을 노출한다. 행은 remote. */
export function getProgramScheduleKindsForAdminUser(
  user: Omit<User, 'password'> | null
): ProgramScheduleKind[] {
  if (!user || user.role !== 'ADMIN') {
    return []
  }
  return [...SCHEDULE_KIND_ORDER]
}
